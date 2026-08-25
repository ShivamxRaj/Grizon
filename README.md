# ⚖️ Grizon AI — Multilingual Indic Legal AI Platform

Grizon AI is an Indic legal AI system built specifically for legal research, automated drafting, court e-filing data extraction, and document intelligence with **Sarvam AI (Saaras STT, Sarvam-Translate, Sarvam Vision OCR)** and **eCourts API Integration**.

---

## 🏗️ Architecture Overview

- **Frontend**: Built with React 19, TypeScript, Vite, TanStack Router, TanStack Query, and TailwindCSS v4.
- **Backend**: FastAPI Python 3.12 microservice featuring Sarvam AI integrations, eCourts data pipeline, multi-agent legal reasoning engine, and JWT security.

```
                  ┌─────────────────────────────────────────┐
                  │          Grizon React Frontend          │
                  │   (Vite + TanStack Router + Tailwind)   │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          FastAPI Python Backend         │
                  │      (Agentic Workflows & Connectors)   │
                  └──────┬───────────────────┬──────────────┘
                         │                   │
                         ▼                   ▼
         ┌───────────────────────┐   ┌───────────────────────┐
         │     Sarvam AI Suite   │   │   eCourts Data API    │
         │  (STT, Translate, OCR)│   │  (CNR & Cause List)   │
         └───────────────────────┘   └───────────────────────┘
```

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Start the backend server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API Docs will be live at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

In the project root directory:
```bash
npm install
npm run dev
```
Frontend will be live at `http://127.0.0.1:5173`.

---

## 🔑 Environment Variables

Create a `backend/.env` file:
```env
SARVAM_API_KEY=your_sarvam_api_key
GROQ_API_KEY=your_groq_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
SERPER_API_KEY=your_serper_api_key
JWT_SECRET=your_secret_key_here
```

---

## 🚀 Deployment Guide

### Deploying Frontend (Vercel / Netlify)
1. Import repository to **Vercel** or **Netlify**.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. SPA Rewrite rules are pre-configured in `vercel.json`.

### Deploying Backend (Render / Railway / Docker)
- **Render**: Connect repo, set root directory to `backend`, Render will detect `render.yaml`.
- **Docker**: Build using `Dockerfile` in the root or `backend/Dockerfile`.

---

## 📄 License
Privately owned & developed for Grizon AI.
