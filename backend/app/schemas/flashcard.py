"""
Flashcard schemas for API validation
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class FlashcardDeckCreate(BaseModel):
    """Schema for creating a flashcard deck"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    note_id: Optional[int] = None
    note_ids: Optional[List[int]] = None  # Support multiple notes for generation


class FlashcardDeckUpdate(BaseModel):
    """Schema for updating a flashcard deck"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class FlashcardCardResponse(BaseModel):
    """Schema for flashcard card response"""
    id: int
    deck_id: int
    front: str
    back: str
    ease_factor: float
    interval_days: float
    times_reviewed: int
    last_reviewed: Optional[datetime]
    next_review: datetime
    correct_streak: int
    total_correct: int
    total_wrong: int
    is_mastered: bool
    difficulty_label: str
    accuracy: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class FlashcardDeckResponse(BaseModel):
    """Schema for flashcard deck response"""
    id: int
    name: str
    description: Optional[str]
    note_id: Optional[int]
    created_at: datetime
    card_count: int
    
    class Config:
        from_attributes = True


class FlashcardDeckWithCards(FlashcardDeckResponse):
    """Deck with cards included"""
    cards: List[FlashcardCardResponse] = []
    
    class Config:
        from_attributes = True


class CardReviewRequest(BaseModel):
    """Schema for submitting a card review"""
    card_id: int
    quality: int = Field(..., ge=0, le=5, description="Quality rating 0-5")
    time_taken_seconds: int = Field(0, ge=0)


class CardReviewResponse(BaseModel):
    """Schema for review response"""
    card_id: int
    next_review: datetime
    interval_days: float
    is_mastered: bool
    message: str
