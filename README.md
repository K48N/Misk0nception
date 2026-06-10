# Misk0nception

> A full-stack AI-powered study platform for notes, flashcards, quizzes, and an intelligent study companion.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

Misk0nception is a personal knowledge platform that pairs rich-text note-taking with an AI study assistant. Organize courses, capture lectures via audio transcription, build spaced-repetition flashcard decks, and review performance analytics, all running locally with zero cloud lock-in.

---

## Features

- **Rich-text editor**: Markdown preview, code blocks, math rendering (KaTeX), and diagram support
- **K0npanion AI**: contextual chat, on-demand summarization, and automated quiz/flashcard generation via Groq
- **SM-2 flashcards**: spaced-repetition scheduling based on per-card performance metrics
- **Audio transcription**: record lectures and convert them directly into structured notes
- **Pomodoro timer**: built-in focus sessions with study analytics tracking
- **Course management**: group notes, quizzes, and flashcards by subject
- **Full-text search**: instant cross-collection search across all notes and content

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, Pydantic, SQLite |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| AI Inference | Groq API |
| State | Zustand, TanStack Query |
| Dev tooling | Uvicorn, ESLint |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com)

### Automated setup (Windows)

```powershell
.\start-local.ps1
```

To stop both services:

```powershell
.\stop-local.ps1
```

### Manual setup

**Backend**

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend**

```powershell
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Client | http://localhost:5173 |
| API docs | http://localhost:8000/docs |

---

## Configuration

Create `backend/.env`:

```env
GROQ_API_KEY=gsk_your_key_here
DATABASE_URL=sqlite:///./misconception.db
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
SECRET_KEY=generate_a_secure_random_string_here
DEBUG=false
```

---

## Project Structure

```
Misk0nception/
├── backend/
│   └── app/
│       ├── api/          # Route handlers
│       ├── models/       # SQLAlchemy models
│       ├── schemas/      # Pydantic validators
│       └── services/     # Business logic & AI connectors
└── frontend/
    └── src/
        ├── components/   # Reusable UI elements
        ├── pages/        # Dashboard, editor, quiz views
        ├── services/     # Axios API abstractions
        └── store/        # Zustand state slices
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| AI features unresponsive | Verify `GROQ_API_KEY` in `.env`; check backend logs for auth errors |
| "Failed to start recording" | Access the app via `localhost` or HTTPS; grant microphone permission |
| Database schema error | Delete `backend/misconception.db` and restart the backend |

---

## License

MIT
