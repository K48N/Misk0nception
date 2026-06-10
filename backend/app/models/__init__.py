"""
Models package initialization
Import all models to ensure they're registered with SQLAlchemy
"""
from ..database import Base

# Import association tables first
from .note import note_tags

# Import models
from .course import Course
from .note import Note
from .tag import Tag
from .attachment import Attachment, AudioAttachment
from .flashcard import FlashcardDeck, FlashcardCard, CardReview, FlashcardStats
from .quiz import QuizAttempt, Achievement, UserStats
from .study import PomodoroSession, StudySession
from .usage import UsageLog, AIQuiz, StudyReminder

__all__ = [
    "Base",
    "note_tags",
    "Course",
    "Note",
    "Tag",
    "Attachment",
    "AudioAttachment",
    "FlashcardDeck",
    "FlashcardCard",
    "CardReview",
    "FlashcardStats",
    "QuizAttempt",
    "Achievement",
    "UserStats",
    "PomodoroSession",
    "StudySession",
    "UsageLog",
    "AIQuiz",
    "StudyReminder",
]
