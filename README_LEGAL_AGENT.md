# Grizon + NYAYA Legal Agent Integration

The Grizon frontend remains intact. A FastAPI backend was added using DeepSeek for reasoning, Indian Kanoon for legal research, Serper for live legal/regulatory information, and a placeholder integration point for Sarvam multilingual services.

## Run backend
cd backend
cp .env.example .env
# fill API keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

## Frontend
Run the existing Vite frontend as before. Configure your dev proxy or API base URL so `/api/v1/chat` points to `http://localhost:8000`.
