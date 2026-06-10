"""
Search API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.note import Note
from ..models.course import Course
from ..schemas.note import NoteResponse
from ..schemas.course import CourseResponse

router = APIRouter()


@router.get("/notes", response_model=List[NoteResponse])
def search_notes(
    q: str = Query(..., min_length=1, description="Search query"),
    course_id: int = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Search notes by title or content"""
    query = db.query(Note).filter(
        (Note.title.ilike(f"%{q}%")) | (Note.content.ilike(f"%{q}%"))
    )
    
    if course_id:
        query = query.filter(Note.course_id == course_id)
    
    notes = query.offset(skip).limit(limit).all()
    
    return [NoteResponse(
        **note.__dict__,
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in note.tags],
        attachment_count=len(note.attachments)
    ) for note in notes]


@router.get("/courses", response_model=List[CourseResponse])
def search_courses(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Search courses by name, code, or description"""
    courses = db.query(Course).filter(
        (Course.name.ilike(f"%{q}%")) |
        (Course.code.ilike(f"%{q}%")) |
        (Course.description.ilike(f"%{q}%"))
    ).offset(skip).limit(limit).all()
    
    return [CourseResponse(
        **course.__dict__,
        note_count=len(course.notes)
    ) for course in courses]


@router.get("/all")
def search_all(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db)
):
    """Search across courses and notes"""
    # Search courses
    courses = db.query(Course).filter(
        (Course.name.ilike(f"%{q}%")) |
        (Course.code.ilike(f"%{q}%")) |
        (Course.description.ilike(f"%{q}%"))
    ).limit(10).all()
    
    # Search notes
    notes = db.query(Note).filter(
        (Note.title.ilike(f"%{q}%")) | (Note.content.ilike(f"%{q}%"))
    ).limit(20).all()
    
    return {
        "query": q,
        "courses": [CourseResponse(
            **c.__dict__,
            note_count=len(c.notes)
        ) for c in courses],
        "notes": [NoteResponse(
            **n.__dict__,
            tags=[{"id": t.id, "name": t.name, "color": t.color} for t in n.tags],
            attachment_count=len(n.attachments)
        ) for n in notes]
    }
