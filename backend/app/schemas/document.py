from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentResponse(BaseModel):
    id: str
    notebook_id: str
    user_id: str
    filename: str
    file_type: str
    file_size: int
    storage_url: str
    status: str  # UPLOADED, PROCESSING, PROCESSED, FAILED
    page_count: Optional[int] = 0
    processing_error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
