from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NotebookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = ""

class NotebookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class NotebookResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = ""
    document_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
