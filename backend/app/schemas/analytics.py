"""
Analytics and study session schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict


class PomodoroSessionCreate(BaseModel):
    """Schema for creating a pomodoro session"""
    course_id: Optional[int] = None
    note_id: Optional[int] = None
    duration_minutes: int = Field(25, ge=1, le=60)
    completed: bool = True
    session_type: str = Field("work", pattern="^(work|break)$")


class PomodoroSessionResponse(BaseModel):
    """Schema for pomodoro session response"""
    id: int
    course_id: Optional[int]
    note_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: int
    completed: bool
    session_type: str
    
    class Config:
        from_attributes = True


class StudySessionResponse(BaseModel):
    """Schema for study session response"""
    id: int
    course_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: int
    activity_type: Optional[str]
    
    class Config:
        from_attributes = True


class UsageDataResponse(BaseModel):
    """Schema for contribution graph data"""
    date: str  # YYYY-MM-DD format
    count: int


class StudyAnalyticsResponse(BaseModel):
    """Schema for study analytics summary"""
    total_study_time: int  # minutes
    total_pomodoros: int
    total_sessions: int
    average_session_duration: float
    most_studied_course: Optional[str]
    study_streak: int
    usage_data: Dict[str, int]  # date -> count mapping
