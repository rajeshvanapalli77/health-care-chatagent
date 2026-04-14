import os
import chromadb
import time

# Directory for Chroma DB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_chat_db")

# Initialize persistent client
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

# Get or create chronological collection
collection = chroma_client.get_or_create_collection(name="chat_history")

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

def get_chat_history_str(session_id: str, limit: int = 6) -> str:
    """
    Retrieves the chronological history for a specific session ID and returns it as a formatted string.
    Since Chroma DB doesn't perfectly sort get() operations out of the box natively, 
    we will pull everything for this session and sort it programmatically.
    """
    try:
        results = collection.get(
            where={"session_id": session_id}
        )
        
        if not results or not results["documents"]:
            return "No previous chat history."
            
        # Zip the results together
        history_msgs = []
        for i in range(len(results["ids"])):
            history_msgs.append({
                "role": results["metadatas"][i]["role"],
                "text": results["documents"][i],
                "timestamp": float(results["metadatas"][i]["timestamp"])
            })
            
        # Sort chronologically
        history_msgs = sorted(history_msgs, key=lambda x: x["timestamp"])
        
        # Take the last 'limit' messages to prevent exceeding context bounds
        recent_msgs = history_msgs[-limit:]
        
        # Format string
        formatted_history = []
        for msg in recent_msgs:
            role_display = "User" if msg["role"] == "user" else "Assistant"
            formatted_history.append(f"{role_display}: {msg['text']}")
            
        return "\n".join(formatted_history)
        
    except Exception as e:
        print(f"Error fetching Chroma history: {e}")
        return "No previous chat history."
