# DocsLM.ai — AI Document Knowledge Platform

DocsLM is a production-quality, document-only AI knowledge platform inspired by NotebookLM. The application allows users to create notebook workspaces, upload multi-format documents (PDF, DOCX, TXT, MD), execute structure-aware document parsing & vector indexing, query documents using a LangGraph-orchestrated RAG workflow with page-level citations, jump directly to cited source sections in a side-by-side document viewer, and generate studio outputs including Mind Maps, Presentation Slide Decks, Interactive Quizzes, 3D Study Flashcards, and AI Audio Podcast Overviews.

---

## 🌟 Key Features

### 📁 1. Document-Only Knowledge Workspaces
- **Multi-Format Support**: Upload PDF, Word (`.docx`, `.doc`), TXT, and Markdown (`.md`) files.
- **Asynchronous Document Pipeline**: Non-blocking upload handler with PyMuPDF page extraction, `python-docx` section parser, and Tesseract OCR fallback for scanned PDFs.
- **Structure-Aware Chunking**: Preserves section headings, paragraph boundaries, and page numbers in chunk metadata.
- **Strict Tenant Isolation**: Vector embeddings indexed into Pinecone under namespace `notebook_{notebook_id}` to prevent cross-notebook vector leakage.

### 💬 2. Grounded RAG Chat & Interactive Citations
- **LangGraph Workflow**: Orchestrates query intent analysis, vector similarity search, relevancy evaluation with query rewriter retry loop, grounded answer generation, and citation checking.
- **Prompt Injection Protection**: Treats uploaded document contents strictly as evidence material, not as executable system instructions.
- **Real-Time Token Streaming**: Server-Sent Events (SSE) streaming fast-path delivering live response tokens and citation payloads.
- **Interactive Source Citation Viewer**: Clicking citation badges like `[1] research.pdf - Page 14` opens the side-by-side document viewer, jumps to the cited page, and highlights the referenced snippet.

### 🎨 3. Complete AI Studio Suite
1. **Interactive Mind Maps (`MIND_MAP`)**: Concept hierarchy generation rendered via **React Flow** with interactive zoom, collapse, and pan controls.
2. **Presentation Slide Decks (`SLIDE_DECK`)**: Bullet points, slide thumbnail navigator, presenter speaker notes, and presentation view.
3. **Knowledge Quizzes (`QUIZ`)**: Interactive multiple-choice comprehension tests with instant option evaluation, explanations, score calculation, and retake controls.
4. **3D Study Flashcards (`FLASHCARDS`)**: Double-sided flip cards (Front: Question/Concept, Back: Definition/Explanation) with flip animations, category filters, and mastery tracking.
5. **AI Audio Overview Podcasts (`PODCAST`)**: Dialogue script generation between Host A (Technical Lead) and Host B (Curious Co-host), TTS voice synthesis, audio merging, and MP3 player with playback speed controls (1x, 1.25x, 1.5x).

