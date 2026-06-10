"""
Tag model
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base
from .note import note_tags


class Tag(Base):
    """Tag model for categorizing notes"""
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    color = Column(String(7), default='#6b7280')
    
    # Relationships
    notes = relationship('Note', secondary=note_tags, back_populates='tags')
    
    def __repr__(self):
        return f"<Tag(name='{self.name}')>"
