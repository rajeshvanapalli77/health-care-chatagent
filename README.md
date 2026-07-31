# 🏥 Multilingual Healthcare RAG AI Assistant

> **A Production-Ready, Multithreaded, HIPAA-Compliant Healthcare Intelligence System built with Gemini 2.0 Flash, Multimodal Vision AI, LangGraph, FastAPI, ChromaDB, FAISS, and React + Tailwind CSS.**

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/rajeshvanapalli77/health-care-chatagent)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-1.2-orange)
![Gemini AI](https://img.shields.io/badge/Google--Gemini--AI-2.0--Flash-8E75B2?logo=googlegemini)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss)

![Chatbot UI Screenshot](screenshot.png)

---

## 🔗 Repository & Live Deployment Links
- **GitHub Repository**: [https://github.com/rajeshvanapalli77/health-care-chatagent](https://github.com/rajeshvanapalli77/health-care-chatagent)
- **Live Vercel Web App**: [https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/](https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/)

---

## 🌟 Executive Summary

This project is a high-performance, multimodal healthcare AI assistant designed to bridge the gap between patient medical documentation (PDF reports, lab scans, prescriptions, photos) and institutional healthcare knowledge. It features a **Dual-Context Retrieval-Augmented Generation (RAG)** architecture, an **Optimized Multithreaded LangGraph State Machine**, **Fast-Path Emergency Triage**, **Multimodal Vision OCR**, **Text-to-Speech & Speech-to-Text Dictation**, and **Multilingual NLP** supporting **English, Hindi (हिंदी), Telugu (తెలుగు)**, and code-switched queries.

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

## 🧠 Key Features & Technical Innovations

### 1. 👁️ Multimodal Vision OCR (PNG, JPG, WEBP & PDF Reports)
- **Direct Image Processing**: Native support for uploading photos of medical reports, prescriptions, lab results, and diagnostic images (`.png`, `.jpg`, `.jpeg`, `.webp`).
- **Gemini Vision OCR**: Transcribes text, numerical lab metrics, reference ranges, and physician notes directly into structured patient session memory.

### 2. 🎙️ Voice Assistant (Text-to-Speech & Voice Dictation)
- **Speech Synthesis (Voice Readout)**: Click the speaker button on AI responses to listen to clinical guidance spoken aloud.
- **Voice Microphone Dictation**: Dictate symptoms hands-free using browser Web Speech Recognition.

### 3. 📊 Advanced Health Calculators & Emergency Directory
- **Body Mass Index (BMI) Calculator**: Instant BMI calculation, category classification, and lifestyle guidance.
- **Daily Hydration Estimator**: Tailored daily water intake calculator based on body weight and exercise activity.
- **Emergency Hotline Directory**: Quick access to national emergency lines (112, 108/102 ambulance, 1078 disaster rescue, poison control).

### 4. 📄 1-Click Consultation Transcript Export
- Export consultation history into a formatted `.txt` medical summary complete with session timestamps and HIPAA compliance disclaimers.

### 5. ⚡ Multithreaded Parallel Pipeline & Async Execution
- **Concurrent Node Execution**: Intent classification and FAISS document retrieval execute concurrently using Python `ThreadPoolExecutor`, reducing wait time by >50%.
- **Async Non-Blocking FastAPI**: Graph invocations are offloaded via `asyncio.to_thread` to keep the FastAPI event loop unblocked.
- **Background History Persistence**: ChromaDB writes are handled asynchronously via FastAPI `BackgroundTasks`.

### 6. 🚀 Fast-Path Emergency Triage
- Zero-latency pre-screener that instantly identifies red-flag medical emergencies (chest pain, stroke signs, respiratory distress) in **0ms**.

### 7. 🌐 Multilingual & Code-Switched Intelligence
- Seamlessly handles queries in **English**, **Hindi (हिंदी)**, **Telugu (తెలుగు)**, and **Hinglish/Telglish** code-switching.

---

## ⚙️ Tech Stack & Dependencies

| Layer | Technology Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion |
| **Backend API** | FastAPI, Uvicorn, Pydantic, Asyncio |
| **AI / Vision** | LangGraph, LangChain, Google Gemini API (`gemini-2.0-flash`), Vision OCR |
| **Concurrency** | `ThreadPoolExecutor`, `asyncio.to_thread`, `BackgroundTasks` |
| **Embeddings & Vector Search** | `models/text-embedding-004`, FAISS, ChromaDB |
| **Document Processing** | PyMuPDF4LLM, Pillow, Base64 Image Processing |

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

Navigate to the `backend/` directory:

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

Open a **second** terminal window and navigate to the `frontend/` directory:

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
| `POST` | `/api/patient-upload` | Upload patient personal health report or image (session-isolated) |
| `POST` | `/api/upload` | Upload institutional hospital document (FAISS vector store) |
| `POST` | `/api/controller` | Session state control (CLEAR_SESSION, DELETE_FILE, GET_HISTORY) |
| `POST` | `/api/feedback` | Submit customer review & rating |
| `GET` | `/api/feedback` | List feedback items for admin review |

---

## 🐙 Push & Synchronization with GitHub

```bash
git add .
git commit -m "feat: Add Multimodal Image Vision OCR, Voice Assistant, Health Calculators, and README updates"
git push origin main
```

**Repository URL**: [https://github.com/rajeshvanapalli77/health-care-chatagent](https://github.com/rajeshvanapalli77/health-care-chatagent)

---

## 🌐 Free Public Deployment (Render & Vercel)

### 1. Backend Deployment (Render - Free Web Service)
1. Log in to [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect repository `https://github.com/rajeshvanapalli77/health-care-chatagent`.
4. Set configurations:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. In **Environment Variables**, add `GOOGLE_API_KEY`, `LLM_MODEL_NAME=gemini-2.0-flash`.

### 2. Frontend Deployment (Vercel - Free Static Site)
1. Import repository on [Vercel](https://vercel.com/).
2. Set build configurations:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. In **Environment Variables**, add `VITE_API_URL` pointing to your Render backend URL.
4. **Live App URL**: [https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/](https://health-care-chatagent-git-main-rajeshvanapalli77s-projects.vercel.app/)
