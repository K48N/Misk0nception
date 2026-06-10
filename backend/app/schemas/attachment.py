"""
Attachment schemas for API validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AttachmentResponse(BaseModel):
    """Schema for attachment response"""
    id: int
    note_id: int
    filename: str
    filepath: str
    filetype: Optional[str]
    filesize: Optional[int]
    filesize_str: str
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @staticmethod
    def format_filesize(size: Optional[int]) -> str:
        """Format filesize as human-readable string"""
        if not size:
            return "Unknown"
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"


class AudioAttachmentResponse(BaseModel):
    """Schema for audio attachment response"""
    id: int
    note_id: int
    filename: str
    filepath: str
    duration: int
    duration_str: str
    filesize: int
    filesize_str: str
    format: str
    transcription_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
