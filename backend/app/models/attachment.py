"""
Attachment models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Attachment(Base):
    """File attachment model"""
    __tablename__ = 'attachments'
    
    id = Column(Integer, primary_key=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=False)
    filename = Column(String(300), nullable=False)
    filepath = Column(String(500), nullable=False)
    filetype = Column(String(50))
    filesize = Column(Integer)  # in bytes
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    note = relationship('Note', back_populates='attachments')
    
    def get_filesize_str(self):
        """Return file size as formatted string"""
        if not self.filesize:
            return "Unknown"
        if self.filesize < 1024:
            return f"{self.filesize} B"
        elif self.filesize < 1024 * 1024:
            return f"{self.filesize / 1024:.1f} KB"
        else:
            return f"{self.filesize / (1024 * 1024):.1f} MB"
    
    def __repr__(self):
        return f"<Attachment(filename='{self.filename}')>"


class AudioAttachment(Base):
    """Audio recordings linked to notes with playback metadata"""
    __tablename__ = 'audio_attachments'
    
    id = Column(Integer, primary_key=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=False)
    filename = Column(String(300), nullable=False)
    filepath = Column(String(500), nullable=False)
    duration = Column(Integer, default=0)  # Duration in seconds
    filesize = Column(Integer, default=0)  # File size in bytes
    format = Column(String(10), default='mp3')  # Audio format (mp3, wav, etc.)
    transcription_status = Column(String(20), default='pending')  # pending, complete, failed
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    note = relationship('Note', foreign_keys=[note_id])
    
    def get_duration_str(self):
        """Return duration as formatted string (MM:SS)"""
        minutes = self.duration // 60
        seconds = self.duration % 60
        return f"{minutes:02d}:{seconds:02d}"
    
    def get_filesize_str(self):
        """Return file size as formatted string"""
        if self.filesize < 1024:
            return f"{self.filesize} B"
        elif self.filesize < 1024 * 1024:
            return f"{self.filesize / 1024:.1f} KB"
        else:
            return f"{self.filesize / (1024 * 1024):.1f} MB"
    
    def __repr__(self):
        return f"<AudioAttachment(filename='{self.filename}', duration={self.get_duration_str()})>"
