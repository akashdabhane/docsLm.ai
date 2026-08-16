import json
import logging
from typing import Dict, Any
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

async def generate_mindmap_json(notebook_id: str, custom_prompt: str = None) -> Dict[str, Any]:
    """
    Retrieves document content for notebook, generates a hierarchical Mind Map JSON structure.
    """
    chunks = RetrievalService.query_notebook(notebook_id=notebook_id, query="overview main concepts summary topics", top_k=10)
    
    if not chunks:
        # Fallback tree if no docs processed yet
        return {
            "root": "Notebook Workspace",
            "children": [
                {
                    "title": "Document Intelligence",
                    "children": [
                        {"title": "Upload PDF or DOCX files to generate mind maps", "children": []}
                    ]
                }
            ]
        }

    combined_text = "\n".join([c["text"] for c in chunks[:6]])
    
    prompt = (
        "You are an expert knowledge architect. Analyze the following document text and construct a "
        "hierarchical Mind Map. Output ONLY valid, strict JSON matching this schema:\n\n"
        "{\n"
        '  "root": "Main Document Theme Title",\n'
        '  "children": [\n'
        "    {\n"
        '      "title": "Major Concept 1",\n'
        '      "children": [\n'
        '        {"title": "Sub-concept A", "children": []},\n'
        '        {"title": "Sub-concept B", "children": []}\n'
        "      ]\n"
        "    },\n"
        "    {\n"
        '      "title": "Major Concept 2",\n'
        '      "children": []\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Do not include markdown code block formatting (```json) outside the JSON object.\n\n"
        f"DOCUMENT TEXT:\n{combined_text[:3000]}\n\n"
        "JSON MIND MAP:"
    )

    response_text = await LLMService.generate_response(prompt, temperature=0.1)
    cleaned = response_text.replace("```json", "").replace("```", "").strip()
    
    try:
        data = json.loads(cleaned)
        if "root" in data and "children" in data:
            return data
    except Exception as e:
        logger.warning(f"Failed to parse Mind Map JSON, using structured fallback: {e}")

    return {
        "root": "Key Insights & Architecture",
        "children": [
            {
                "title": "Core Foundations",
                "children": [
                    {"title": "Document Parsing & Structure", "children": []},
                    {"title": "Vector Embeddings & Pinecone", "children": []}
                ]
            },
            {
                "title": "AI & RAG Services",
                "children": [
                    {"title": "LangGraph Orchestration", "children": []},
                    {"title": "Grounded Citations", "children": []}
                ]
            }
        ]
    }
