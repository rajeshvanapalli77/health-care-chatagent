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
    is_greeting: Optional[bool]
    emergency_action: Optional[str]
    hospital_context: Optional[str]
    patient_context: Optional[str]
    response: Optional[str]

retriever = setup_retriever()

def get_llm():
    """Build LLM fresh from environment variables at call time with max_retries=1 to prevent latency hangs."""
    model_name = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    temperature = float(os.getenv("LLM_TEMPERATURE", 0))
    print(f"[LLM] Using model: {model_name} | temperature: {temperature}")
    return ChatGoogleGenerativeAI(model=model_name, temperature=temperature, max_retries=1)

import re

EMERGENCY_PATTERNS = [
    r"chest pain", r"seene mein dard", r"छाती में दर्द", r"గుండె నొప్పు", r"గుండెనెప్పి",
    r"heart attack", r"stroke", r"unconscious", r"behoshi", r"సృహ తప్పి",
    r"heavy bleeding", r"difficulty breathing", r"saans lene mein takleef", r"శ్వాస అందడం లేదు"
]

GREETING_PATTERNS = [
    r"^\s*(hi|hello|hey|good morning|good afternoon|good evening|namaste|vanakkam|namaskaram|hola|greetings)\b",
    r"^\s*(hi there|hello there|hey there|howdy)\b",
    r"^\s*(who are you|what can you do)\b"
]

def triage_node(state: GraphState):
    """Fast-path triage screener to eliminate unnecessary LLM latency for emergencies and greetings."""
    q_lower = state["question"].strip().lower()
    
    # 1. Check for emergency patterns
    for pattern in EMERGENCY_PATTERNS:
        if re.search(pattern, q_lower):
            action = "⚠️ EMERGENCY DETECTED: Critical symptoms identified. Please call 108 or proceed to the nearest emergency room IMMEDIATELY."
            return {
                "is_emergency": True,
                "is_greeting": False,
                "emergency_action": action,
                "urgency": "CRITICAL",
                "response": action
            }

    # 2. Check for simple greetings for instant sub-100ms response
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, q_lower):
            return {
                "is_emergency": False,
                "is_greeting": True,
                "urgency": "LOW",
                "intent": "GREETING",
                "language": "English",
                "response": "Hello! I am your AI Health Assistant. How can I help you today? You can describe your symptoms, ask health questions, or securely upload your medical reports for analysis."
            }

    return {
        "is_emergency": False,
        "is_greeting": False,
        "urgency": "LOW"
    }

SYMPTOM_KEYWORDS = [
    "fever", "bukhar", "bukhār", "jwaram", "jvaram", "headache", "sirdard", "thala noppi",
    "cough", "khansi", "daggu", "cold", "pain", "dard", "noppi", "nausea", "vomiting",
    "rash", "dizziness", "fatigue", "tired", "stomach", "pet", "kaduploni", "sore throat"
]
MED_KEYWORDS = ["medicine", "tablet", "dose", "dosage", "drug", "prescription", "paracetamol", "syrup", "pill"]
APPT_KEYWORDS = ["appointment", "doctor", "visit", "consultation", "schedule", "book"]

def classification_node(state: GraphState):
    """Fast rule-based intent and language classification to eliminate LLM roundtrip latency."""
    q_lower = state["question"].lower()
    
    intent = "GENERAL_HEALTH_INFO"
    if any(kw in q_lower for kw in SYMPTOM_KEYWORDS):
        intent = "SYMPTOM_REPORT"
    elif any(kw in q_lower for kw in MED_KEYWORDS):
        intent = "MEDICATION_QUERY"
    elif any(kw in q_lower for kw in APPT_KEYWORDS):
        intent = "APPOINTMENT_REQUEST"

    # Detect language basic heuristic (Hindi / Telugu / English)
    language = "English"
    if re.search(r"[\u0C00-\u0C7F]", state["question"]) or any(w in q_lower for w in ["naaku", "undhi", "undi", "jwaram", "noppi"]):
        language = "Telugu"
    elif re.search(r"[\u0900-\u097F]", state["question"]) or any(w in q_lower for w in ["mujhe", "hai", "bukhar", "dard", "meri"]):
        language = "Hindi"

    return {
        "intent": intent,
        "language": language
    }

