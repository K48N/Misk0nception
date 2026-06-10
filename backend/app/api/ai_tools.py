"""
AI Tools API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
import tempfile
import os

from ..services.ai_service import AIService
from ..schemas.ai import (
    AISummaryRequest, AISummaryResponse,
    AIQuizRequest, AIQuizResponse, AIQuizQuestion,
    AIFlashcardsRequest, AIFlashcardsResponse, AIFlashcard,
    AIOutlineRequest, AIOutlineResponse,
    AITagsRequest, AITagsResponse,
    AIChatRequest, AIChatResponse,
    AIGrammarRequest, AIGrammarResponse
)

router = APIRouter()


def get_ai_service() -> AIService:
    """Dependency to get AI service instance"""
    return AIService()


@router.get("/test")
def test_endpoint():
    """Simple test endpoint"""
    return {"message": "Backend is reachable!", "timestamp": "now"}


@router.get("/status")
def ai_status(ai_service: AIService = Depends(get_ai_service)):
    """Check AI service availability"""
    return {
        "available": ai_service.is_available(),
        "provider": "Misk0nception AI (Groq Llama 3.3)",
        "message": "Misk0nception AI ready" if ai_service.is_available() else "Configure GROQ_API_KEY to enable AI features"
    }


@router.post("/summarize", response_model=AISummaryResponse)
def generate_summary(
    request: AISummaryRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    """Generate a summary from text with optional style"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    # Get style from request or default to 'comprehensive'
    style = getattr(request, 'style', 'comprehensive')
    summary = ai_service.generate_summary(request.text, request.max_length, style)
    
    return AISummaryResponse(
        summary=summary,
        original_length=len(request.text.split()),
        summary_length=len(summary.split())
    )


