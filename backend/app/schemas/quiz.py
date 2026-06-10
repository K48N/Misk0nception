"""
Quiz schemas for API validation
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


class QuizAttemptCreate(BaseModel):
    """Schema for creating a quiz attempt"""
    course_id: int
    quiz_title: str
    questions_json: str  # JSON string
    total_questions: int = Field(..., ge=1)
    correct_answers: int = Field(..., ge=0)
    wrong_answers: int = Field(..., ge=0)
    time_taken_seconds: int = Field(0, ge=0)


class QuizAttemptResponse(BaseModel):
    """Schema for quiz attempt response"""
    id: int
    course_id: int
    quiz_title: str
    created_at: datetime
    total_questions: int
    correct_answers: int
    wrong_answers: int
    score_percentage: float
    time_taken_seconds: int
    grade: str
    emoji: str
    
    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    """Schema for user statistics response"""
    id: int
    total_quizzes: int
    total_questions_answered: int
    total_correct: int
    total_wrong: int
    current_streak: int
    best_streak: int
    last_quiz_date: Optional[datetime]
    average_score: float
    perfect_scores: int
    total_study_time_minutes: int
    accuracy_percentage: float
    level: int
    progress_to_next_level: float
    
    class Config:
        from_attributes = True


class AchievementResponse(BaseModel):
    """Schema for achievement response"""
    id: int
    name: str
    description: Optional[str]
    icon: Optional[str]
    unlocked_at: datetime
    achievement_type: Optional[str]
    threshold: Optional[int]
    
    class Config:
        from_attributes = True