def retrieval_node(state: GraphState):
    """Retrieve relevant documents from FAISS."""
    global retriever
    if retriever is None:
        retriever = setup_retriever()

    if retriever is None:
        return {"hospital_context": "No hospital institutional documents uploaded yet."}

    try:
        docs = retriever.invoke(state["question"])
        if not docs:
            return {"hospital_context": "No hospital institutional documents uploaded yet."}
        context = "\n\n".join([doc.page_content for doc in docs])
        return {"hospital_context": context}
    except Exception as e:
        print(f"Error in retrieval: {e}")
        return {"hospital_context": "Knowledge base unreachable."}

FALLBACK_MODELS = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-flash-lite-latest", "gemini-2.0-flash-lite"]

def generation_node(state: GraphState):
    """Generate final response based on dual context with model fallback and instant fast-path."""
    prompt = PromptTemplate(
        template=MULTILINGUAL_HEALTHCARE_ASSISTANT_PROMPT,
        input_variables=["hospital_context", "patient_context", "chat_history", "query", "language", "session_id"]
    )
    
    p_context = get_patient_files_context(state.get("session_id", "default"))
    input_vars = {
        "hospital_context": state.get("hospital_context", "No specific institutional context available."),
        "patient_context": p_context,
        "chat_history": state.get("chat_history", "No prior history."),
        "query": state["question"],
        "language": state.get("language", "English"),
        "session_id": state.get("session_id", "default")
    }

    primary_model = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    models_to_try = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]
    temperature = float(os.getenv("LLM_TEMPERATURE", 0))

    for model_name in models_to_try:
        try:
            llm = ChatGoogleGenerativeAI(model=model_name, temperature=temperature, max_retries=1)
            chain = prompt | llm | StrOutputParser()
            resp = chain.invoke(input_vars)
            if resp and "RESOURCE_EXHAUSTED" not in resp:
                return {"response": resp}
        except Exception as e:
            print(f"[LLM MODEL FALLBACK - {model_name}] {e}")
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                continue
            break

    try:
        # Final attempt with get_llm
        chain = prompt | get_llm() | StrOutputParser()
        resp = chain.invoke(input_vars)
        return {"response": resp}
    except Exception as e:
        print(f"[LLM Fast-Path Fallback Activated] {e}")
        q_lower = state["question"].lower()

        if any(w in q_lower for w in ["fever", "bukhar", "bukhār", "jwaram", "temperature", "chills"]):
            fallback_msg = (
                "I understand you are experiencing a fever. Here is essential medical guidance:\n\n"
                "**1. Rest & Hydration:** Drink plenty of fluids (water, ORS, clear broths) and get adequate rest.\n"
                "**2. Temperature Monitoring:** Measure your body temperature periodically with a thermometer.\n"
                "**3. Fever Management:** Over-the-counter fever reducers like Paracetamol (Acetaminophen) can help manage fever. Verify proper dosage.\n"
                "**4. When to Seek Urgent Care:** Consult a doctor immediately if fever exceeds 103°F (39.4°C), lasts over 3 days, or is accompanied by difficulty breathing, severe headache, or confusion.\n\n"
                "Please consult your doctor for a proper clinical evaluation."
            )
        elif any(w in q_lower for w in ["headache", "sirdard", "thala noppi", "migraine"]):
            fallback_msg = (
                "For headache relief and management:\n\n"
                "**1. Immediate Steps:** Rest in a quiet, dark room, stay well-hydrated, and limit screen time.\n"
                "**2. Cold Compress:** Apply a cool compress to your forehead or neck.\n"
                "**3. Medication:** Over-the-counter pain relievers like Paracetamol may help.\n"
                "**4. Warning Signs:** Seek emergency care if the headache is sudden and severe ('thunderclap') or accompanied by vision loss, weakness, or neck stiffness.\n\n"
                "Please consult a physician for persistent headaches."
            )
        elif any(w in q_lower for w in ["cough", "cold", "khansi", "daggu", "sore throat", "flu"]):
            fallback_msg = (
                "For cough and cold symptom relief:\n\n"
                "**1. Hydration & Steam:** Drink warm fluids (herbal teas, warm water) and consider steam inhalation.\n"
                "**2. Throat Care:** Gargle with warm salt water 2-3 times daily.\n"
                "**3. Rest:** Allow your body adequate rest to fight off viral illness.\n"
                "**4. Medical Note:** Consult a doctor if cough lasts over 2 weeks, produces blood, or causes shortness of breath.\n\n"
                "Please consult your healthcare provider for clinical advice."
            )
        elif any(w in q_lower for w in ["paracetamol", "dosage", "medicine", "tablet", "pill", "dose", "drug"]):
            fallback_msg = (
                "Here is clinical information regarding Paracetamol (Acetaminophen):\n\n"
                "**1. Indication:** Used for mild-to-moderate pain relief and fever reduction.\n"
                "**2. Typical Adult Dose:** 500mg to 1000mg every 4 to 6 hours as needed (Maximum 4000mg per 24 hours).\n"
                "**3. Precautions:** Avoid alcohol consumption. Do not take multiple products containing Acetaminophen simultaneously.\n"
                "**4. Guidance:** Always check with a pharmacist or physician before starting medications.\n\n"
                "Never exceed recommended dosages without medical supervision."
            )
        elif any(w in q_lower for w in ["cbc", "blood test", "report", "lab", "platelet", "wbc", "hemoglobin"]):
            fallback_msg = (
                "Regarding Complete Blood Count (CBC) and lab report interpretation:\n\n"
                "**1. Main Metrics:**\n"
                "   - **Hemoglobin / RBC:** Measures oxygen delivery (Low = Anemia).\n"
                "   - **WBC:** Infection response (High = Infection or inflammation).\n"
                "   - **Platelets:** Essential for blood clotting.\n"
                "**2. Analysis:** Abnormal flags (HIGH/LOW) should always be evaluated alongside physical symptoms.\n"
                "**3. Upload:** You can securely upload your report file using the attachment icon 📎 for detailed processing.\n\n"
                "Please share your lab reports with your doctor for clinical correlation."
            )
        elif any(w in q_lower for w in ["stomach", "pet", "kaduploni", "nausea", "vomiting", "acidity"]):
            fallback_msg = (
                "For stomach discomfort or digestive issues:\n\n"
                "**1. Dietary Advice:** Eat light, bland foods (toast, rice, bananas) and avoid spicy, fatty, or caffeinated items.\n"
                "**2. Hydration:** Take small, frequent sips of water or ORS to prevent dehydration.\n"
                "**3. Red Flags:** Seek immediate medical evaluation if experiencing severe sharp abdominal pain, persistent vomiting, or blood in stool.\n\n"
                "Consult a doctor if symptoms persist beyond 24 hours."
            )
        else:
            fallback_msg = (
                "I am here to assist with your medical and health inquiries.\n\n"
                "**General Guidance:**\n"
                "1. **Monitor Symptoms:** Keep track of when symptoms started and any changes.\n"
                "2. **Hydration & Rest:** Ensure adequate fluid intake and sufficient rest.\n"
                "3. **Clinical Evaluation:** For active health concerns, consult a doctor or healthcare professional for diagnosis and treatment.\n\n"
                "Please consult your doctor for personalized medical evaluation."
            )
        return {"response": fallback_msg}

from concurrent.futures import ThreadPoolExecutor

def parallel_classify_and_retrieve_node(state: GraphState):
    """Run intent classification and vector retrieval concurrently for maximum speed."""
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
    """Route based on emergency or greeting status."""
    if state.get("is_emergency"):
        return "emergency"
    if state.get("is_greeting"):
        return "greeting"
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
    {"emergency": END, "greeting": END, "safe": "classify_and_retrieve"}
)
workflow.add_edge("classify_and_retrieve", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()

