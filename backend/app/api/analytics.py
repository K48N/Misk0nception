"""
Analytics API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, func
from typing import List, Dict
from datetime import datetime, timedelta

from ..database import get_db
from ..models.study import PomodoroSession, StudySession
from ..models.note import Note
from ..models.usage import UsageLog
from ..schemas.analytics import (
    PomodoroSessionCreate, PomodoroSessionResponse,
    StudySessionResponse, UsageDataResponse, StudyAnalyticsResponse
)

router = APIRouter()


@router.post("/pomodoro", response_model=PomodoroSessionResponse, status_code=status.HTTP_201_CREATED)
def create_pomodoro_session(
    session: PomodoroSessionCreate,
    db: Session = Depends(get_db)
):
    """Log a completed Pomodoro session"""
    db_session = PomodoroSession(**session.model_dump())
    db_session.end_time = datetime.now()
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return PomodoroSessionResponse(**db_session.__dict__)


@router.get("/pomodoro", response_model=List[PomodoroSessionResponse])
def list_pomodoro_sessions(
    course_id: int = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get Pomodoro sessions"""
    start_date = datetime.now() - timedelta(days=days)
    query = db.query(PomodoroSession).filter(PomodoroSession.start_time >= start_date)
    
    if course_id:
        query = query.filter(PomodoroSession.course_id == course_id)
    
    sessions = query.order_by(PomodoroSession.start_time.desc()).all()
    
    return [PomodoroSessionResponse(**s.__dict__) for s in sessions]


@router.get("/study-sessions", response_model=List[StudySessionResponse])
def list_study_sessions(
    course_id: int = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get study sessions"""
    start_date = datetime.now() - timedelta(days=days)
    query = db.query(StudySession).filter(StudySession.start_time >= start_date)
    
    if course_id:
        query = query.filter(StudySession.course_id == course_id)
    
    sessions = query.order_by(StudySession.start_time.desc()).all()
    
    return [StudySessionResponse(**s.__dict__) for s in sessions]


@router.get("/usage-data", response_model=Dict[str, int])
def get_usage_data(
    days: int = 365,
    db: Session = Depends(get_db)
):
    """Get usage data for contribution graph"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get note creation activity
    note_activity = db.query(
        func.date(Note.created_at).label('date'),
        func.count(Note.id).label('count')
    ).filter(
        Note.created_at >= start_date,
        Note.created_at <= end_date
    ).group_by(func.date(Note.created_at)).all()
    
    # Initialize dict with all dates
    usage_dict = {}
    current_date = start_date
    while current_date <= end_date:
        date_key = current_date.strftime('%Y-%m-%d')
        usage_dict[date_key] = 0
        current_date += timedelta(days=1)
    
    # Add activity counts
    for record in note_activity:
        if record.date:
            date_key = record.date if isinstance(record.date, str) else record.date.strftime('%Y-%m-%d')
            if date_key in usage_dict:
                usage_dict[date_key] += record.count
    
    # Add usage logs
    logs = db.query(UsageLog).filter(
        UsageLog.date >= start_date,
        UsageLog.date <= end_date
    ).all()
    
    for log in logs:
        date_key = log.date.strftime('%Y-%m-%d')
        if date_key in usage_dict:
            usage_dict[date_key] += 1
    
    return usage_dict


@router.get("/summary", response_model=StudyAnalyticsResponse)
def get_analytics_summary(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics summary"""
    start_date = datetime.now() - timedelta(days=days)
    
    # Pomodoro stats
    pomodoro_sessions = db.query(PomodoroSession).filter(
        PomodoroSession.start_time >= start_date
    ).all()
    
    total_pomodoros = len(pomodoro_sessions)
    total_study_time = sum(s.duration_minutes for s in pomodoro_sessions)
    
    # Study sessions
    study_sessions = db.query(StudySession).filter(
        StudySession.start_time >= start_date
    ).all()
    
    total_sessions = len(study_sessions)
    avg_duration = (
        sum(s.duration_minutes for s in study_sessions) / total_sessions
        if total_sessions > 0 else 0
    )
    
    # Most studied course
    from ..models.course import Course
    course_study_time = {}
    for session in pomodoro_sessions:
        if session.course_id:
            course_study_time[session.course_id] = course_study_time.get(session.course_id, 0) + session.duration_minutes
    
    most_studied_course = None
    if course_study_time:
        most_studied_id = max(course_study_time, key=course_study_time.get)
        course = db.query(Course).filter(Course.id == most_studied_id).first()
        if course:
            most_studied_course = course.name
    
    # Usage data
    usage_data = get_usage_data(days=days, db=db)
    
    # Calculate streak
    study_streak = 0
    today = datetime.now().date()
    current_date = today
    while True:
        date_key = current_date.strftime('%Y-%m-%d')
        if usage_data.get(date_key, 0) > 0:
            study_streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return StudyAnalyticsResponse(
        total_study_time=total_study_time,
        total_pomodoros=total_pomodoros,
        total_sessions=total_sessions,
        average_session_duration=avg_duration,
        most_studied_course=most_studied_course,
        study_streak=study_streak,
        usage_data=usage_data
    )
