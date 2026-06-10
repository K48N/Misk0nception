"""
Flashcard API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.flashcard import FlashcardDeck, FlashcardCard, CardReview
from ..models.course import Course
from ..schemas.flashcard import (
    FlashcardDeckCreate, FlashcardDeckResponse, FlashcardDeckWithCards,
    FlashcardCardResponse, CardReviewRequest, CardReviewResponse
)

router = APIRouter()


@router.get("/decks", response_model=List[FlashcardDeckResponse])
def list_decks(
    course_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all flashcard decks"""
    query = db.query(FlashcardDeck)
    if course_id:
        query = query.filter(FlashcardDeck.course_id == course_id)
    
    decks = query.offset(skip).limit(limit).all()
    
    # Return simplified response
    response = []
    for deck in decks:
        response.append(FlashcardDeckResponse(
            id=deck.id,
            name=deck.title,
            description=deck.description,
            note_id=deck.course_id,  # Using course_id as note_id for compatibility
            created_at=deck.created_at,
            card_count=len(deck.cards)
        ))
    
    return response


@router.post("/decks", response_model=FlashcardDeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck(
    deck: FlashcardDeckCreate,
    db: Session = Depends(get_db)
):
    """Create a new flashcard deck"""
    # Create new deck
    # Use note_id if provided, otherwise try to get default course, otherwise None (nullable for now)
    course_id = deck.note_id
    if course_id is None:
        # Try to get a default course if none is specified
        default_course = db.query(Course).first()
        course_id = default_course.id if default_course else None
    
    db_deck = FlashcardDeck(
        title=deck.name,
        description=deck.description,
        course_id=course_id  # Using note_id as course_id for compatibility
    )
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    
    return FlashcardDeckResponse(
        id=db_deck.id,
        name=db_deck.title,
        description=db_deck.description,
        note_id=db_deck.course_id,  # Return as note_id for frontend compatibility
        created_at=db_deck.created_at,
        card_count=0
    )


@router.get("/decks/{deck_id}", response_model=FlashcardDeckWithCards)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific deck with all cards"""
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    cards = [FlashcardCardResponse(
        **card.__dict__,
        is_mastered=bool(card.is_mastered),
        difficulty_label=card.get_difficulty_label(),
        accuracy=card.get_accuracy()
    ) for card in deck.cards]
    
    return FlashcardDeckWithCards(
        **deck.__dict__,
        mastery_percentage=deck.get_mastery_percentage(),
        due_count=len(deck.get_due_cards()),
        new_count=len(deck.get_new_cards()),
        cards=cards
    )


@router.get("/decks/{deck_id}/due", response_model=List[FlashcardCardResponse])
def get_due_cards(
    deck_id: int,
    db: Session = Depends(get_db)
):
    """Get cards due for review in a deck"""
    try:
        deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        due_cards = deck.get_due_cards()
        responses = []
        for card in due_cards:
            data = {
                'id': card.id,
                'deck_id': card.deck_id,
                'front': card.front,
                'back': card.back,
                'ease_factor': card.ease_factor,
                'interval_days': card.interval_days,
                'times_reviewed': card.times_reviewed,
                'last_reviewed': card.last_reviewed,
                'next_review': card.next_review,
                'correct_streak': card.correct_streak,
                'total_correct': card.total_correct,
                'total_wrong': card.total_wrong,
                'is_mastered': bool(card.is_mastered),
                'difficulty_label': card.get_difficulty_label(),
                'accuracy': card.get_accuracy(),
                'created_at': card.created_at,
            }
            responses.append(FlashcardCardResponse(**data))
        return responses
    except Exception as e:
        import traceback
        print(f"[ERROR] /decks/{{deck_id}}/due failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@router.post("/review", response_model=CardReviewResponse)
def submit_review(
    review: CardReviewRequest,
    db: Session = Depends(get_db)
):
    """Submit a flashcard review"""
    card = db.query(FlashcardCard).filter(FlashcardCard.id == review.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Save state before update
    interval_before = card.interval_days
    ease_before = card.ease_factor
    
    # Update card using SM-2 algorithm
    card.update_sm2(review.quality)
    
    # Create review record
    card_review = CardReview(
        card_id=card.id,
        quality=review.quality,
        time_taken_seconds=review.time_taken_seconds,
        interval_before=interval_before,
        ease_factor_before=ease_before
    )
    db.add(card_review)
    
    # Update deck stats
    deck = card.deck
    deck.last_studied = datetime.now()
    deck.cards_mastered = sum(1 for c in deck.cards if c.is_mastered)
    
    db.commit()
    
    message = "Great job!" if review.quality >= 4 else "Keep practicing!"
    
    return CardReviewResponse(
        card_id=card.id,
        next_review=card.next_review,
        interval_days=card.interval_days,
        is_mastered=bool(card.is_mastered),
        message=message
    )


@router.delete("/decks/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db)
):
    """Delete a flashcard deck"""
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    db.delete(deck)
    db.commit()
    
    return None
