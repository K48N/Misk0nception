# Misk0nception: Frontend

> React 18 + TypeScript client for the Misk0nception study platform.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

The frontend is a single-page application that communicates with the FastAPI backend via REST. It provides the full study workflow: note editing, AI chat, flashcard sessions, quiz runs, audio transcription, and analytics, in a responsive dark/light-themed interface.

---

## Features

- **Rich-text editor**: Markdown preview, KaTeX math rendering, code blocks, diagram generation
- **K0npanion AI panel**: streaming chat sidebar with summarize, quiz, and flashcard generation actions
- **Audio recorder**: browser-native capture piped directly to the transcription endpoint
- **Flashcard study modal**: SM-2 session UI with confidence rating and progress tracking
- **Analytics dashboard**: Recharts-powered study stats and Pomodoro session history
- **Global search**: instant cross-collection search dialog
- **Theme persistence**: dark/light mode stored via Zustand and localStorage

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18, React Router 6 |
| Language | TypeScript 5.3 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3.4 |
| Server state | TanStack Query v5 |
| Client state | Zustand 4 |
| HTTP | Axios |
| Math rendering | KaTeX, react-katex |
| Charts | Recharts |

---

## Getting Started

```powershell
npm install
npm run dev
```

Available at **http://localhost:5173**: requires the backend running on port 8000.

| Script | Action |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Compile TypeScript and bundle for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

---

## Structure

```
src/
├── components/     # Reusable UI elements (editor toolbar, modals, spinners)
├── pages/          # Route-level views (Dashboard, NoteEditor, Flashcards, Quiz, Analytics)
├── services/       # Axios API abstractions per resource
├── store/          # Zustand slices (theme)
├── hooks/          # Custom hooks (useUndoRedo)
└── utils/          # AI personality config and helpers
```

---

## Notes

- Audio recording requires `localhost` or HTTPS (browser `MediaRecorder` API restriction).
- Full feature support: Chrome/Edge 90+, Firefox 88+, Safari 14+.
