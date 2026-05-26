# MemoMind: Organizational Memory Intelligence System

MemoMind is a modern, premium, futuristic full-stack SaaS platform designed to serve as a long-term intelligent memory layer for organizations. Unlike a standard meeting summarizer, MemoMind records real transcripts and maps them onto a unified **Organizational Memory Graph** that tracks decision histories, accountability tasks, pending items, circular debates, and contradictions across meetings.

---

## Key Features

1. **Speech-to-Text Ingestion**: Real drag-and-drop meeting uploads (MP3, WAV, MP4, WebM) with actual Whisper speech-to-text processing and structured GPT-4o-mini parsing. Integrated with `XMLHttpRequest` to track precise binary upload progress (0-100%).
2. **Live Microphone Workspace**: Capture real-time microphone audio via the browser's `getUserMedia` and `MediaRecorder` API. Features a real-time responsive waveform visualizer mapped directly to active Web Audio API `AnalyserNode` frequency levels.
3. **Live Screen Share & Assistant (Google Meet style)**: Native display picker (`getDisplayMedia`) allowing tab, window, or entire screen sharing. Mixes screen audio with microphone streams into a single recording, displaying video preview feeds live.
4. **WebSocket Streaming Pipeline**: Both live microphone and screen share audio stream binary chunks to the FastAPI server (`/ws/meeting-stream`). Chunks are transcribed asynchronously in a background thread pool via Whisper, returning live transcripts to the user.
5. **Real-Time AI Inspection**: Frontend processes live Whisper transcription segments on the fly, auto-detecting accountability tasks and plan conflicts (contradictions) dynamically.
6. **Accountability Kanban Board**: A task tracking workspace mapped directly to decisions and owners. Saved and synced directly to the backend database.
7. **Decision Lineage & Contradiction Alerts**: Chronological overview of all corporate policy choices. Highlights overridden decisions and flags contradictions automatically when new syncs oppose past policies.
8. **Circular Debate Detection**: Identifies recurring topics sync-after-sync that fail to reach a definitive resolution.
9. **Semantic Search Workspace**: Natural language memory search using text embeddings and local cosine similarity to retrieve matching nodes, tasks, decisions, and exact transcript snippets:
   $$\text{Similarity} = \frac{A \cdot B}{\|A\| \|B\|}$$
10. **Interactive SVG Graph Canvas**: Dynamic force-directed network showing relationships between meetings, decisions, tasks, and team members.

---

## Directory Structure

```
MemoMind/
├── frontend/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/                  # App Router Core pages
│   │   │   ├── page.tsx          # Dashboard Metrics
│   │   │   ├── upload/           # Native Capture Docks & Video Feeds
│   │   │   ├── meetings/         # Searchable Diarized Transcripts
│   │   │   ├── tasks/            # Kanban accountability board
│   │   │   ├── decisions/        # Overrides & Alternative dropdowns
│   │   │   ├── search/           # Semantic chat query input
│   │   │   ├── analytics/        # Friction charts & Turnaround metrics
│   │   │   ├── graph/            # SVG force-link memory graph
│   │   │   └── layout.tsx        # Global shell and typography
│   │   └── components/
│   │       └── Sidebar.tsx       # Glassmorphic Side navigation
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── models.py             # SQLModel Database Schemas
│   │   ├── database.py           # SQLite engines & table creators
│   │   ├── ai_service.py         # Whisper, Vector Similarity & Fallbacks
│   │   ├── sample_data.py        # Enterprise seed script
│   │   └── main.py               # REST & WebSockets router
│   ├── requirements.txt          # Python dependencies
│   └── run.py                    # App bootstrap script
└── README.md                     # Operational documentation
```

---

## Technology Stack

* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Framer Motion
* **Backend**: FastAPI, Uvicorn, Python 3.13
* **Database & Vectors**: SQLite, SQLModel (SQLAlchemy + Pydantic), local Token-Embeddings / Cosine Similarity indexers
* **AI Utilities**: OpenAI Whisper API, Sentence Transformers (or token-based mathematical fallback vectors)

---

## Getting Started

### 1. Backend Setup (FastAPI & SQLite)

Make sure you have Python 3.13+ installed. Open a terminal and run:

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate   # Windows shell

# Install Python dependencies
pip install -r requirements.txt

# Run the backend (will auto-create meetgraph.db and seed it with realistic data!)
python run.py
```

The FastAPI backend runs on `http://127.0.0.1:8000`. You can inspect the interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 1.1 Welcome Email Configuration
To enable email notifications, configure the email credentials in your environment (`backend/.env`):
- `SENDER_EMAIL=reetikhandelwal09@gmail.com`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=reetikhandelwal09@gmail.com`
- `SMTP_PASSWORD="your_google_app_password"`

### 2. Frontend Setup (Next.js & Tailwind CSS)

Make sure you have Node v22.16+ installed. Open a separate terminal and run:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser. The application is completely wired to run with your FastAPI backend and interactively analyze meetings.
