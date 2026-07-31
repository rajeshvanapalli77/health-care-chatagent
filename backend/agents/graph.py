import json
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
import os
from dotenv import load_dotenv

# Ensure .env is loaded before reading model config
load_dotenv()

from prompts.system_prompts import (
    INTENT_CLASSIFICATION_PROMPT,
    EMERGENCY_TRIAGE_PROMPT,
    MULTILINGUAL_HEALTHCARE_ASSISTANT_PROMPT
)
from rag.pipeline import setup_retriever
from database import get_patient_files_context

class GraphState(TypedDict):
    question: str
    session_id: str
    chat_history: Optional[str]
    intent: Optional[str]
    language: Optional[str]
    urgency: Optional[str]
    is_emergency: Optional[bool]
    emergency_action: Optional[str]
    hospital_context: Optional[str]
    patient_context: Optional[str]
    response: Optional[str]

retriever = setup_retriever()

def get_llm():
    """Build LLM fresh from environment variables at call time."""
    model_name = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    temperature = float(os.getenv("LLM_TEMPERATURE", 0))
    print(f"[LLM] Using model: {model_name} | temperature: {temperature}")
    return ChatGoogleGenerativeAI(model=model_name, temperature=temperature)

import re

EMERGENCY_PATTERNS = [
    r"chest pain", r"seene mein dard", r"छाती में दर्द", r"గుండె నొప్పు", r"గుండెనెప్పి",
    r"heart attack", r"stroke", r"unconscious", r"behoshi", r"సృహ తప్పి",
    r"heavy bleeding", r"difficulty breathing", r"saans lene mein takleef", r"శ్వాస అందడం లేదు"
]

def triage_node(state: GraphState):
    """Fast-path triage screener to eliminate unnecessary LLM latency."""
    q_lower = state["question"].lower()
    for pattern in EMERGENCY_PATTERNS:
        if re.search(pattern, q_lower):
            action = "⚠️ EMERGENCY DETECTED: Critical symptoms identified. Please call 108 or proceed to the nearest emergency emergency room IMMEDIATELY."
            return {
                "is_emergency": True,
                "emergency_action": action,
                "urgency": "CRITICAL",
                "response": action
            }

    return {
        "is_emergency": False,
        "urgency": "LOW"
    }

def classification_node(state: GraphState):
    """Classify user intent and detect language."""
    prompt = PromptTemplate(
        template=INTENT_CLASSIFICATION_PROMPT,
        input_variables=["query"]
    )
    chain = prompt | get_llm() | JsonOutputParser()
    try:
        result = chain.invoke({"query": state["question"]})
        return {
            "intent": result.get("intent", "GENERAL_HEALTH_INFO"),
            "language": result.get("language", "English")
        }
    except Exception as e:
        print(f"Error in classification: {e}")
        return {"intent": "GENERAL_HEALTH_INFO", "language": "English"}

def retrieval_node(state: GraphState):
    """Retrieve relevant documents from FAISS."""
    global retriever
    if retriever is None:
        retriever = setup_retriever()

    if retriever is None:
        return {"hospital_context": "No knowledge base available. Answer from general medical knowledge."}

    try:
        docs = retriever.invoke(state["question"])
        if not docs:
            return {"hospital_context": "No documents uploaded. Answer based on common medical knowledge."}
        context = "\n\n".join([doc.page_content for doc in docs])
        return {"hospital_context": context}
    except Exception as e:
        print(f"Error in retrieval: {e}")
        return {"hospital_context": "Knowledge base unreachable. Provide general medical guidance."}

def generation_node(state: GraphState):
    """Generate final response based on dual context."""
    prompt = PromptTemplate(
        template=MULTILINGUAL_HEALTHCARE_ASSISTANT_PROMPT,
        input_variables=["hospital_context", "patient_context", "chat_history", "query", "language", "session_id"]
    )
    chain = prompt | get_llm() | StrOutputParser()

    p_context = get_patient_files_context(state.get("session_id", "default"))

    try:
        resp = chain.invoke({
            "hospital_context": state.get("hospital_context", "No specific institutional context available."),
            "patient_context": p_context,
            "chat_history": state.get("chat_history", "No prior history."),
            "query": state["question"],
            "language": state.get("language", "English"),
            "session_id": state.get("session_id", "default")
        })
        return {"response": resp}
    except Exception as e:
        print(f"Error in generation: {e}")
        return {"response": "I'm sorry, I'm having trouble generating a response right now."}

from concurrent.futures import ThreadPoolExecutor

def parallel_classify_and_retrieve_node(state: GraphState):
    """Run intent classification and vector retrieval concurrently using multithreading for maximum speed."""
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_classify = executor.submit(classification_node, state)
        future_retrieve = executor.submit(retrieval_node, state)
        
        classify_res = future_classify.result()
        retrieve_res = future_retrieve.result()
        
    res = {}
    if classify_res:
        res.update(classify_res)
    if retrieve_res:
        res.update(retrieve_res)
    return res

def emergency_conditional(state: GraphState):
    """Route based on emergency status."""
    if state.get("is_emergency"):
        return "emergency"
    return "safe"

# Build Graph
workflow = StateGraph(GraphState)

workflow.add_node("triage", triage_node)
workflow.add_node("classify_and_retrieve", parallel_classify_and_retrieve_node)
workflow.add_node("generate", generation_node)

workflow.set_entry_point("triage")
workflow.add_conditional_edges(
    "triage",
    emergency_conditional,
    {"emergency": END, "safe": "classify_and_retrieve"}
)
workflow.add_edge("classify_and_retrieve", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()

