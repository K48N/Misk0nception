"""
Course model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Course(Base):
    """Course model for organizing notes"""
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50))
    color = Column(String(7), default='#009682')  # Hex color (default green)
    icon = Column(String(10), default='📚')  # Emoji icon
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    notes = relationship('Note', back_populates='course', cascade='all, delete-orphan')
    pomodoro_sessions = relationship('PomodoroSession', back_populates='course')
    study_sessions = relationship('StudySession', back_populates='course')
    
    def __repr__(self):
        return f"<Course(name='{self.name}', code='{self.code}')>"
