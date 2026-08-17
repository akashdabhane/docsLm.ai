import os
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks, status
from app.schemas.document import DocumentResponse
from app.core.database import get_database, parse_object_id, serialize_doc
from app.services.storage_service import StorageService
from app.services.retrieval_service import RetrievalService
from app.workers.doc_tasks import process_document_task
from app.api.deps import get_current_user

router = APIRouter(tags=["Documents"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "md", "markdown"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/api/notebooks/{notebook_id}/documents", response_model=DocumentResponse, status_code=202)
async def upload_document(
    notebook_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    
    # 1. Verify notebook ownership
    notebook = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found or access denied")
        
    # 2. File type validation
    filename = file.filename or "document.txt"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type .{ext}. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    # 3. File size validation
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 25MB")
        
    # 4. Upload file to object/local storage
    subfolder = f"user_{current_user['id']}/notebook_{notebook_id}"
    storage_url, storage_key = await StorageService.upload_file(contents, filename, subfolder)
    
    # 5. Create document record in MongoDB
    now = datetime.now(timezone.utc)
    doc_record = {
        "notebook_id": nb_id,
        "user_id": user_id,
        "filename": filename,
        "file_type": ext,
        "file_size": file_size,
        "storage_url": storage_url,
        "storage_key": storage_key,
        "status": "PROCESSING",
        "page_count": 0,
        "processing_error": None,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.documents.insert_one(doc_record)
    doc_id_str = str(result.inserted_id)
    doc_record["_id"] = result.inserted_id
    
    # 6. Trigger background processing job
    background_tasks.add_task(
        process_document_task,
        document_id=doc_id_str,
        notebook_id=notebook_id,
        storage_key=storage_key,
        filename=filename,
        file_type=ext
    )
    
    return serialize_doc(doc_record)


@router.get("/api/notebooks/{notebook_id}/documents", response_model=List[DocumentResponse])
async def list_documents(notebook_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    
    # Verify notebook ownership
    notebook = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
        
    cursor = db.documents.find({"notebook_id": nb_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [serialize_doc(d) for d in docs]


@router.get("/api/documents/{id}", response_model=DocumentResponse)
async def get_document(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    doc_id = parse_object_id(id)
    user_id = parse_object_id(current_user["id"])
    
    doc = await db.documents.find_one({"_id": doc_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return serialize_doc(doc)


@router.delete("/api/documents/{id}")
async def delete_document(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    doc_id = parse_object_id(id)
    user_id = parse_object_id(current_user["id"])
    
    doc = await db.documents.find_one({"_id": doc_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    notebook_id_str = str(doc["notebook_id"])
    storage_key = doc.get("storage_key")
    
    # Delete from Pinecone / Vector store
    RetrievalService.delete_document_vectors(notebook_id_str, id)
    
    # Delete file from storage
    if storage_key:
        await StorageService.delete_file(storage_key)
        
    # Delete MongoDB record
    await db.documents.delete_one({"_id": doc_id})
    
    return {"message": "Document deleted successfully"}
