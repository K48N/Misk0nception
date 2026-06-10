"""
Note API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.note import Note
from ..models.tag import Tag
from ..models.course import Course
from ..schemas.note import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()


@router.get("/", response_model=List[NoteResponse])
def list_notes(
    course_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all notes, optionally filtered by course or tag"""
    query = db.query(Note)
    
    if course_id:
        query = query.filter(Note.course_id == course_id)
    
    if tag_id:
        query = query.join(Note.tags).filter(Tag.id == tag_id)
    
    notes = query.offset(skip).limit(limit).all()
    
    return [NoteResponse(
        **note.__dict__,
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in note.tags],
        attachment_count=len(note.attachments)
    ) for note in notes]


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db)
):
    """Create a new note"""
    # Verify course exists
    course = db.query(Course).filter(Course.id == note.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Create note
    note_data = note.model_dump(exclude={"tag_ids"})
    db_note = Note(**note_data)
    
    # Add tags if provided
    if note.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(note.tag_ids)).all()
        db_note.tags = tags
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return NoteResponse(
        **db_note.__dict__,
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in db_note.tags],
        attachment_count=0
    )


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific note"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return NoteResponse(
        **note.__dict__,
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in note.tags],
        attachment_count=len(note.attachments)
    )


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    db: Session = Depends(get_db)
):
    """Update a note"""
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Update fields
    update_data = note_update.model_dump(exclude_unset=True, exclude={"tag_ids"})
    for field, value in update_data.items():
        setattr(db_note, field, value)
    
    # Update tags if provided
    if note_update.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(note_update.tag_ids)).all()
        db_note.tags = tags
    
    db.commit()
    db.refresh(db_note)
    
    return NoteResponse(
        **db_note.__dict__,
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in db_note.tags],
        attachment_count=len(db_note.attachments)
    )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    """Delete a note"""
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(db_note)
    db.commit()
    
    return None


@router.get("/{note_id}/related", response_model=List[NoteResponse])
def get_related_notes(
    note_id: int,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get notes related to this note (same tags or course)"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Find notes with overlapping tags or same course
    related = db.query(Note).filter(
        Note.id != note_id,
        Note.course_id == note.course_id
    ).limit(limit).all()
    
    return [NoteResponse(
        **n.__dict__,
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in n.tags],
        attachment_count=len(n.attachments)
    ) for n in related]
