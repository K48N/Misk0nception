"""
Flashcard system models - spaced repetition learning
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database import Base


class FlashcardDeck(Base):
    """A deck of flashcards generated from notes"""
    __tablename__ = 'flashcard_decks'
    
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    last_studied = Column(DateTime)
    
    # Stats
    total_cards = Column(Integer, default=0)
    cards_mastered = Column(Integer, default=0)
    
    # Relationships
    cards = relationship('FlashcardCard', back_populates='deck', cascade='all, delete-orphan')

    def get_due_cards(self):
        """Return cards due for review (next_review <= now, not mastered)"""
        now = datetime.now()
        return [card for card in self.cards if card.next_review and card.next_review <= now and not card.is_mastered]

    def get_new_cards(self):
        """Return cards that have never been reviewed (times_reviewed == 0)"""
        return [card for card in self.cards if card.times_reviewed == 0]

    def get_mastery_percentage(self):
        """Return percentage of cards mastered in this deck"""
        total = len(self.cards)
        if total == 0:
            return 0.0
        mastered = sum(1 for card in self.cards if card.is_mastered)
        return (mastered / total) * 100


class FlashcardCard(Base):
    """Individual flashcard with spaced repetition data"""
    __tablename__ = 'flashcard_cards'
    
    id = Column(Integer, primary_key=True)
    deck_id = Column(Integer, ForeignKey('flashcard_decks.id'), nullable=False)
    
    # Card content
    front = Column(Text, nullable=False)  # Question
    back = Column(Text, nullable=False)   # Answer
    
    # Spaced repetition data (SM-2 algorithm)
    ease_factor = Column(Float, default=2.5)  # Difficulty multiplier (starts at 2.5)
    interval_days = Column(Float, default=0)   # Days until next review
    times_reviewed = Column(Integer, default=0)
    
    # Review scheduling
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime, default=datetime.now)
    
    # Stats
    correct_streak = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    total_wrong = Column(Integer, default=0)
    is_mastered = Column(Integer, default=0)  # Boolean (0 or 1)
    
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    deck = relationship('FlashcardDeck', back_populates='cards')
    reviews = relationship('CardReview', back_populates='card', cascade='all, delete-orphan')
    
    def update_sm2(self, quality):
        """
        Update card using SM-2 spaced repetition algorithm
        
        Quality ratings:
        0 - Complete blackout
        1 - Incorrect, but familiar
        2 - Incorrect, but easy to recall
        3 - Correct, but difficult
        4 - Correct, with some hesitation
        5 - Perfect response
        """
        self.times_reviewed += 1
        self.last_reviewed = datetime.now()
        
        # Update ease factor
        self.ease_factor = max(1.3, self.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
        
        # Update interval
        if quality < 3:
            # Failed - reset to beginning
            self.interval_days = 0
            self.correct_streak = 0
            self.total_wrong += 1
        else:
            # Passed
            self.correct_streak += 1
            self.total_correct += 1
            
            if self.times_reviewed == 1:
                self.interval_days = 1
            elif self.times_reviewed == 2:
                self.interval_days = 6
            else:
                self.interval_days = self.interval_days * self.ease_factor
            
            # Check if mastered (reviewed correctly 5+ times, ease > 2.0)
            if self.correct_streak >= 5 and self.ease_factor >= 2.0:
                self.is_mastered = 1
        
        # Calculate next review date
        self.next_review = datetime.now() + timedelta(days=self.interval_days)
    
    def get_difficulty_label(self):
        """Get human-readable difficulty"""
        if self.ease_factor >= 2.5:
            return "Easy"
        elif self.ease_factor >= 2.0:
            return "Medium"
        else:
            return "Hard"
    
    def get_accuracy(self):
        """Get accuracy percentage"""
        total = self.total_correct + self.total_wrong
        if total == 0:
            return 0.0
        return (self.total_correct / total) * 100


class CardReview(Base):
    """Individual review session record"""
    __tablename__ = 'card_reviews'
    
    id = Column(Integer, primary_key=True)
    card_id = Column(Integer, ForeignKey('flashcard_cards.id'), nullable=False)
    
    # Review details
    reviewed_at = Column(DateTime, default=datetime.now)
    quality = Column(Integer)  # 0-5 rating
    time_taken_seconds = Column(Integer, default=0)
    
    # State before review
    interval_before = Column(Float)
    ease_factor_before = Column(Float)
    
    # Relationships
    card = relationship('FlashcardCard', back_populates='reviews')


class FlashcardStats(Base):
    """Global flashcard statistics"""
    __tablename__ = 'flashcard_stats'
    
    id = Column(Integer, primary_key=True)
    
    # Overall stats
    total_decks = Column(Integer, default=0)
    total_cards = Column(Integer, default=0)
    total_reviews = Column(Integer, default=0)
    
    # Study patterns
    cards_due_today = Column(Integer, default=0)
    cards_due_this_week = Column(Integer, default=0)
    
    # Performance
    average_ease_factor = Column(Float, default=2.5)
    retention_rate = Column(Float, default=0.0)  # Percentage
    
    # Streaks
    current_study_streak = Column(Integer, default=0)  # Days in a row
    best_study_streak = Column(Integer, default=0)
    last_study_date = Column(DateTime)
    
    # Time
    total_study_time_minutes = Column(Integer, default=0)
    
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def update_streak(self):
        """Update study streak"""
        today = datetime.now().date()
        
        if self.last_study_date:
            last_date = self.last_study_date.date()
            days_diff = (today - last_date).days
            
            if days_diff == 0:
                # Same day, no change
                pass
            elif days_diff == 1:
                # Consecutive day
                self.current_study_streak += 1
                if self.current_study_streak > self.best_study_streak:
                    self.best_study_streak = self.current_study_streak
            else:
                # Streak broken
                self.current_study_streak = 1
        else:
            self.current_study_streak = 1
        
        self.last_study_date = datetime.now()
    
    def calculate_retention_rate(self, session):
        """Calculate overall retention rate from recent reviews"""
        from datetime import timedelta
        
        # Get reviews from last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_reviews = session.query(CardReview).filter(
            CardReview.reviewed_at >= thirty_days_ago
        ).all()
        
        if not recent_reviews:
            return 0.0
        
        # Count successful reviews (quality >= 3)
        successful = sum(1 for review in recent_reviews if review.quality >= 3)
        self.retention_rate = (successful / len(recent_reviews)) * 100
        return self.retention_rate
