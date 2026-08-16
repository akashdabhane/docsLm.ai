from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

class MindMapRequest(BaseModel):
    custom_prompt: Optional[str] = None

class PodcastRequest(BaseModel):
    host1_name: Optional[str] = "Host A (Alex)"
    host2_name: Optional[str] = "Host B (Taylor)"
    tone: Optional[str] = "engaging and informative"

class StudioOutputResponse(BaseModel):
    id: str
    notebook_id: str
    user_id: str
    type: str  # MIND_MAP, PODCAST, SUMMARY, FLASHCARDS, QUIZ
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    storage_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
