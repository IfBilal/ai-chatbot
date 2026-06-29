# AI Chatbot

A precision AI chatbot. **Next.js** frontend + **FastAPI** backend, streaming
responses from **Groq** (`llama-3.3-70b-versatile`). Monochromatic, data-dense
"intelligence terminal" UI — sticky glass header, blueprint grid, a quiet
hand-tuned wave field, and real-time token streaming.

```
ai-chatbot/
├── backend/    FastAPI · SSE streaming proxy to Gemini
└── frontend/   Next.js (App Router, TS) · Tailwind · Framer Motion
```

Conversation history lives in the browser (localStorage); the backend is
stateless.

---

## 1. Backend

```bash
cd backend
cp .env.example .env          # then paste your key into GEMINI_API_KEY
# venv already created during setup; if not:
#   python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn main:app --reload --port 8000
```

Get a free key at https://console.groq.com/keys

Health check: `curl http://127.0.0.1:8000/api/health`

## 2. Frontend

```bash
cd frontend
npm run dev                   # http://localhost:3000
```

The frontend proxies `/api/*` to the backend (`http://127.0.0.1:8000` by
default; override with `BACKEND_URL`).

---

## How it works

- **Streaming** — `POST /api/chat` takes the full turn list and streams Groq
  tokens back as Server-Sent Events (`data: {"delta": "..."}`). The client
  appends deltas live with a blinking caret.
- **State** — `useConversations` persists sessions to `localStorage`; titles are
  derived from the first user turn.
- **Design** — tokens in `tailwind.config.ts`; pure black base, white text,
  `#A1A1AA` secondary, a single restrained electric-blue accent. No gradients
  beyond subtle black vignettes.

## Stack

Next.js 15 · React 19 · Tailwind 3.4 · Framer Motion · Lucide · FastAPI ·
groq · Uvicorn
