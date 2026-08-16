from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class MessageCreate(BaseModel):
    content: str
    conversation_id: Optional[str] = None

class CitationItem(BaseModel):
    citation_id: str
    document_id: str
    filename: str
    page_number: int
    section: Optional[str] = ""
    text_snippet: str

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    citations: List[CitationItem] = []
    created_at: Optional[datetime] = None

class ConversationResponse(BaseModel):
    id: str
    notebook_id: str
    user_id: str
    title: str
    last_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