@router.post("/quiz", response_model=AIQuizResponse)
def generate_quiz(
    request: AIQuizRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    """Generate quiz questions from text"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    questions = ai_service.generate_quiz(
        request.text,
        request.num_questions,
        request.difficulty
    )
    
    # Transform questions: convert options dict to list if needed
    quiz_questions = []
    for q in questions:
        transformed = {
            "question": q.get("question", ""),
            "explanation": q.get("explanation", ""),
            "correct_answer": q.get("correct", q.get("correct_answer", ""))
        }
        
        # Convert options from dict to list
        options = q.get("options", {})
        if isinstance(options, dict):
            # Convert dict like {'A': 'Option A', 'B': 'Option B'} to list ['Option A', 'Option B']
            transformed["options"] = list(options.values())
        else:
            # Already a list
            transformed["options"] = options if isinstance(options, list) else []
        
        try:
            quiz_questions.append(AIQuizQuestion(**transformed))
        except Exception:
            continue
    
    return AIQuizResponse(
        questions=quiz_questions,
        total_questions=len(quiz_questions)
    )


@router.post("/flashcards", response_model=AIFlashcardsResponse)
def generate_flashcards(
    request: AIFlashcardsRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    """Generate flashcards from text"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    # Run the potentially unstable AI client call in a subprocess to avoid crashing the main process
    import subprocess
    import json
    import sys
    from pathlib import Path

    worker_path = Path(__file__).parent.parent / "services" / "ai_worker.py"
    payload = {"text": request.text, "num_cards": request.num_cards}

    try:
        proc = subprocess.run(
            [sys.executable, str(worker_path)],
            input=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
            capture_output=True,
            timeout=60
        )

        if proc.returncode != 0:
            err_bytes = proc.stderr or b"Unknown error from AI worker"
            err = err_bytes.decode('utf-8', errors='replace').strip()
            raise HTTPException(status_code=500, detail=f"AI worker failed: {err}")

        # Parse stdout as JSON list
        out_bytes = proc.stdout or b""
        try:
            out = out_bytes.decode('utf-8', errors='replace').strip()
            flashcards = json.loads(out) if out else []
        except Exception:
            out_preview = out_bytes[:1000].decode('utf-8', errors='replace')
            raise HTTPException(status_code=500, detail="Invalid AI worker output")

        # Transform flashcards: map question/answer -> front/back
        cards = []
        for card in flashcards:
            transformed = {}
            # Map question to front (AI returns 'question', schema expects 'front')
            if 'question' in card:
                transformed['front'] = card['question']
            elif 'front' in card:
                transformed['front'] = card['front']
            
            # Map answer to back (AI returns 'answer', schema expects 'back')
            if 'answer' in card:
                transformed['back'] = card['answer']
            elif 'back' in card:
                transformed['back'] = card['back']
            
            # Only add if both fields are present
            if 'front' in transformed and 'back' in transformed:
                cards.append(AIFlashcard(**transformed))

        return AIFlashcardsResponse(
            flashcards=cards,
            total_cards=len(cards)
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="AI worker timed out")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/flashcards/list-decks")
def list_flashcard_decks():
    """Get all available flashcard decks for selection when saving"""
    from ..models.flashcard import FlashcardDeck
    from ..database import SessionLocal
    
    db = SessionLocal()
    try:
        decks = db.query(FlashcardDeck).order_by(FlashcardDeck.created_at.desc()).all()
        return [
            {
                "id": d.id,
                "title": d.title,
                "description": d.description,
                "card_count": d.total_cards,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in decks
        ]
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to list decks")
    finally:
        db.close()


@router.post("/flashcards/save")
def save_flashcards_to_deck(
    request: dict
):
    """Save generated flashcards to a flashcard deck
    
    Request body:
    {
        "flashcards": [{"front": "...", "back": "..."}, ...],
        "deck_id": 1 (optional - save to existing deck)
        OR
        "deck_name": "New Deck Name" (optional - create new deck),
        "description": "Optional description" (optional)
    }
    """
    from ..models.flashcard import FlashcardDeck, FlashcardCard
    from ..database import SessionLocal
    
    db = SessionLocal()
    
    try:
        flashcards = request.get("flashcards", [])
        deck_id = request.get("deck_id")
        deck_name = request.get("deck_name")
        description = request.get("description", "")
        
        if not flashcards:
            raise HTTPException(status_code=400, detail="No flashcards provided")
        
        # Get or create deck
        if deck_id:
            # Save to existing deck
            deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
            if not deck:
                raise HTTPException(status_code=404, detail="Deck not found")
            is_new_deck = False
        elif deck_name:
            # Create new deck
            deck = FlashcardDeck(
                title=deck_name,
                description=description or "Generated flashcards",
                course_id=None
            )
            db.add(deck)
            db.commit()
            db.refresh(deck)
            is_new_deck = True
        else:
            raise HTTPException(status_code=400, detail="Either deck_id or deck_name must be provided")
        
        # Add cards to deck
        for fc in flashcards:
            card = FlashcardCard(
                deck_id=deck.id,
                front=fc.get("front", ""),
                back=fc.get("back", "")
            )
            db.add(card)
        
        db.commit()
        
        # Update deck card count
        deck.total_cards = len(db.query(FlashcardCard).filter(FlashcardCard.deck_id == deck.id).all())
        db.commit()
        
        return {
            "success": True,
            "deck_id": deck.id,
            "deck_name": deck.title,
            "cards_added": len(flashcards),
            "total_cards": deck.total_cards,
            "is_new_deck": is_new_deck,
            "message": f"Successfully saved {len(flashcards)} flashcards to '{deck.title}'"
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save flashcards")
    finally:
        db.close()


@router.get("/quiz/list-quizzes")
def list_quizzes():
    """Get all available quizzes for selection when saving new quiz"""
    from ..models.usage import AIQuiz
    from ..database import SessionLocal
    import json
    
    db = SessionLocal()
    try:
        quizzes = db.query(AIQuiz).order_by(AIQuiz.created_at.desc()).all()
        return [
            {
                "id": q.id,
                "title": q.title,
                "question_count": len(json.loads(q.questions)) if q.questions else 0,
                "created_at": q.created_at.isoformat() if q.created_at else None,
                "questions": q.questions  # Pass as JSON string
            }
            for q in quizzes
        ]
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to list quizzes")
    finally:
        db.close()


@router.post("/quiz/save")
def save_quiz(request: dict):
    """Save generated quiz questions
    
    Request body:
    {
        "questions": [{"question": "...", "options": [...], "correct_answer": "...", "explanation": "..."}, ...],
        "quiz_id": 1 (optional - add to existing quiz)
        OR
        "quiz_title": "New Quiz Name" (optional - create new quiz),
        "note_ids": [1, 2, 3] (optional - note IDs used for generation)
    }
    """
    from ..models.usage import AIQuiz
    from ..database import SessionLocal
    import json
    
    db = SessionLocal()
    
    try:
        questions = request.get("questions", [])
        quiz_id = request.get("quiz_id")
        quiz_title = request.get("quiz_title")
        note_ids = request.get("note_ids", [])
        
        if not questions:
            raise HTTPException(status_code=400, detail="No questions provided")
        
        # Get or create quiz
        if quiz_id:
            # Add to existing quiz
            quiz = db.query(AIQuiz).filter(AIQuiz.id == quiz_id).first()
            if not quiz:
                raise HTTPException(status_code=404, detail="Quiz not found")
            
            # Parse existing questions and merge
            existing_questions = json.loads(quiz.questions) if quiz.questions else []
            existing_questions.extend(questions)
            quiz.questions = json.dumps(existing_questions)
            is_new_quiz = False
        elif quiz_title:
            # Create new quiz
            quiz = AIQuiz(
                title=quiz_title,
                note_ids=json.dumps(note_ids),
                questions=json.dumps(questions),
                course_id=None
            )
            db.add(quiz)
            is_new_quiz = True
        else:
            raise HTTPException(status_code=400, detail="Either quiz_id or quiz_title must be provided")
        
        db.commit()
        db.refresh(quiz)
        
        return {
            "success": True,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "questions_added": len(questions),
            "total_questions": len(json.loads(quiz.questions)) if quiz.questions else 0,
            "is_new_quiz": is_new_quiz,
            "message": f"Successfully saved {len(questions)} questions to quiz '{quiz.title}'"
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save quiz")
    finally:
        db.close()


@router.post("/outline", response_model=AIOutlineResponse)
def generate_outline(
    request: AIOutlineRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    """Generate an outline from text"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    outline = ai_service.generate_outline(request.text)
    
    return AIOutlineResponse(outline=outline)


@router.post("/tags", response_model=AITagsResponse)
def suggest_tags(
    request: AITagsRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    """Suggest tags for content"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    tags = ai_service.suggest_tags(request.text, request.max_tags)
    
    return AITagsResponse(tags=tags)


@router.post("/chat", response_model=AIChatResponse)
def ai_chat(
    request: AIChatRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    """AI tutor chat"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    try:
        response = ai_service.chat(
            request.message,
            request.context,
            request.conversation_history
        )
        return AIChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/grammar", response_model=AIGrammarResponse)
def check_grammar(
    request: AIGrammarRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    """Check grammar and get suggestions"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    result = ai_service.check_grammar(request.text)
    
    return AIGrammarResponse(**result)


@router.post("/format")
def smart_format(
    request: dict,
    ai_service: AIService = Depends(get_ai_service)
):
    """Smart format text with better structure"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    formatted = ai_service.smart_format(request.get('text', ''))
    return {"formatted_text": formatted}


@router.post("/highlight")
def highlight_concepts(
    request: dict,
    ai_service: AIService = Depends(get_ai_service)
):
    """Identify and highlight key concepts"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    result = ai_service.highlight_concepts(request.get('text', ''))
    return {"highlighted_text": result}


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    ai_service: AIService = Depends(get_ai_service)
):
    """Transcribe audio file using Groq Whisper"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    tmp_file_path = None
    try:
        suffix = os.path.splitext(file.filename)[1] if file.filename else '.webm'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        transcript = ai_service.transcribe_audio(tmp_file_path)
        return {"transcript": transcript}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if tmp_file_path and os.path.exists(tmp_file_path):
            try:
                os.remove(tmp_file_path)
            except Exception:
                pass


@router.post("/math-solve")
def solve_math_problem(
    request: dict,
    ai_service: AIService = Depends(get_ai_service)
):
    """Solve math problems with step-by-step solutions"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    problem = request.get('problem', '')
    if not problem:
        raise HTTPException(status_code=400, detail="Problem is required")
    
    try:
        solution = ai_service.solve_math(problem)
        return {"solution": solution}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-diagram")
def generate_diagram(
    request: dict,
    ai_service: AIService = Depends(get_ai_service)
):
    """Generate Mermaid.js diagram code from description"""
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GROQ_API_KEY."
        )
    
    description = request.get('description', '')
    if not description:
        raise HTTPException(status_code=400, detail="Description is required")
    
    try:
        diagram_code = ai_service.generate_diagram(description)
        return {"diagram_code": diagram_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


