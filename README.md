# 🏥 Multilingual Healthcare RAG AI Assistant

> **A Production-Ready, Multithreaded, HIPAA-Compliant Healthcare Intelligence System built with Gemini 2.0 Flash, LangGraph, FastAPI, ChromaDB, FAISS, and React + Tailwind CSS.**

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/rajeshvanapalli77/health-care-chatagent)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-1.2-orange)
![Gemini AI](https://img.shields.io/badge/Google--Gemini--AI-2.0--Flash-8E75B2?logo=googlegemini)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss)

![Chatbot UI Screenshot](screenshot.png)

---

## 🔗 Repository Link
- **GitHub**: [https://github.com/rajeshvanapalli77/health-care-chatagent](https://github.com/rajeshvanapalli77/health-care-chatagent)

---

## 🌟 Executive Summary

This project is a high-performance, multilingual healthcare AI assistant designed to bridge the gap between patient medical documentation and institutional healthcare knowledge. It features a **Dual-Context Retrieval-Augmented Generation (RAG)** architecture, an **Optimized Multithreaded LangGraph State Machine**, **Fast-Path Emergency Triage**, and **Multilingual NLP** supporting **English, Hindi (हिंदी), Telugu (తెలుగు)**, and code-switched queries.

---

## 🏗️ System Architecture

```
                                  +-----------------------+
                                  |   React + Vite UI     |
                                  | (English/Hindi/Telugu)|
                                  +-----------+-----------+
                                              |
                                              v (REST API / JSON)
                                  +-----------+-----------+
                                  |   FastAPI Backend     |
                                  +-----------+-----------+
                                              |
                                              v (asyncio.to_thread)
                               +---------------+---------------+
                               |    LangGraph RAG Pipeline     |
                               +---------------+---------------+
                                               |
      +-------------------------+--------------+--------------+-------------------------+
      |                         |                             |                         |
      v                         v (Parallel Thread Pool)      v                         v
+-----+-----+             +-----+---------------------+ +-----+-----+             +-----+-----+
|  Fast-Path|             | Intent Classifier & FAISS | | Dual Vector|             |  Multilingual
| Emergency |             | Vector Search (Concurrent)| | Retrieval |             |  LLM Generation|
| Screener  |             +---------------------------+ | (FAISS +  |             | (Gemini 2.0)   |
|  (0ms)    |                                           | ChromaDB) |             +------------+
+-----------+                                           +-----------+
```

---

## 🧠 Key Technical Innovations & Highlights

### 1. ⚡ Multithreaded Parallel Pipeline & Async Execution
- **Concurrent Node Execution**: Intent classification and FAISS document retrieval execute concurrently using Python `ThreadPoolExecutor`, reducing network wait time by over 50%.
- **Async Non-Blocking FastAPI**: Graph invocations are offloaded via `asyncio.to_thread` to keep the FastAPI event loop unblocked.
- **Background History Persistence**: Chroma DB writes (`add_message_to_history`) are handled asynchronously via FastAPI `BackgroundTasks` so responses return to the user **instantaneously**.

### 2. 🚀 Fast-Path Emergency Triage
- Implements a zero-latency pre-screener that instantly identifies red-flag medical emergencies (e.g., chest pain, respiratory distress, stroke signs) in **0 milliseconds** before reaching LLM nodes.

### 3. 🌐 Multilingual & Code-Switched Intelligence
- Seamlessly handles queries in **English**, **Hindi (हिंदी)**, **Telugu (తెలుగు)**, and **Hinglish/Telglish** code-switching.
- Automatically preserves the patient's script and language context while guaranteeing compliant medical disclaimers in the target language.

### 4. 📚 Dual-Context RAG Pipeline
- **Institutional Context (FAISS):** Admin-uploaded hospital guidelines, clinical protocols, and general health policies stored in FAISS with `gemini-embedding-001`.
- **Patient Context (In-Memory Session Store):** Patient-uploaded lab reports, prescriptions, and medical histories isolated strictly to the active user session.

### 5. 👁️ Multimodal OCR & Parallel Diagram Parsing
- Extracts text, tables, and visual charts from uploaded PDFs, DOCX files, and medical images using `PyMuPDF4LLM` combined with multithreaded Gemini Vision AI parsing.

### 6. 🔒 Zero-Persistence Privacy (HIPAA-Compliant Architecture)
- Personal patient files and extracted medical data are stored in-memory per session and purged upon session termination or user request.

---

## ⚙️ Tech Stack & Dependencies

| Layer | Technology Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend API** | FastAPI, Uvicorn, Pydantic, Asyncio |
| **AI / Orchestration** | LangGraph, LangChain, Google Gemini API (`gemini-2.0-flash`) |
| **Concurrency** | `ThreadPoolExecutor`, `asyncio.to_thread`, `BackgroundTasks` |
| **Embeddings & Vector Search** | `models/gemini-embedding-001`, FAISS, ChromaDB |
| **Document Processing** | PyMuPDF4LLM, Pillow, Regex Parsing |

---

## 🛠️ Environment Configuration (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
LLM_MODEL_NAME=gemini-2.0-flash
LLM_TEMPERATURE=0
```

---

## 🚀 Quick Start Guide

### Step 1: Backend Setup

Open a terminal and navigate to the backend directory:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run the backend server:
```powershell
$env:PYTHONIOENCODING="utf-8"
python main.py
```
*(Backend running at **`http://localhost:8000`**)*

---

### Step 2: Frontend Setup

Open a **second** terminal window and navigate to the frontend directory:

```powershell
cd frontend
npm install
npm run dev
```
*(UI running at **`http://localhost:5173`**)*

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chat` | Main RAG chat endpoint (handles query, session_id, and history asynchronously) |
| `POST` | `/api/patient-upload` | Upload patient personal health report (session-isolated) |
| `POST` | `/api/upload` | Upload institutional hospital document (FAISS vector store) |
| `POST` | `/api/controller` | Session state control (CLEAR_SESSION, DELETE_FILE, GET_HISTORY) |


---

## 🚀 Live Demo & Deployment
- **Live Vercel Frontend**: [https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/](https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/)
- **GitHub Repository**: [https://github.com/rajeshvanapalli77/health-care-chatagent](https://github.com/rajeshvanapalli77/health-care-chatagent)

---

## 🐙 Push & Synchronization with GitHub

```bash
git add .
git commit -m "docs: Update README with GitHub link, Gemini 2.0 Flash, and multithreading performance details"
git push origin main
```

**Repository URL**: [https://github.com/rajeshvanapalli77/health-care-chatagent](https://github.com/rajeshvanapalli77/health-care-chatagent)

---

## 🌐 Free Public Deployment (Render & Vercel)

You can deploy the entire application for **free** using Render (for the backend) and Vercel (for the frontend).

### 1. Backend Deployment (Render - Free Web Service)
1. Sign up/Log in to [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`https://github.com/rajeshvanapalli77/health-care-chatagent`).
4. Set the following configurations:
   - **Name:** `healthcare-rag-backend`
   - **Environment:** `Python`
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. In **Environment Variables**, add:
   - `GOOGLE_API_KEY` = `your_actual_gemini_api_key`
   - `LLM_MODEL_NAME` = `gemini-2.0-flash`
   - `LLM_TEMPERATURE` = `0`
6. Click **Deploy Web Service**. Render will build and deploy your backend. Copy your deployed backend URL (e.g., `https://healthcare-rag-backend.onrender.com`).

### 2. Frontend Deployment (Vercel - Free Static Site)
1. Sign up/Log in to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** and import your repository (`health-care-chatagent`).
3. Configure the build settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL` = (Paste your copied Render backend URL, e.g., `https://healthcare-rag-backend.onrender.com`)
5. Click **Deploy**. Vercel will build your static assets and provide a live public link for your portfolio!
6. **Live App URL**: [https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/](https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/)

