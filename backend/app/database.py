"""
Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from .config import get_settings

settings = get_settings()

# Create database engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=settings.debug
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    Usage in FastAPI: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    # Import all models here to ensure they're registered
    from . import models  # noqa
    
    Base.metadata.create_all(bind=engine)


def initialize_default_tags(db: Session):
    """Initialize default tags if they don't exist"""
    from .models.tag import Tag
    
    default_tags = [
        ('Lecture', '#3b82f6'),      # Blue
        ('Assignment', '#f59e0b'),   # Orange
        ('Exam', '#ef4444'),         # Red
        ('Project', '#8b5cf6'),      # Purple
        ('Reading', '#10b981'),      # Green
        ('Lab', '#06b6d4'),          # Cyan
        ('Important', '#ec4899'),    # Pink
        ('Review', '#6366f1'),       # Indigo
    ]
    
    for tag_name, color in default_tags:
        existing = db.query(Tag).filter(Tag.name == tag_name).first()
        if not existing:
            tag = Tag(name=tag_name, color=color)
            db.add(tag)
    
    db.commit()
