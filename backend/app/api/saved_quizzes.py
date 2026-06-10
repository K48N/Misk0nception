"""
Saved AI Quizzes API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ..database import get_db
from ..models.usage import AIQuiz
from ..schemas.ai import (
    SavedQuizCreate, SavedQuizResponse, SavedQuizListItem, AIQuizQuestion
)

router = APIRouter()


@router.post("/", response_model=SavedQuizResponse, status_code=status.HTTP_201_CREATED)
def create_saved_quiz(
    quiz: SavedQuizCreate,
    db: Session = Depends(get_db)
):
    """Save an AI-generated quiz to the database"""
    # Convert questions to JSON
    questions_json = json.dumps([q.dict() for q in quiz.questions])
    note_ids_json = json.dumps(quiz.note_ids)
    
    db_quiz = AIQuiz(
        title=quiz.title,
        course_id=quiz.course_id,
        note_ids=note_ids_json,
        questions=questions_json
    )
    
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    # Parse back to return
    return SavedQuizResponse(
        id=db_quiz.id,
        title=db_quiz.title,
        course_id=db_quiz.course_id,
        note_ids=json.loads(db_quiz.note_ids),
        questions=[AIQuizQuestion(**q) for q in json.loads(db_quiz.questions)],
        created_at=db_quiz.created_at,
        updated_at=db_quiz.updated_at
    )


@router.get("/", response_model=List[SavedQuizListItem])
def list_saved_quizzes(
    course_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all saved quizzes, optionally filtered by course"""
    query = db.query(AIQuiz).order_by(AIQuiz.created_at.desc())
    
    if course_id:
        query = query.filter(AIQuiz.course_id == course_id)
    
    quizzes = query.offset(skip).limit(limit).all()
    
    return [
        SavedQuizListItem(
            id=q.id,
            title=q.title,
            course_id=q.course_id,
            question_count=len(json.loads(q.questions)),
            created_at=q.created_at
        )
        for q in quizzes
    ]


@router.get("/{quiz_id}", response_model=SavedQuizResponse)
def get_saved_quiz(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific saved quiz by ID"""
    quiz = db.query(AIQuiz).filter(AIQuiz.id == quiz_id).first()
    
    if not quiz:
        raise HTTPException(
            status_code=404,
            detail=f"Quiz with id {quiz_id} not found"
        )
    
    return SavedQuizResponse(
        id=quiz.id,
        title=quiz.title,
        course_id=quiz.course_id,
        note_ids=json.loads(quiz.note_ids),
        questions=[AIQuizQuestion(**q) for q in json.loads(quiz.questions)],
        created_at=quiz.created_at,
        updated_at=quiz.updated_at
    )


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_quiz(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    """Delete a saved quiz"""
    quiz = db.query(AIQuiz).filter(AIQuiz.id == quiz_id).first()
    
    if not quiz:
        raise HTTPException(
            status_code=404,
            detail=f"Quiz with id {quiz_id} not found"
        )
    
    db.delete(quiz)
    db.commit()
    
    return None
