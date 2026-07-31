import os
import shutil
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

from agents.graph import app as graph_app
from agents.controller import invoke_controller
from rag.pipeline import ingest_complex_document
from database import add_message_to_history, get_chat_history_str, patient_files_store, add_patient_file
from feedback_db import create_feedback, get_all_feedbacks, get_feedback_stats, update_feedback, delete_feedback


app = FastAPI(title="Healthcare RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    if not os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_API_KEY") == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is missing or invalid.")
        
    try:
        # 1. Fetch chat history asynchronously in thread
        chat_history = await asyncio.to_thread(get_chat_history_str, request.session_id)
        
        # 2. Run graph concurrently in thread pool (non-blocking for FastAPI loop)
        result = await asyncio.to_thread(
            graph_app.invoke,
            {
                "question": request.query,
                "session_id": request.session_id,
                "chat_history": chat_history
            }
        )
        
        response_text = result.get("response", "No response generated.")
        
        # 3. Offload DB history persistence to background tasks for instant response return!
        background_tasks.add_task(add_message_to_history, request.session_id, "user", request.query)
        background_tasks.add_task(add_message_to_history, request.session_id, "assistant", response_text)
        
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
            
        print(f"[DOC] Processing multimodal document: {file_path}")
        result_payload = await asyncio.to_thread(ingest_complex_document, file_path, uploader_type="HOSPITAL_ADMIN", mime_type=file.content_type)
        
        return result_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

class ControllerPayload(BaseModel):
    command_type: str
    session_id: str
    file_id: str = None
    message_id: str = None

@app.post("/api/controller")
async def controller_endpoint(payload: ControllerPayload):
    try:
        response = await asyncio.to_thread(invoke_controller, payload.command_type, payload.model_dump(), payload.session_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/patient-upload")
async def patient_upload(session_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_API_KEY") == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is missing.")
        
    try:
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"[PATIENT] Processing patient attachment: {file_path}")
        result_payload = await asyncio.to_thread(ingest_complex_document, file_path, uploader_type="PATIENT", mime_type=file.content_type)
        
        if result_payload.get("status") != "REJECTED":
            # Save strictly to memory logic!
            add_patient_file(session_id, result_payload)
            # Add implicit chat message so Assistant knows about the file asynchronously
            user_msg = f"[User uploaded personal file: {file.filename}]"
            file_response_msg = f"Your file {file.filename} was securely processed for this session only.\n\nSummary:\n{result_payload.get('extracted_data', {}).get('raw_text_summary')}"
            
            background_tasks.add_task(add_message_to_history, session_id, "user", user_msg)
            background_tasks.add_task(add_message_to_history, session_id, "assistant", file_response_msg)
            
            result_payload["chat_acknowledgement"] = file_response_msg
            
        return result_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# Feedback & Reviews Models and API Endpoints
class FeedbackCreate(BaseModel):
    name: str = "Anonymous Patient"
    email: str = ""
    rating: int
    category: str
    message: str
    session_id: str = ""

class FeedbackUpdate(BaseModel):
    status: str = None
    admin_notes: str = None

@app.post("/api/feedback")
async def submit_feedback(payload: FeedbackCreate):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Feedback message cannot be empty.")
        
    res = await asyncio.to_thread(
        create_feedback,
        payload.name,
        payload.email,
        payload.rating,
        payload.category,
        payload.message,
        payload.session_id
    )
    return {"status": "success", "feedback": res}

@app.get("/api/feedback")
async def list_feedbacks(category: str = "All", status: str = "All", rating: int = 0):
    feedbacks = await asyncio.to_thread(get_all_feedbacks, category, status, rating)
    return {"feedbacks": feedbacks}

@app.get("/api/feedback/stats")
async def feedback_stats():
    stats = await asyncio.to_thread(get_feedback_stats)
    return stats

@app.patch("/api/feedback/{feedback_id}")
async def patch_feedback(feedback_id: str, payload: FeedbackUpdate):
    updated = await asyncio.to_thread(update_feedback, feedback_id, payload.status, payload.admin_notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Feedback item not found.")
    return {"status": "success", "feedback": updated}

@app.delete("/api/feedback/{feedback_id}")
async def remove_feedback(feedback_id: str):
    deleted = await asyncio.to_thread(delete_feedback, feedback_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Feedback item not found.")
    return {"status": "success", "message": "Feedback deleted successfully."}

# Mount frontend static build directory
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
frontend_dist = os.path.join(frontend_dir, "dist")
root_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")

if os.path.exists(frontend_dist):
    static_dir = frontend_dist
elif os.path.exists(root_dist):
    static_dir = root_dist
else:
    static_dir = frontend_dir

print(f"[SERVER] Mounting static UI directory: {static_dir}")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")



if __name__ == "__main__":
    print("[SERVER] Starting Healthcare RAG Backend and Frontend Server...")
    print("[SERVER] Access the UI at: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
