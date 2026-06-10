# Misk0nception: Backend

> FastAPI REST API powering notes, AI study tools, flashcards, quizzes, and analytics.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-API-F55036?style=flat-square)

The backend exposes a structured REST API with automatic OpenAPI documentation. All data is validated through Pydantic schemas, persisted via SQLAlchemy into a local SQLite database, and AI features are served through the Groq inference API (Llama 3.3 for text, Whisper for transcription).

---

## Features

- **Notes API**: CRUD with full-text search, tagging, and course association
- **Courses API**: group notes, quizzes, and flashcards by subject
- **Flashcards**: SM-2 spaced-repetition scheduling, per-card performance tracking
- **Quiz engine**: auto-generated quizzes with attempt history
- **AI tools**: summarization, quiz generation, chat completions, audio transcription
- **Analytics**: Pomodoro session tracking and study statistics
- **Attachments**: secure file upload and retrieval

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic 2 + pydantic-settings |
| AI inference | Groq (Llama 3.3, Whisper) |
| Server | Uvicorn |
| File uploads | python-multipart |

---

## Getting Started

```powershell
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GROQ_API_KEY=gsk_your_key_here
DATABASE_URL=sqlite:///./misconception.db
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
SECRET_KEY=generate_a_secure_random_string_here
DEBUG=false
```

**Development server**

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Production server**

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

| Endpoint | URL |
|---|---|
| API root | http://localhost:8000 |
| Interactive docs | http://localhost:8000/docs |

---

## Structure

```
app/
├── api/          # Route handlers (notes, courses, flashcards, quiz, ai_tools…)
├── models/       # SQLAlchemy table definitions
├── schemas/      # Pydantic request/response contracts
├── services/     # Business logic and Groq AI connector
├── config.py     # Settings loaded from .env
├── database.py   # Engine and session setup
└── main.py       # Application entry point and router registration
```
