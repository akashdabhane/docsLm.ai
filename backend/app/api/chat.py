import json
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.responses import StreamingResponse

from app.schemas.chat import ConversationResponse, MessageResponse, MessageCreate, ConversationCreate
from app.core.database import get_database, parse_object_id, serialize_doc
from app.agents.rag_graph import run_rag_pipeline
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService
from app.api.deps import get_current_user

router = APIRouter(tags=["Conversations & Chat"])

@router.get("/api/notebooks/{notebook_id}/conversations", response_model=List[ConversationResponse])
async def list_conversations(notebook_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    
    cursor = db.conversations.find({"notebook_id": nb_id, "user_id": user_id}).sort("updated_at", -1)
    convs = await cursor.to_list(length=100)
    return [serialize_doc(c) for c in convs]

@router.post("/api/notebooks/{notebook_id}/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    notebook_id: str,
    conv_data: ConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    doc = {
        "notebook_id": nb_id,
        "user_id": user_id,
        "title": conv_data.title or "New Conversation",
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.conversations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.get("/api/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    conv_id = parse_object_id(conversation_id)
    
    cursor = db.messages.find({"conversation_id": conv_id}).sort("created_at", 1)
    msgs = await cursor.to_list(length=500)
    return [serialize_doc(m) for m in msgs]

@router.post("/api/notebooks/{notebook_id}/chat/stream")
async def stream_chat(
    notebook_id: str,
    msg_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    # 1. Get or create conversation
    conv_id_str = msg_data.conversation_id
    if not conv_id_str:
        conv_doc = {
            "notebook_id": nb_id,
            "user_id": user_id,
            "title": msg_data.content[:40] or "New Conversation",
            "created_at": now,
            "updated_at": now
        }
        res = await db.conversations.insert_one(conv_doc)
        conv_id_str = str(res.inserted_id)
        conv_id = res.inserted_id
    else:
        conv_id = parse_object_id(conv_id_str)

    # 2. Save User Message
    user_msg_doc = {
        "conversation_id": conv_id,
        "role": "user",
        "content": msg_data.content,
        "citations": [],
        "created_at": now
    }
    await db.messages.insert_one(user_msg_doc)

    # 3. Run RAG Pipeline with LangGraph
    rag_result = await run_rag_pipeline(question=msg_data.content, notebook_id=notebook_id)
    full_answer = rag_result["answer"]
    citations = rag_result["citations"]

    # 4. Save Assistant Message
    assistant_msg_doc = {
        "conversation_id": conv_id,
        "role": "assistant",
        "content": full_answer,
        "citations": citations,
        "created_at": datetime.now(timezone.utc)
    }
    await db.messages.insert_one(assistant_msg_doc)
    
    # Update conversation updated_at
    await db.conversations.update_one(
        {"_id": conv_id},
        {"$set": {"updated_at": datetime.now(timezone.utc)}}
    )

    # 5. Generator for Server-Sent Events (SSE)
    async def sse_event_generator():
        # Yield metadata event (conversation_id)
        yield f"event: metadata\ndata: {json.dumps({'conversation_id': conv_id_str})}\n\n"
        
        # Stream response text chunks
        words = full_answer.split(" ")
        for w in words:
            yield f"event: token\ndata: {json.dumps({'token': w + ' '})}\n\n"
            await asyncio.sleep(0.015)
            
        # Yield final citations event
        yield f"event: citations\ndata: {json.dumps({'citations': citations})}\n\n"
        yield f"event: done\ndata: {json.dumps({'status': 'complete'})}\n\n"

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")
