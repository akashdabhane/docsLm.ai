from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from app.schemas.studio import MindMapRequest, PodcastRequest, StudioOutputResponse
from app.core.database import get_database, parse_object_id, serialize_doc
from app.agents.mindmap_graph import generate_mindmap_json
from app.agents.slides_graph import generate_slide_deck_json
from app.agents.quiz_graph import generate_quiz_json
from app.agents.flashcards_graph import generate_flashcards_json
from app.workers.studio_tasks import process_podcast_task
from app.api.deps import get_current_user

router = APIRouter(tags=["Studio Features"])


@router.get("/api/notebooks/{notebook_id}/studio/outputs", response_model=List[StudioOutputResponse])
async def list_studio_outputs(notebook_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    
    cursor = db.studio_outputs.find({"notebook_id": nb_id, "user_id": user_id}).sort("created_at", -1)
    outputs = await cursor.to_list(length=100)
    return [serialize_doc(o) for o in outputs]


@router.post("/api/notebooks/{notebook_id}/studio/mindmap", response_model=StudioOutputResponse)
async def create_mindmap(
    notebook_id: str,
    req: MindMapRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    notebook = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    mindmap_data = await generate_mindmap_json(notebook_id=notebook_id, custom_prompt=req.custom_prompt)

    doc = {
        "notebook_id": nb_id,
        "user_id": user_id,
        "type": "MIND_MAP",
        "status": "COMPLETED",
        "input": {"prompt": req.custom_prompt},
        "output": mindmap_data,
        "storage_url": None,
        "created_at": now,
        "updated_at": now
    }

    result = await db.studio_outputs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.post("/api/notebooks/{notebook_id}/studio/slides", response_model=StudioOutputResponse)
async def create_slide_deck(
    notebook_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    notebook = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    slides_data = await generate_slide_deck_json(notebook_id=notebook_id)

    doc = {
        "notebook_id": nb_id,
        "user_id": user_id,
        "type": "SLIDE_DECK",
        "status": "COMPLETED",
        "input": {},
        "output": slides_data,
        "storage_url": None,
        "created_at": now,
        "updated_at": now
    }

    result = await db.studio_outputs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.post("/api/notebooks/{notebook_id}/studio/quiz", response_model=StudioOutputResponse)
async def create_quiz(
    notebook_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    notebook = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    quiz_data = await generate_quiz_json(notebook_id=notebook_id)

    doc = {
        "notebook_id": nb_id,
        "user_id": user_id,
        "type": "QUIZ",
        "status": "COMPLETED",
        "input": {},
        "output": quiz_data,
        "storage_url": None,
        "created_at": now,
        "updated_at": now
    }

    result = await db.studio_outputs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.post("/api/notebooks/{notebook_id}/studio/flashcards", response_model=StudioOutputResponse)
async def create_flashcards(
    notebook_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    notebook = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    flashcards_data = await generate_flashcards_json(notebook_id=notebook_id)

    doc = {
        "notebook_id": nb_id,
        "user_id": user_id,
        "type": "FLASHCARDS",
        "status": "COMPLETED",
        "input": {},
        "output": flashcards_data,
        "storage_url": None,
        "created_at": now,
        "updated_at": now
    }

    result = await db.studio_outputs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.post("/api/notebooks/{notebook_id}/studio/podcast", response_model=StudioOutputResponse, status_code=202)
async def create_podcast(
    notebook_id: str,
    req: PodcastRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    nb_id = parse_object_id(notebook_id)
    user_id = parse_object_id(current_user["id"])
    now = datetime.now(timezone.utc)
    
    notebook = await db.notebooks.find_one({"_id": nb_id, "user_id": user_id})
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    doc = {
        "notebook_id": nb_id,
        "user_id": user_id,
        "type": "PODCAST",
        "status": "PENDING",
        "input": {"host1": req.host1_name, "host2": req.host2_name, "tone": req.tone},
        "output": None,
        "storage_url": None,
        "created_at": now,
        "updated_at": now
    }

    result = await db.studio_outputs.insert_one(doc)
    studio_id_str = str(result.inserted_id)
    doc["_id"] = result.inserted_id

    background_tasks.add_task(
        process_podcast_task,
        studio_output_id=studio_id_str,
        notebook_id=notebook_id,
        host1_name=req.host1_name or "Host A",
        host2_name=req.host2_name or "Host B"
    )

    return serialize_doc(doc)


@router.get("/api/studio/outputs/{id}", response_model=StudioOutputResponse)
async def get_studio_output(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    output_id = parse_object_id(id)
    user_id = parse_object_id(current_user["id"])
    
    out = await db.studio_outputs.find_one({"_id": output_id, "user_id": user_id})
    if not out:
        raise HTTPException(status_code=404, detail="Studio output not found")
        
    return serialize_doc(out)

