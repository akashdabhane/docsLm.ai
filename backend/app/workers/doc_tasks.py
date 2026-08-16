import os
import logging
from datetime import datetime, timezone
from app.core.database import get_sync_db, parse_object_id
from app.services.document_service import DocumentProcessor
from app.services.storage_service import StorageService
from app.services.retrieval_service import RetrievalService

logger = logging.getLogger(__name__)

def process_document_task(document_id: str, notebook_id: str, storage_key: str, filename: str, file_type: str):
    """
    Background worker function that parses a document, generates structure-aware chunks,
    creates vector embeddings, upserts into Pinecone/vector store, and updates MongoDB status.
    """
    db = get_sync_db()
    doc_oid = parse_object_id(document_id)
    
    try:
        logger.info(f"Starting background processing for document {document_id} ({filename})")
        
        # Update status to PROCESSING
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"status": "PROCESSING", "updated_at": datetime.now(timezone.utc)}}
        )
        
        local_file_path = StorageService.get_local_path(storage_key)
        if not os.path.exists(local_file_path):
            raise FileNotFoundError(f"File not found at path: {local_file_path}")

        # Process & chunk document
        chunks, page_count = DocumentProcessor.process_and_chunk(
            file_path=local_file_path,
            file_type=file_type,
            document_id=document_id,
            notebook_id=notebook_id,
            filename=filename
        )

        # Upsert vector embeddings to Pinecone / Vector DB
        RetrievalService.upsert_chunks(notebook_id=notebook_id, chunks=chunks)

        # Mark PROCESSED
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {
                "status": "PROCESSED",
                "page_count": page_count,
                "processing_error": None,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        logger.info(f"Document {document_id} successfully processed and indexed!")
        return True

    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}", exc_info=True)
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {
                "status": "FAILED",
                "processing_error": str(e),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return False
