"""
Note and Tag models with many-to-many relationship
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


# Association table for many-to-many relationship between notes and tags
note_tags = Table('note_tags', Base.metadata,
    Column('note_id', Integer, ForeignKey('notes.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)


class Note(Base):
    """Note model for storing user notes"""
    __tablename__ = 'notes'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False, default='')
    course_id = Column(Integer, ForeignKey('courses.id'))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    course = relationship('Course', back_populates='notes')
    attachments = relationship('Attachment', back_populates='note', cascade='all, delete-orphan')
    tags = relationship('Tag', secondary=note_tags, back_populates='notes')
    pomodoro_sessions = relationship('PomodoroSession', back_populates='note')
    
    def __repr__(self):
        return f"<Note(title='{self.title}', course='{self.course.name if self.course else None}')>"
