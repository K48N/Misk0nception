"""
Tag schemas for API validation
"""
from pydantic import BaseModel, Field
from typing import Optional


class TagBase(BaseModel):
    """Base tag schema"""
    name: str = Field(..., min_length=1, max_length=50, description="Tag name")
    color: str = Field("#6b7280", pattern="^#[0-9A-Fa-f]{6}$", description="Hex color code")


class TagCreate(TagBase):
    """Schema for creating a tag"""
    pass


class TagUpdate(BaseModel):
    """Schema for updating a tag"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class TagResponse(TagBase):
    """Schema for tag response"""
    id: int
    note_count: int = 0
    
    class Config:
        from_attributes = True
