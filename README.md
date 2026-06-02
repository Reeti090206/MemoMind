# 🧠 MemoMind — Organizational Memory Intelligence System

> **Turn every meeting into permanent, searchable, actionable organizational memory.**

MemoMind is a premium full-stack SaaS platform that acts as a long-term intelligent memory layer for teams and organizations. It goes far beyond a meeting summarizer — MemoMind records real transcripts, detects accountability tasks, surfaces decision contradictions, identifies circular debates, and maps everything onto an interactive **Organizational Memory Graph**.

---

## ✨ Feature Highlights

### 🎙️ Three-Mode Capture System

| Mode | Description |
|------|-------------|
| **Upload File** | Drag-and-drop audio/video files (MP3, WAV, MP4, WebM). Binary upload progress tracked via `XMLHttpRequest`. |
| **Use Microphone** | Browser-native mic recording via `getUserMedia` + `MediaRecorder`. Real-time waveform visualizer powered by Web Audio `AnalyserNode`. Audio-only — no screen share prompt. |
| **Live Assistant** | Full screen-share + microphone capture via `getDisplayMedia`. Mixes system audio with mic input. Includes live video preview feed and optional Vision AI screen analysis. |

### 🤖 AI-Powered Intelligence

- **Whisper Transcription** — OpenAI Whisper API for accurate speech-to-text with speaker diarization.
- **GPT-4o-mini Analysis** — Structured extraction of summaries, action items, decisions, and contradictions.
- **Vision AI Agent** — Periodic screen frame capture (JPEG) sent over WebSocket for visual context analysis (Live Assistant only).
- **Real-Time Speech Recognition** — Browser-native `SpeechRecognition` API for instant live transcript display during capture.
- **Semantic Search** — Natural language memory search using text embeddings and cosine similarity:

$$\text{Similarity} = \frac{A \cdot B}{\|A\| \|B\|}$$

### 📊 Organizational Intelligence Dashboards

- **Dashboard** — Metrics overview with meeting counts, task completion rates, and team activity.
- **Accountability Kanban Board** — Track action items mapped to owners and decisions.
- **Decision Lineage & Contradiction Alerts** — Chronological decision history with override detection.
- **Circular Debate Detection** — Flags recurring unresolved topics across meetings.
- **Analytics** — Friction charts, turnaround metrics, and engagement scores.
- **Interactive Memory Graph** — Force-directed SVG network linking meetings, decisions, tasks, and team members.

### 🔐 Authentication & Team Management

- **Firebase Authentication** — Email/password login with Google Sign-In.
- **Phone OTP Verification** — SMS-based two-factor authentication via Firebase.
- **Team Management & Collaborators** — Invite members, assign roles, manage organizational access, and dynamically view meeting-specific collaborators, speaking distributions, and assigned task counts.
- **Settings Panel** — User profile management, app configuration settings, and credentials verification.

### 🛡️ Credentials Encryption & Connection Routing

- **AES-256 Encryption** — High-security AES symmetric encryption (using `cryptography.fernet`) dynamically encrypts sensitive credentials (like the OpenAI API key and PostgreSQL URL) stored in the SQLite settings DB. Secret keys are masked in API responses to prevent client-side leakage.
- **Dynamic Protocol Interceptor** — Overrides native `window.fetch` and `window.WebSocket` on the client to automatically bypass SSL preflight redirect loops in local development, ensuring seamless HTTP/WS communication to `localhost:8000`.
- **Setting Change Audit Logs** — Preserves history (`SettingsHistory`) of all configuration changes made in the dashboard, tracking old values, new values, and the updating user.


### 🎨 Design & UX

- **Light / Dark Mode** — System-aware theme toggle with smooth transitions.
- **Glassmorphic UI** — Premium frosted-glass effects, gradients, and micro-animations.
- **Animated Login Wall** — Terrain-line animated background with glass card login.
- **Responsive Layout** — Sidebar navigation with collapsible design.

---

## 📁 Project Structure