### 🤖 4. Flexible LLM Provider Integration
- Preconfigured for **Local Ollama** (`qwen3:4b`) for zero-cost local LLM inference.
- Preserved commented integrations for **Google Gemini** (`gemini-2.5-flash`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, JavaScript, Tailwind CSS, Zustand, React Flow (`@xyflow/react`), React Markdown |
| **Backend** | Python 3.12, FastAPI, Pydantic, PyMuPDF (`pymupdf`), `python-docx`, `pytesseract`, `pdf2image`, `langchain-ollama`, `langgraph`, `edge-tts`, `pydub`, PyJWT, `bcrypt` |
| **Databases & Cache** | MongoDB Atlas / Local MongoDB, Pinecone/MongoDB Vector DB, Redis |
| **DevOps & Containerization** | Docker, Docker Compose |

---

## 🏗️ System Architecture

```
                                  +-------------------+
                                  |   Next.js 16 UI   |
                                  | (App Router / JS) |
                                  +---------+---------+
                                            |
                                      HTTPS / SSE
                                            |
                                  +---------v---------+
                                  |  FastAPI Backend  |
                                  +----+----+----+----+
                                       |    |    |
           +---------------------------+    |    +---------------------------+
           |                                |                                |
 +---------v---------+            +---------v---------+            +---------v---------+
 | Document Service  |            | RAG / Chat Service|            |  Studio Service   |
 +---------+---------+            +---------+---------+            +---------+---------+
           |                                |                                |
           v                                v                                v
 +---------+---------+            +---------+---------+            +---------+---------+
 | Redis Task Queue  |            | LangGraph Workflow|            | LangGraph Studio  |
 +---------+---------+            +---------+---------+            +---------+---------+
           |                                |                                |
 +---------v---------+                      v                                v
 | Celery / Workers  |             Pinecone Vector DB               Audio TTS Engine
 | - PyMuPDF / docx  |           (Namespace: notebook_id)           & Audio Merger
 | - OCR (pytesseract|                      ^                                |
 | - Chunk & Embed   |                      |                                |
 +---------+---------+                      +--------------------------------+
           |                                
           v                                
 +---------+---------+
 | MongoDB Atlas     | <--- Users, Notebooks, Documents, Conversations, Studio Outputs
 +-------------------+
 | Object Storage    | <--- Original PDFs / DOCX & Generated MP3 Podcast Audio
 +-------------------+
```

---

## 📁 Project Structure

```
docs-lm/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI Route Handlers (auth, notebooks, documents, chat, studio)
│   │   ├── agents/       # LangGraph Workflows (rag_graph, mindmap_graph, slides_graph, quiz_graph, flashcards_graph, podcast_graph)
│   │   ├── core/         # Security (JWT, bcrypt), Database (MongoDB), Config Settings
│   │   ├── schemas/      # Pydantic Schemas for Request/Response validation
│   │   ├── services/     # Business logic (document_service, retrieval_service, llm_service, embedding_service, storage_service, tts_service)
│   │   ├── workers/      # Asynchronous Background Processing Tasks
│   │   └── main.py       # FastAPI Entrypoint & Middleware
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router Pages (login, register, dashboard, notebook/[id])
│   │   ├── components/   # UI Components (Navbar, DocumentList, DocumentViewer, UploadModal, ChatWindow, MindMapViewer, SlideDeckViewer, QuizViewer, FlashcardViewer, PodcastPlayer)
│   │   ├── lib/          # API fetch helpers & SSE Streaming client
│   │   └── stores/       # Zustand Global State Management
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+
- **Python**: v3.11+
- **MongoDB**: v6+ (Local instance or MongoDB Atlas URI)
- **Ollama**: (Optional for local LLM execution) `ollama run qwen3:4b`

---

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv myvenv
# On Windows:
myvenv\Scripts\activate
# On Linux/macOS:
source myvenv/bin/activate

# Install backend python dependencies
pip install -r requirements.txt

# Create configuration environment file
cp .env.example .env
```

Start the backend server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

---

### Step 2: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Create frontend environment file
cp .env.example .env.local
```

Start the frontend development server:
```bash
npm run dev
```
Frontend application will run at `http://localhost:3000`.

---

## 🐳 Docker Deployment

To launch the full system (FastAPI, Next.js, MongoDB, Redis) with a single command:

```bash
docker compose up --build
```

---

## 📡 API Reference Overview

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Login & receive HTTP-only JWT cookie
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Fetch current user details

### Notebooks Workspace
- `GET /api/notebooks` — List user notebooks
- `POST /api/notebooks` — Create a new workspace
- `GET /api/notebooks/{id}` — Get notebook details
- `DELETE /api/notebooks/{id}` — Delete notebook and associated vectors/documents

### Documents
- `POST /api/notebooks/{id}/documents` — Upload PDF/DOCX/TXT/MD document
- `GET /api/notebooks/{id}/documents` — List workspace documents
- `GET /api/documents/{id}` — Get document status & metadata
- `DELETE /api/documents/{id}` — Remove document & vector embeddings

### RAG Chat
- `POST /api/notebooks/{id}/chat/stream` — SSE endpoint streaming AI response tokens and citation payloads
- `GET /api/notebooks/{id}/conversations` — List workspace conversations
- `GET /api/conversations/{id}/messages` — Fetch conversation history

### Studio Features
- `POST /api/notebooks/{id}/studio/mindmap` — Generate Mind Map JSON
- `POST /api/notebooks/{id}/studio/slides` — Generate Presentation Slide Deck JSON
- `POST /api/notebooks/{id}/studio/quiz` — Generate Interactive Quiz JSON
- `POST /api/notebooks/{id}/studio/flashcards` — Generate Study Flashcards JSON
- `POST /api/notebooks/{id}/studio/podcast` — Trigger background AI Podcast MP3 generation
- `GET /api/notebooks/{id}/studio/outputs` — Get generated studio outputs

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
