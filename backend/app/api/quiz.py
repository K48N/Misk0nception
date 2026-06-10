"""
Quiz API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.quiz import QuizAttempt, UserStats, Achievement
from ..models.course import Course
from ..schemas.quiz import QuizAttemptCreate, QuizAttemptResponse, UserStatsResponse, AchievementResponse

router = APIRouter()


@router.post("/attempts", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def create_quiz_attempt(
    attempt: QuizAttemptCreate,
    db: Session = Depends(get_db)
):
    """Record a quiz attempt"""
    # Verify course exists
    course = db.query(Course).filter(Course.id == attempt.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Create quiz attempt
    db_attempt = QuizAttempt(**attempt.model_dump())
    db_attempt.calculate_score()
    db.add(db_attempt)
    
    # Update user stats
    user_stats = db.query(UserStats).first()
    if not user_stats:
        user_stats = UserStats()
        db.add(user_stats)
    
    user_stats.update_from_quiz(db_attempt)
    
    db.commit()
    db.refresh(db_attempt)
    
    return QuizAttemptResponse(
        **db_attempt.__dict__,
        grade=db_attempt.get_grade(),
        emoji=db_attempt.get_emoji()
    )


@router.get("/attempts", response_model=List[QuizAttemptResponse])
def list_quiz_attempts(
    course_id: int = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get quiz attempts"""
    query = db.query(QuizAttempt).order_by(QuizAttempt.created_at.desc())
    
    if course_id:
        query = query.filter(QuizAttempt.course_id == course_id)
    
    attempts = query.offset(skip).limit(limit).all()
    
    return [QuizAttemptResponse(
        **attempt.__dict__,
        grade=attempt.get_grade(),
        emoji=attempt.get_emoji()
    ) for attempt in attempts]


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
def get_quiz_attempt(
    attempt_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific quiz attempt"""
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    
    return QuizAttemptResponse(
        **attempt.__dict__,
        grade=attempt.get_grade(),
        emoji=attempt.get_emoji()
    )


@router.get("/stats", response_model=UserStatsResponse)
def get_user_stats(db: Session = Depends(get_db)):
    """Get overall user statistics"""
    user_stats = db.query(UserStats).first()
    
    if not user_stats:
        # Create default stats if none exist
        user_stats = UserStats()
        db.add(user_stats)
        db.commit()
        db.refresh(user_stats)
    
    return UserStatsResponse(
        **user_stats.__dict__,
        accuracy_percentage=user_stats.get_accuracy_percentage(),
        level=user_stats.get_level(),
        progress_to_next_level=user_stats.get_progress_to_next_level()
    )


@router.get("/achievements", response_model=List[AchievementResponse])
def list_achievements(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all unlocked achievements"""
    achievements = db.query(Achievement).offset(skip).limit(limit).all()
    
    return [AchievementResponse(**achievement.__dict__) for achievement in achievements]
