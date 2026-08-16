import os
import re
import logging
from typing import List, Dict, Any, Tuple
import pymupdf  # PyMuPDF
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

class DocumentProcessor:
    @staticmethod
    def parse_pdf(file_path: str) -> Tuple[List[Dict[str, Any]], int]:
        """
        Parses a PDF document using PyMuPDF (fitz).
        Returns a list of page objects with text, page number, and section titles, plus total page count.
        """
        pages = []
        doc = pymupdf.open(file_path)
        total_pages = len(doc)
        
        current_section = "General"
        
        for page_num in range(total_pages):
            page = doc[page_num]
            text = page.get_text("text") or ""
            
            # Simple header detection from page text lines
            lines = [line.strip() for line in text.split("\n") if line.strip()]
            if lines:
                # If first line looks like a header (short, capitalized or title-like)
                first_line = lines[0]
                if len(first_line) < 80 and not first_line.endswith("."):
                    current_section = first_line

            # OCR Fallback check for scanned PDF pages
            if len(text.strip()) < 30:
                try:
                    import pytesseract
                    from pdf2image import convert_from_path
                    # Render page to pixmap image using fitz
                    pix = page.get_pixmap()
                    img_path = f"{file_path}_temp_page_{page_num}.png"
                    pix.save(img_path)
                    
                    ocr_text = pytesseract.image_to_string(img_path)
                    if os.path.exists(img_path):
                        os.remove(img_path)
                    if ocr_text.strip():
                        text = ocr_text.strip()
                except Exception as ocr_err:
                    logger.warning(f"OCR fallback skipped/failed on page {page_num + 1}: {ocr_err}")

            pages.append({
                "page_number": page_num + 1,
                "section": current_section,
                "text": text.strip()
            })

        doc.close()
        return pages, total_pages

    @staticmethod
    def parse_docx(file_path: str) -> Tuple[List[Dict[str, Any]], int]:
        """
        Parses a DOCX document using python-docx.
        Simulates page/section tracking.
        """
        doc = docx.Document(file_path)
        pages = []
        current_section = "Introduction"
        current_text = []
        page_num = 1
        paragraph_count = 0

        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            
            # Heading styles
            if p.style.name.startswith("Heading"):
                current_section = text
            
            current_text.append(text)
            paragraph_count += 1
            
            # Group every ~10 paragraphs or ~2500 chars as a virtual page
            joined = "\n".join(current_text)
            if len(joined) > 2500 or paragraph_count >= 12:
                pages.append({
                    "page_number": page_num,
                    "section": current_section,
                    "text": joined
                })
                page_num += 1
                current_text = []
                paragraph_count = 0
                
        if current_text:
            pages.append({
                "page_number": page_num,
                "section": current_section,
                "text": "\n".join(current_text)
            })

        return pages, max(1, page_num)

    @staticmethod
    def parse_txt_or_md(file_path: str) -> Tuple[List[Dict[str, Any]], int]:
        """
        Parses TXT or Markdown document, recognizing headings (#, ##).
        """
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        pages = []
        current_section = "Overview"
        lines = content.split("\n")
        current_text = []
        page_num = 1
        
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("#"):
                # Heading line
                current_section = stripped.lstrip("#").strip()
            
            current_text.append(line)
            joined = "\n".join(current_text)
            if len(joined) > 2000:
                pages.append({
                    "page_number": page_num,
                    "section": current_section,
                    "text": joined
                })
                page_num += 1
                current_text = []
                
        if current_text:
            pages.append({
                "page_number": page_num,
                "section": current_section,
                "text": "\n".join(current_text)
            })

        return pages, max(1, page_num)

    @classmethod
    def process_and_chunk(
        cls,
        file_path: str,
        file_type: str,
        document_id: str,
        notebook_id: str,
        filename: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 150
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Parses file based on file extension and splits text into structure-aware chunks.
        """
        ext = file_type.lower().lstrip(".")
        if ext == "pdf":
            parsed_pages, page_count = cls.parse_pdf(file_path)
        elif ext in ["docx", "doc"]:
            parsed_pages, page_count = cls.parse_docx(file_path)
        elif ext in ["txt", "md", "markdown"]:
            parsed_pages, page_count = cls.parse_txt_or_md(file_path)
        else:
            # Fallback text parser
            parsed_pages, page_count = cls.parse_txt_or_md(file_path)

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

        all_chunks = []
        global_chunk_idx = 0

        for page in parsed_pages:
            page_text = page["text"]
            if not page_text:
                continue

            split_texts = text_splitter.split_text(page_text)
            for snippet in split_texts:
                if not snippet.strip():
                    continue
                
                chunk_meta = {
                    "chunk_id": f"{document_id}_{global_chunk_idx}",
                    "document_id": document_id,
                    "notebook_id": notebook_id,
                    "filename": filename,
                    "page_number": page["page_number"],
                    "section": page["section"],
                    "chunk_index": global_chunk_idx,
                    "text": snippet
                }
                all_chunks.append(chunk_meta)
                global_chunk_idx += 1

        logger.info(f"Processed file {filename}: {page_count} pages, {len(all_chunks)} chunks created.")
        return all_chunks, page_count
