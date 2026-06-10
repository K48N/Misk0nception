"""
FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from .config import get_settings
from .database import init_db, SessionLocal, initialize_default_tags

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    init_db()
    
    db = SessionLocal()
    try:
        initialize_default_tags(db)
    finally:
        db.close()
    
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Minimal note-taking API with AI integration",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")
app.mount("/attachments", StaticFiles(directory=str(settings.attachments_dir)), name="attachments")


# Health check endpoint
@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "ai_enabled": settings.groq_api_key is not None
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Import and include routers
from .api import courses, notes, tags, attachments, flashcards, quiz, analytics, ai_tools, search, saved_quizzes

app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(attachments.router, prefix="/api/attachments", tags=["attachments"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai_tools.router, prefix="/api/ai", tags=["ai"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(saved_quizzes.router, prefix="/api/ai-quizzes", tags=["saved-quizzes"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.debug
    )
