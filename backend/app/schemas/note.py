"""
Note schemas for API validation
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .attachment import AttachmentResponse


class NoteBase(BaseModel):
    """Base note schema"""
    title: str = Field(..., min_length=1, max_length=300, description="Note title")
    content: str = Field("", description="Note content (HTML or Markdown)")
    course_id: int = Field(..., description="Parent course ID")


class NoteCreate(NoteBase):
    """Schema for creating a note"""
    tag_ids: List[int] = Field(default_factory=list, description="Tag IDs to associate")


class NoteUpdate(BaseModel):
    """Schema for updating a note (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    content: Optional[str] = None
    course_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class NoteResponse(NoteBase):
    """Schema for note response"""
    id: int
    created_at: datetime
    updated_at: datetime
    tags: List["TagInNote"] = []
    attachment_count: int = 0
    
    class Config:
        from_attributes = True


class TagInNote(BaseModel):
    """Minimal tag info for note response"""
    id: int
    name: str
    color: str
    
    class Config:
        from_attributes = True