```
MemoMind/
├── frontend/                          # Next.js 16 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Dashboard — metrics & overview
│   │   │   ├── upload/page.tsx        # 3-tab capture: Upload / Mic / Live Assistant
│   │   │   ├── meetings/page.tsx      # Meeting list & diarized transcript viewer
│   │   │   ├── tasks/page.tsx         # Kanban accountability board
│   │   │   ├── decisions/page.tsx     # Decision lineage & contradiction alerts
│   │   │   ├── search/page.tsx        # Semantic memory search
│   │   │   ├── analytics/page.tsx     # Friction charts & turnaround metrics
│   │   │   ├── graph/page.tsx         # SVG force-directed memory graph
│   │   │   ├── team/page.tsx          # Team management & invitations
│   │   │   ├── settings/page.tsx      # User settings & preferences
│   │   │   ├── login/page.tsx         # Authentication entry point
│   │   │   ├── layout.tsx             # Root layout with providers
│   │   │   └── globals.css            # Design tokens & theme variables
│   │   └── components/
│   │       ├── AuthProvider.tsx        # Firebase auth context & session management
│   │       ├── GlassLoginWall.tsx      # Animated glassmorphic login gate
│   │       ├── LayoutClient.tsx        # Client-side layout with sidebar
│   │       ├── Sidebar.tsx             # Navigation sidebar
│   │       ├── TerrainLines.tsx        # Animated terrain background
│   │       ├── ThemeProvider.tsx        # next-themes provider
│   │       └── ThemeToggle.tsx          # Light/dark mode switch
│   └── package.json
│
├── backend/                            # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py                    # REST API routes & WebSocket handlers
│   │   ├── models.py                  # SQLModel database schemas
│   │   ├── database.py                # SQLite engine & table creation
│   │   ├── ai_service.py             # Whisper, GPT, embeddings & similarity
│   │   ├── agents.py                  # Vision AI agent & advanced analysis
│   │   └── sample_data.py            # Enterprise seed data script
│   ├── requirements.txt
│   └── run.py                         # App bootstrap
│
├── .gitignore
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide React, next-themes |
| **Backend** | FastAPI, Uvicorn, Python 3.13+ |
| **Database** | SQLite, SQLModel (SQLAlchemy + Pydantic) |
| **AI / ML** | OpenAI Whisper API, GPT-4o-mini, Sentence Transformers, Cosine Similarity |
| **Auth** | Firebase Authentication (Email, Google, Phone OTP), firebase-admin SDK |
| **Real-Time** | WebSockets (binary audio streaming), Web Audio API, MediaRecorder, SpeechRecognition |

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.13+
- **Node.js** 22.16+
- **OpenAI API Key** (for Whisper & GPT)
- **Firebase Project** (for authentication)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server (auto-creates DB & seeds sample data)
python run.py
```

The API runs at **http://127.0.0.1:8000** — Swagger docs at `/docs`.

### 2. Environment Variables

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-your-openai-key

# Email notifications (optional)
SENDER_EMAIL=your@email.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your_app_password
```

Firebase credentials are configured in the frontend via `firebase` config in `AuthProvider.tsx`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🔄 WebSocket Streaming Pipeline

```
Browser (MediaRecorder)
    │
    ├─ Binary audio chunks (1s intervals) ──► /ws/meeting-stream
    │                                              │
    │                                              ├─ Whisper transcription (background thread)
    │                                              ├─ GPT structured analysis
    │                                              └─ Live segments pushed back to client
    │
    └─ Screen frames (JPEG, 5s intervals) ──► Vision AI Agent (Live Assistant only)
```

---

## 📸 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Org metrics, meeting counts, task completion |
| Add Meeting | `/upload` | Three-tab capture system |
| Meetings | `/meetings` | Browse & view transcripts with speaker labels |
| Tasks | `/tasks` | Kanban board for accountability items |
| Decisions | `/decisions` | Decision history with contradiction flags |
| Search | `/search` | Semantic natural-language memory query |
| Analytics | `/analytics` | Charts for friction, turnaround, engagement |
| Memory Graph | `/graph` | Interactive force-directed knowledge graph |
| Team | `/team` | Member management, invitations, and meeting-based collaborator analytics |
| Settings | `/settings` | Profile & app configuration |

---

## 📄 License

This project is for educational and demonstration purposes.

---

<p align="center">
  Built with 💜 by <a href="https://github.com/Reeti090206">Reeti</a> & <a href="https://github.com/Gargi0620">Gargi</a>
</p>
