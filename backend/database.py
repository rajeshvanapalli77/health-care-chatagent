import os
import chromadb
import time

# Directory for Chroma DB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_chat_db")

# Initialize persistent client
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

# Get or create chronological collection
collection = chroma_client.get_or_create_collection(name="chat_history")

# In-memory store for personal files uploaded per session.
# Keys are session_id strings, values are lists of JSON extracted dicts
patient_files_store = {}

def add_patient_file(session_id: str, file_summary_json: dict):
    if session_id not in patient_files_store:
        patient_files_store[session_id] = []
    patient_files_store[session_id].append(file_summary_json)

def get_patient_files_context(session_id: str) -> str:
    if session_id not in patient_files_store or not patient_files_store[session_id]:
        return "No specific personal patient documents uploaded for this session."
    
    context = []
    for f in patient_files_store[session_id]:
        context.append(f"File Type: {f.get('medical_document_type')}\nExtracted Data: {f.get('extracted_data', {})}\nID: {f.get('file_id')}")
    return "\n\n".join(context)

def clear_session_data(session_id: str):
    """
    Purges ALL chat history and PATIENT uploaded files matching the session id.
    Hospital admin files are strictly spared.
    """
    deleted_files = 0
    if session_id in patient_files_store:
        deleted_files = len(patient_files_store[session_id])
        del patient_files_store[session_id]
        
    results = collection.get(where={"session_id": session_id})
    deleted_msgs = len(results.get("ids", []))
    
    if deleted_msgs > 0:
        collection.delete(ids=results["ids"])
        
    return {"session_cleared": True, "files_deleted": deleted_files, "messages_deleted": deleted_msgs}

def add_message_to_history(session_id: str, role: str, text: str):
    """
    Appends a new message to the Chroma DB history for chronological retrieval.
    """
    if not text:
        return
        
    timestamp = str(time.time())
    message_id = f"msg_{session_id}_{timestamp}"
    
    collection.add(
        documents=[text],
        metadatas=[{"session_id": session_id, "role": role, "timestamp": timestamp}],
        ids=[message_id]
    )

def get_chat_history_str(session_id: str, limit: int = 4) -> str:
    """
    Retrieves recent history for a specific session ID fast.
    """
    try:
        results = collection.get(where={"session_id": session_id})
        
        if not results or not results["documents"]:
            return "No previous chat history."
            
        docs = results["documents"][-limit:]
        metas = results["metadatas"][-limit:]
        
        formatted_history = []
        for i in range(len(docs)):
            role_display = "User" if metas[i].get("role") == "user" else "Assistant"
            formatted_history.append(f"{role_display}: {docs[i]}")
            
        return "\n".join(formatted_history)
        
    except Exception as e:
        print(f"Error fetching history: {e}")
        return "No previous chat history."
