import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from database import patient_files_store, clear_session_data, collection
from prompts.system_prompts import SESSION_UI_STATE_CONTROLLER_PROMPT
import time

load_dotenv()

def get_controller_llm():
    """Build controller LLM fresh from .env at call time."""
    model_name = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    temperature = float(os.getenv("LLM_TEMPERATURE", 0))
    return ChatGoogleGenerativeAI(model=model_name, temperature=temperature)

def invoke_controller(command_type: str, payload: dict, session_id: str):
    """
    Executes the JSON Controller logic mapped against explicit UI commands.
    """
    try:
        results = collection.get(where={"session_id": session_id})
        msg_count = len(results.get("ids", [])) if results else 0
    except:
        msg_count = 0

    p_files = patient_files_store.get(session_id, [])

    prompt = PromptTemplate(
        template=SESSION_UI_STATE_CONTROLLER_PROMPT,
        input_variables=["session_id", "patient_files_json", "message_count", "languages_used", "last_active", "command_type"]
    )

    chain = prompt | get_controller_llm() | JsonOutputParser()

    response_payload = {}
    try:
        response_payload = chain.invoke({
            "session_id": session_id,
            "patient_files_json": json.dumps(p_files),
            "message_count": msg_count,
            "languages_used": '["English"]',
            "last_active": str(time.time()),
            "command_type": command_type
        })
    except Exception as e:
        print(f"Controller LLM Failure: {e}")
        return {"error": "Failed to parse command locally"}

    if command_type == "CLEAR_SESSION":
        stats = clear_session_data(session_id)
        return stats

    elif command_type == "DELETE_FILE":
        file_id = payload.get("file_id")
        if file_id and p_files:
            patient_files_store[session_id] = [f for f in p_files if f.get("file_id") != file_id]
            response_payload["updated_files"] = patient_files_store[session_id]

    elif command_type == "DELETE_MESSAGE":
        msg_id = payload.get("message_id")
        if msg_id:
            try:
                collection.delete(ids=[msg_id])
                response_payload["deleted"] = True
            except:
                response_payload["deleted"] = False

    elif command_type == "GET_HISTORY":
        if "messages" not in response_payload:
            response_payload["messages"] = []

    return response_payload
