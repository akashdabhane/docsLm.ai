from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.notebook import NotebookCreate, NotebookUpdate, NotebookResponse
from app.core.database import get_database, parse_object_id, serialize_doc
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/notebooks", tags=["Notebooks"])


@router.get("", response_model=List[NotebookResponse])
async def list_notebooks(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = parse_object_id(current_user["id"])
    
    cursor = db.notebooks.find({"user_id": user_id}).sort("created_at", -1)
    notebooks = await cursor.to_list(length=100)
    
    res = []
    for nb in notebooks:
        nb_id = nb["_id"]
        doc_count = await db.documents.count_documents({"notebook_id": nb_id})
        nb_dict = serialize_doc(nb)
        nb_dict["document_count"] = doc_count
        res.append(nb_dict)
        
    return res


@router.post("", response_model=NotebookResponse, status_code=201)
async def create_notebook(
    notebook_data: NotebookCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    doc = {
        "user_id": user_id,
        "title": notebook_data.title,
        "description": notebook_data.description or "",
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.notebooks.insert_one(doc)
    doc["_id"] = result.inserted_id
    res = serialize_doc(doc)
    res["document_count"] = 0
    return res


@router.get("/{id}", response_model=NotebookResponse)
async def get_notebook(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    nb_id = parse_object_id(id)
    user_id = parse_object_id(current_user["id"])
    
    nb = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
        
    doc_count = await db.documents.count_documents({"notebook_id": nb_id})
    res = serialize_doc(nb)
    res["document_count"] = doc_count
    return res


@router.delete("/{id}")
async def delete_notebook(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    nb_id = parse_object_id(id)
    user_id = parse_object_id(current_user["id"])
    
    nb = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
        
    # Delete associated documents, conversations, studio outputs
    await db.documents.delete_many({"notebook_id": nb_id})
    conversations = await db.conversations.find({"notebook_id": nb_id}).to_list(100)
    for c in conversations:
        await db.messages.delete_many({"conversation_id": c["_id"]})
    await db.conversations.delete_many({"notebook_id": nb_id})
    await db.studio_outputs.delete_many({"notebook_id": nb_id})
    
    # Delete notebook record
    await db.notebooks.delete_one({"_id": nb_id})
    
    return {"message": "Notebook and related resources deleted successfully"}

