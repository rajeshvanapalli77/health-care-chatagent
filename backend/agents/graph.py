import json
from typing import TypedDict, Annotated, Sequence, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
import os

from prompts.system_prompts import (
    INTENT_CLASSIFICATION_PROMPT,
    EMERGENCY_TRIAGE_PROMPT,
    RAG_RESPONSE_PROMPT
)
from rag.pipeline import setup_retriever

class GraphState(TypedDict):
    question: str
    chat_history: Optional[str]
    intent: Optional[str]
    language: Optional[str]
    urgency: Optional[str]
    is_emergency: Optional[bool]
    emergency_action: Optional[str]
    context: Optional[str]
    response: Optional[str]

# Setup LLM & Retriever
# Using Gemini 1.5 Flash for speed and efficiency
llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", temperature=0)
retriever = setup_retriever()

def triage_node(state: GraphState):
    """Analyze query for medical emergencies."""
    prompt = PromptTemplate(
        template=EMERGENCY_TRIAGE_PROMPT,
        input_variables=["query"]
    )
    chain = prompt | llm | JsonOutputParser()
    try:
        result = chain.invoke({"query": state["question"]})
        is_emergency = result.get("status") == "EMERGENCY_DETECTED"
        action = result.get("immediate_action", "⚠️ EMERGENCY: Please call 108 NOW")
        
        response = f"⚠️ {action}" if is_emergency else state.get("response")
        
        return {
            "is_emergency": is_emergency,
            "emergency_action": action,
            "urgency": result.get("urgency", "LOW"),
            "response": response
        }
    except Exception as e:
        print(f"Error in triage: {e}")
        return {"is_emergency": False}

def classification_node(state: GraphState):
    """Classify user intent and detect language."""
    prompt = PromptTemplate(
        template=INTENT_CLASSIFICATION_PROMPT,
        input_variables=["query"]
    )
    chain = prompt | llm | JsonOutputParser()
    try:
        result = chain.invoke({"query": state["question"]})
        return {
            "intent": result.get("intent", "GENERAL_HEALTH_INFO"),
            "language": result.get("language", "English")
        }
    except Exception as e:
        print(f"Error in classification: {e}")
        return {
            "intent": "GENERAL_HEALTH_INFO",
            "language": "English"
        }

def retrieval_node(state: GraphState):
    """Retrieve relevant documents."""
    global retriever
    # Try to re-initialize if it was None (lazy check)
    if retriever is None:
        retriever = setup_retriever()
        
    if retriever is None:
        return {"context": "Retriever not initialized. Please configure API Keys."}

    try:
        docs = retriever.invoke(state["question"])
        if not docs:
            return {"context": "No documents uploaded. Please provide general helpful medical advice based on common knowledge."}
        context = "\n\n".join([doc.page_content for doc in docs])
        return {"context": context}
    except Exception as e:
        print(f"Error in retrieval: {e}")
        return {"context": "Knowledge base unreachable. Provide general medical guidance."}

def generation_node(state: GraphState):
    """Generate final response based on context and language."""
    prompt = PromptTemplate(
        template=RAG_RESPONSE_PROMPT,
        input_variables=["context", "chat_history", "question", "language", "intent"]
    )
    chain = prompt | llm | StrOutputParser()
    try:
        resp = chain.invoke({
            "context": state.get("context", "No specific context available."),
            "chat_history": state.get("chat_history", "No prior history."),
            "question": state["question"],
            "language": state.get("language", "English"),
            "intent": state.get("intent", "GENERAL_HEALTH_INFO")
        })
        return {"response": resp}
    except Exception as e:
        print(f"Error in generation: {e}")
        return {"response": "I'm sorry, I'm having trouble generating a response right now."}

def emergency_conditional(state: GraphState):
    """Route based on emergency status."""
    if state.get("is_emergency"):
        return "emergency"
    return "safe"

# Build Graph
workflow = StateGraph(GraphState)

workflow.add_node("triage", triage_node)
workflow.add_node("classify", classification_node)
workflow.add_node("retrieve", retrieval_node)
workflow.add_node("generate", generation_node)

workflow.set_entry_point("triage")
workflow.add_conditional_edges(
    "triage",
    emergency_conditional,
    {"emergency": END, "safe": "classify"}
)
workflow.add_edge("classify", "retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()
