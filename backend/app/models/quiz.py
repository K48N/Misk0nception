"""
Quiz and gamification models
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class QuizAttempt(Base):
    """Record of a quiz attempt"""
    __tablename__ = 'quiz_attempts'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    quiz_title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # Quiz content (JSON stored as string)
    questions_json = Column(String)  # Stores the questions and correct answers
    
    # Performance stats
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)
    
    def calculate_score(self):
        """Calculate score percentage"""
        if self.total_questions > 0:
            self.score_percentage = (self.correct_answers / self.total_questions) * 100
        else:
            self.score_percentage = 0.0
        return self.score_percentage
    
    def get_grade(self):
        """Get letter grade based on score"""
        if self.score_percentage >= 90:
            return 'A'
        elif self.score_percentage >= 80:
            return 'B'
        elif self.score_percentage >= 70:
            return 'C'
        elif self.score_percentage >= 60:
            return 'D'
        else:
            return 'F'
    
    def get_emoji(self):
        """Get emoji based on performance"""
        if self.score_percentage >= 90:
            return '🌟'
        elif self.score_percentage >= 80:
            return '✨'
        elif self.score_percentage >= 70:
            return '👍'
        elif self.score_percentage >= 60:
            return '😊'
        else:
            return '📚'


class Achievement(Base):
    """User achievements for gamification"""
    __tablename__ = 'achievements'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    icon = Column(String)  # Emoji icon
    unlocked_at = Column(DateTime, default=datetime.now)
    
    # Achievement criteria
    achievement_type = Column(String)  # 'quiz_streak', 'perfect_score', 'total_quizzes', etc.
    threshold = Column(Integer)  # Required value to unlock


class UserStats(Base):
    """Overall user statistics"""
    __tablename__ = 'user_stats'
    
    id = Column(Integer, primary_key=True)
    
    # Quiz stats
    total_quizzes = Column(Integer, default=0)
    total_questions_answered = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    total_wrong = Column(Integer, default=0)
    
    # Streaks
    current_streak = Column(Integer, default=0)  # Days in a row
    best_streak = Column(Integer, default=0)
    last_quiz_date = Column(DateTime)
    
    # Performance
    average_score = Column(Float, default=0.0)
    perfect_scores = Column(Integer, default=0)  # 100% scores
    
    # Study time
    total_study_time_minutes = Column(Integer, default=0)
    
    def update_from_quiz(self, quiz_attempt):
        """Update stats from a quiz attempt"""
        self.total_quizzes += 1
        self.total_questions_answered += quiz_attempt.total_questions
        self.total_correct += quiz_attempt.correct_answers
        self.total_wrong += quiz_attempt.wrong_answers
        
        # Update average score
        if self.total_quizzes > 0:
            self.average_score = (self.total_correct / self.total_questions_answered) * 100 if self.total_questions_answered > 0 else 0
        
        # Track perfect scores
        if quiz_attempt.score_percentage == 100.0:
            self.perfect_scores += 1
        
        # Update streak
        today = datetime.now().date()
        if self.last_quiz_date:
            last_date = self.last_quiz_date.date()
            if (today - last_date).days == 1:
                # Consecutive day
                self.current_streak += 1
                if self.current_streak > self.best_streak:
                    self.best_streak = self.current_streak
            elif today == last_date:
                # Same day, no change
                pass
            else:
                # Streak broken
                self.current_streak = 1
        else:
            self.current_streak = 1
        
        self.last_quiz_date = datetime.now()
    
    def get_accuracy_percentage(self):
        """Get overall accuracy"""
        if self.total_questions_answered > 0:
            return (self.total_correct / self.total_questions_answered) * 100
        return 0.0
    
    def get_level(self):
        """Calculate user level based on total quizzes"""
        return min(self.total_quizzes // 5 + 1, 100)  # Level up every 5 quizzes, max level 100
    
    def get_progress_to_next_level(self):
        """Get progress percentage to next level"""
        quizzes_in_current_level = self.total_quizzes % 5
        return (quizzes_in_current_level / 5) * 100
