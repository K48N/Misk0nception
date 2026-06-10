"""
Course schemas for API validation
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .note import NoteResponse


class CourseBase(BaseModel):
    """Base course schema"""
    name: str = Field(..., min_length=1, max_length=200, description="Course name")
    code: Optional[str] = Field(None, max_length=50, description="Course code (e.g., CS101)")
    color: str = Field("#009682", pattern="^#[0-9A-Fa-f]{6}$", description="Hex color code")
    icon: str = Field("📚", max_length=10, description="Emoji icon")
    description: Optional[str] = Field(None, description="Course description")


class CourseCreate(CourseBase):
    """Schema for creating a course"""
    pass


class CourseUpdate(BaseModel):
    """Schema for updating a course (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=10)
    description: Optional[str] = None


class CourseResponse(CourseBase):
    """Schema for course response"""
    id: int
    created_at: datetime
    note_count: int = 0
    
    class Config:
        from_attributes = True
