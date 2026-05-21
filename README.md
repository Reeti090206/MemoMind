# MeetGraph: Organizational Memory Intelligence System

MeetGraph is a modern, premium, futuristic full-stack SaaS platform designed to serve as a long-term intelligent memory layer for organizations. Unlike a standard meeting summarizer, MeetGraph records transcripts and maps them onto a unified **Organizational Memory Graph** that tracks decision histories, accountability tasks, pending items, circular debates, and contradictions across meetings.

---

## Key Features

1. **Speech-to-Text Ingestion**: Drag-and-drop meeting uploads (MP3, WAV, MP4) with simulated and real Whisper STT pipelines + automatic multi-speaker diarization.
2. **Live Microphone Stream Workspace**: Pulsing microphone recording dock that feeds speech segments in real-time, extracting tasks and decision blocks.
3. **Accountability Kanban Board**: A task tracking workspace mapped directly to resolved decisions. Mapped to assignees (Aman, Reeti, Sarah) with statuses updated directly in the backend SQLite database.
4. **Decision Lineage Timeline**: Audits chronological policy choices, highlighting overriding states and indexing rejected alternatives discussed during sync sessions.
5. **Policy Contradiction Detection**: AI compares new decisions with past ones using semantic vector embeddings and alerts users if a new stance conflicts with a past sync (e.g. monolith vs microservices).
6. **Circular Debate Detection**: Flags recurring topics that appear across multiple consecutive meetings without reaching a definitive resolution.
7. **Semantic Memory Search**: ChatGPT-style search workspace where natural language queries receive direct answers, linked meeting nodes, related task listings, and precise spoken transcript snippets.
8. **Force-Directed SVG Graph Canvas**: An interactive node-link trace canvas (Meetings ↔ Decisions ↔ Tasks ↔ Members) supporting zoom, pan, drags, and sidebar inspectors.

---

## Directory Structure

```
MemoMind/
├── frontend/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/                  # App Router Core pages
│   │   │   ├── page.tsx          # Dashboard Metrics
│   │   │   ├── upload/           # Drag & Drop + Recording Waveforms
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
└── README.md                     # Detailed developer operations manual
```

---

## Technology Stack

* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Framer Motion
* **Backend**: FastAPI, Uvicorn, Python 3.13
* **Database & Vectors**: SQLite, SQLModel (SQLAlchemy + Pydantic), local Token-Embeddings / Cosine Similarity indexers
* **AI Utilities**: OpenAI Whisper API, Sentence Transformers

---

## Getting Started

### 1. Backend Setup (FastAPI & SQLite)

Make sure you have Python 3.13+ installed. Open a terminal and run:

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate   # Windows

# Install Python dependencies
pip install -r requirements.txt

# Run the backend (will auto-create meetgraph.db and seed it with realistic data!)
python run.py
```

The FastAPI backend runs on `http://127.0.0.1:8000`. You can inspect the Swagger documentation at `http://127.0.0.1:8000/docs`.

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

Open `http://localhost:3000` in your browser. The application is completely wired to communicate with the FastAPI backend, but also contains fully integrated, high-fidelity fallback states so the visual layouts work beautifully out of the box even if the API server is starting up.

---

## Smart AI Workflows & Match Algorithms

* **Semantic Search**: Meets queries using a robust mathematical text embedding service. It transforms text blocks into 384-dimensional similarity arrays and queries them using local cosine vectors:
  $$\text{Similarity} = \frac{A \cdot B}{\|A\| \|B\|}$$
* **Contradiction Search**: Matches newly added decision tokens against past database rows. If semantic overlaps match highly (> 0.58) but negative tokens exist (e.g. shift from "avoid microservices" to "migrate to microservices"), it flags a contradiction alert immediately.
* **Circular Loops**: Scans historical transcript records. If active keywords (like "authentication") appear in 3 or more sync sessions without status resolving, it issues a "Circular discussion warning" banner.
