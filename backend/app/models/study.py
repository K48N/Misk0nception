"""
Study session models - Pomodoro and general study tracking
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class PomodoroSession(Base):
    """Track completed Pomodoro sessions"""
    __tablename__ = 'pomodoro_sessions'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=True)
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=25)  # Actual work time
    completed = Column(Boolean, default=False)  # True if finished, False if interrupted
    session_type = Column(String, default='work')  # 'work' or 'break'
    
    # Relationships
    course = relationship('Course', back_populates='pomodoro_sessions')
    note = relationship('Note', back_populates='pomodoro_sessions')
    
    def __repr__(self):
        return f"<PomodoroSession(course={self.course_id}, duration={self.duration_minutes}min, completed={self.completed})>"


class StudySession(Base):
    """Track general study sessions (non-Pomodoro)"""
    __tablename__ = 'study_sessions'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    activity_type = Column(String)  # 'notes', 'quiz', 'flashcards', 'reading'
    
    # Relationships
    course = relationship('Course', back_populates='study_sessions')
    
    def __repr__(self):
        return f"<StudySession(course={self.course_id}, duration={self.duration_minutes}min, type={self.activity_type})>"
