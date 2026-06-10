"""
Attachment API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List
import shutil
import uuid

from ..database import get_db
from ..models.attachment import Attachment
from ..models.note import Note
from ..schemas.attachment import AttachmentResponse
from ..config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/{note_id}/upload", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    note_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a file attachment to a note"""
    # Verify note exists
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.max_upload_size:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = settings.attachments_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create attachment record
    attachment = Attachment(
        note_id=note_id,
        filename=file.filename,
        filepath=str(file_path),
        filetype=file.content_type,
        filesize=file_size
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return AttachmentResponse(
        **attachment.__dict__,
        filesize_str=AttachmentResponse.format_filesize(file_size)
    )


@router.get("/{attachment_id}", response_model=AttachmentResponse)
def get_attachment_info(
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """Get attachment metadata"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    return AttachmentResponse(
        **attachment.__dict__,
        filesize_str=AttachmentResponse.format_filesize(attachment.filesize)
    )


@router.get("/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """Download an attachment file"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = Path(attachment.filepath)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=str(file_path),
        filename=attachment.filename,
        media_type=attachment.filetype or "application/octet-stream"
    )


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """Delete an attachment"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Delete file from disk
    file_path = Path(attachment.filepath)
    if file_path.exists():
        file_path.unlink()
    
    # Delete database record
    db.delete(attachment)
    db.commit()
    
    return None


@router.get("/note/{note_id}", response_model=List[AttachmentResponse])
def list_note_attachments(
    note_id: int,
    db: Session = Depends(get_db)
):
    """Get all attachments for a note"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return [AttachmentResponse(
        **att.__dict__,
        filesize_str=AttachmentResponse.format_filesize(att.filesize)
    ) for att in note.attachments]
