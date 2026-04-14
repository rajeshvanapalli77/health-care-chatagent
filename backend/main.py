import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

from agents.graph import app as graph_app
from rag.pipeline import ingest_complex_document
from database import add_message_to_history, get_chat_history_str

app = FastAPI(title="Healthcare RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    is_emergency: bool
    intent: str
    language: str
    urgency: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_API_KEY") == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is missing or invalid.")
        
    try:
        # 1. Fetch chat history from Chroma
        chat_history = get_chat_history_str(request.session_id)
        
        # 2. Run graph predicting context and history
        result = graph_app.invoke({
            "question": request.query,
            "chat_history": chat_history
        })
        
        # 3. Save conversation back to Chroma manually
        response_text = result.get("response", "No response generated.")
        
        add_message_to_history(request.session_id, "user", request.query)
        add_message_to_history(request.session_id, "assistant", response_text)
        
        return ChatResponse(
            response=response_text,
            is_emergency=result.get("is_emergency", False),
            intent=result.get("intent", "UNKNOWN"),
            language=result.get("language", "UNKNOWN"),
            urgency=result.get("urgency", "UNKNOWN")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    if not os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_API_KEY") == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is missing. Configure it in .env")
        
    try:
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"📄 Processing multimodal document: {file_path}")
        chunks_added = ingest_complex_document(file_path)
        
        return {
            "message": f"Successfully parsed {file.filename} including charts & tables.", 
            "chunks_created": chunks_added
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Mount frontend from the root-level frontend directory
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    print("🚀 Starting Healthcare RAG Backend and Frontend Server...")
    print("🌐 Access the beautiful UI at: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
