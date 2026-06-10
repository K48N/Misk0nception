"""
Schemas package initialization
"""
from .course import CourseCreate, CourseUpdate, CourseResponse
from .note import NoteCreate, NoteUpdate, NoteResponse
from .tag import TagCreate, TagUpdate, TagResponse
from .attachment import AttachmentResponse, AudioAttachmentResponse
from .flashcard import (
    FlashcardDeckCreate, FlashcardDeckResponse,
    FlashcardCardResponse, CardReviewRequest
)
from .quiz import QuizAttemptCreate, QuizAttemptResponse, UserStatsResponse
from .analytics import UsageDataResponse, PomodoroSessionCreate, StudySessionResponse
from .ai import (
    AISummaryRequest, AIQuizRequest, AIFlashcardsRequest,
    AIOutlineRequest, AITagsRequest, AIChatRequest
)

__all__ = [
    "CourseCreate", "CourseUpdate", "CourseResponse",
    "NoteCreate", "NoteUpdate", "NoteResponse",
    "TagCreate", "TagUpdate", "TagResponse",
    "AttachmentResponse", "AudioAttachmentResponse",
    "FlashcardDeckCreate", "FlashcardDeckResponse",
    "FlashcardCardResponse", "CardReviewRequest",
    "QuizAttemptCreate", "QuizAttemptResponse", "UserStatsResponse",
    "UsageDataResponse", "PomodoroSessionCreate", "StudySessionResponse",
    "AISummaryRequest", "AIQuizRequest", "AIFlashcardsRequest",
    "AIOutlineRequest", "AITagsRequest", "AIChatRequest",
]
