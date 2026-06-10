"""
AI tool request/response schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AISummaryRequest(BaseModel):
    """Request schema for AI summary generation"""
    text: str = Field(..., min_length=1, description="Text content to summarize")
    max_length: Optional[int] = Field(None, ge=50, le=1000, description="Max summary length in words")
    style: Optional[str] = Field('comprehensive', description="Summary style: comprehensive, bullet, exam, beginner, advanced, lecture")


class AISummaryResponse(BaseModel):
    """Response schema for AI summary"""
    summary: str
    original_length: int
    summary_length: int


class AIQuizRequest(BaseModel):
    """Request schema for AI quiz generation"""
    text: str = Field(..., min_length=1, description="Text content for quiz")
    num_questions: int = Field(5, ge=1, le=20, description="Number of questions to generate")
    difficulty: Optional[str] = Field("medium", pattern="^(easy|medium|hard)$")


class AIQuizQuestion(BaseModel):
    """Single quiz question"""
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None


class AIQuizResponse(BaseModel):
    """Response schema for AI quiz"""
    questions: List[AIQuizQuestion]
    total_questions: int


class AIFlashcardsRequest(BaseModel):
    """Request schema for AI flashcard generation"""
    text: str = Field(..., min_length=1, description="Text content for flashcards")
    num_cards: int = Field(10, ge=1, le=50, description="Number of flashcards to generate")


class AIFlashcard(BaseModel):
    """Single flashcard"""
    front: str
    back: str


class AIFlashcardsResponse(BaseModel):
    """Response schema for AI flashcards"""
    flashcards: List[AIFlashcard]
    total_cards: int


class AIOutlineRequest(BaseModel):
    """Request schema for AI outline generation"""
    text: str = Field(..., min_length=1, description="Text content to outline")


class AIOutlineResponse(BaseModel):
    """Response schema for AI outline"""
    outline: str  # Markdown formatted outline


class AITagsRequest(BaseModel):
    """Request schema for AI tag suggestions"""
    text: str = Field(..., min_length=1, description="Text content to analyze")
    max_tags: int = Field(5, ge=1, le=10, description="Maximum number of tags")


class AITagsResponse(BaseModel):
    """Response schema for AI tags"""
    tags: List[str]


class AIChatRequest(BaseModel):
    """Request schema for AI tutor chat"""
    message: str = Field(..., min_length=1, description="User message")
    context: Optional[str] = Field(None, description="Additional context (e.g., note content)")
    conversation_history: Optional[List[dict]] = Field(None, description="Previous messages")


class AIChatResponse(BaseModel):
    """Response schema for AI chat"""
    response: str
    confidence: Optional[float] = None


class AIGrammarRequest(BaseModel):
    """Request schema for grammar checking"""
    text: str = Field(..., min_length=1, description="Text to check")


class AIGrammarResponse(BaseModel):
    """Response schema for grammar checking"""
    corrected_text: str
    suggestions: List[dict]
    has_errors: bool


# Saved Quiz Schemas
class SavedQuizCreate(BaseModel):
    """Schema for saving an AI-generated quiz"""
    title: str = Field(..., min_length=1, max_length=200)
    course_id: Optional[int] = None
    note_ids: List[int] = Field(..., description="List of note IDs used to generate quiz")
    questions: List[AIQuizQuestion] = Field(..., description="Quiz questions")


class SavedQuizResponse(BaseModel):
    """Response schema for saved quiz"""
    id: int
    title: str
    course_id: Optional[int]
    note_ids: List[int]
    questions: List[AIQuizQuestion]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SavedQuizListItem(BaseModel):
    """Minimal quiz info for list view"""
    id: int
    title: str
    course_id: Optional[int]
    question_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True
