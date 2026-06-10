"""
Usage tracking and AI-related models
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from datetime import datetime
from ..database import Base


class UsageLog(Base):
    """Track application usage patterns"""
    __tablename__ = 'usage_logs'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.now)
    action_type = Column(String(50))  # 'note_created', 'note_edited', 'session_start', etc.
    duration = Column(Integer, default=0)  # in seconds
    
    def __repr__(self):
        return f"<UsageLog(date='{self.date}', action='{self.action_type}')>"


class AIQuiz(Base):
    """Store AI-generated quizzes"""
    __tablename__ = 'ai_quizzes'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'))
    note_ids = Column(Text)  # JSON string of note IDs used to generate
    questions = Column(Text)  # JSON string of questions and answers
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<AIQuiz(title='{self.title}', course_id={self.course_id}, created_at='{self.created_at}')>"


class StudyReminder(Base):
    """Study reminders and calendar events"""
    __tablename__ = 'study_reminders'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    title = Column(String(200))
    description = Column(Text)
    reminder_time = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<StudyReminder(title='{self.title}', time='{self.reminder_time}')>"
