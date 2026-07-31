import os
import re
import base64
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import pymupdf4llm
from prompts.system_prompts import UNIVERSAL_MEDICAL_FILE_PROCESSOR_PROMPT
import time
import uuid

FAISS_DB_DIR = os.path.join(os.path.dirname(__file__), "..", "faiss_index_google")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def describe_image(image_path):
    """Use Gemini Vision to describe an extracted chart or image."""
    try:
        model_name = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
        llm = ChatGoogleGenerativeAI(model=model_name, max_output_tokens=300)
        base64_image = encode_image(image_path)
        msg = HumanMessage(
            content=[
                {"type": "text", "text": "Describe this image, chart, or diagram in detail. If it's a pie chart, graph, or table, extract all visible data values, labels, and trends. Respond concisely without conversational padding."},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                },
            ]
        )
        response = llm.invoke([msg])
        return response.content
    except Exception as e:
        print(f"Vision API error on {image_path}: {e}")
        return "Image could not be resolved."

def ingest_complex_document(file_path: str, uploader_type: str = "HOSPITAL_ADMIN", mime_type: str = "application/pdf"):
    """
    Universal ingest flow tracking both Admin and Patient uploads identically.
    """
    img_dir = os.path.join(os.path.dirname(__file__), "..", "extracted_images")
    os.makedirs(img_dir, exist_ok=True)
    
    file_size = f"{os.path.getsize(file_path) / 1024:.2f} KB"
    
    # 1. Extract markdown and images (saving them to disk temporarily)
    md_text = pymupdf4llm.to_markdown(file_path, write_images=True, image_path=img_dir)
    
    from concurrent.futures import ThreadPoolExecutor

    # 2. Process all image tags concurrently via Vision API
    matches = list(re.finditer(r'!\[.*?\]\((.*?)\)', md_text))
    if matches:
        def process_match(match):
            img_filename = match.group(1)
            img_path = img_filename if os.path.isabs(img_filename) else os.path.join(img_dir, os.path.basename(img_filename))
            if os.path.exists(img_path):
                print(f"👀 Utilizing Gemini Vision AI for chart/image: {img_path}")
                return (match.group(0), f"\n\n[DIAGRAM/CHART EXTRACTED DATA]: {describe_image(img_path)}\n\n")
            return (match.group(0), "")

        with ThreadPoolExecutor(max_workers=min(4, len(matches))) as executor:
            replacements = dict(executor.map(process_match, matches))
        
        processed_md = md_text
        for orig, rep in replacements.items():
            processed_md = processed_md.replace(orig, rep)
    else:
        processed_md = md_text
    
    # Take chunk of text to prevent massive parsing overload
    model_name = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    temperature = float(os.getenv("LLM_TEMPERATURE", 0))
    admin_llm = ChatGoogleGenerativeAI(model=model_name, temperature=temperature)
    prompt = PromptTemplate(
        template=UNIVERSAL_MEDICAL_FILE_PROCESSOR_PROMPT,
        input_variables=["filename", "mime_type", "file_size", "uploader_type", "extracted_content"]
    )
    chain = prompt | admin_llm | JsonOutputParser()
    
    try:
        doc_metadata = chain.invoke({
            "filename": os.path.basename(file_path),
            "mime_type": mime_type,
            "file_size": file_size,
            "uploader_type": uploader_type,
            "extracted_content": processed_md[:4000]
        })
    except Exception as e:
        print(f"Failed to extract universal document metadata: {e}")
        return {"status": "REJECTED", "rejection_reason": "Failed to parse document structure via LLM"}
        
    if doc_metadata.get("status") == "REJECTED":
        return doc_metadata
    
    if "timestamp" in doc_metadata.get("file_id", "") or not doc_metadata.get("file_id"):
        prefix = "HOSP" if uploader_type == "HOSPITAL_ADMIN" else "PAT-SESSION"
        doc_metadata["file_id"] = f"{prefix}-{str(uuid.uuid4())[:8]}"
    
    # Route logic natively
    if uploader_type == "HOSPITAL_ADMIN" and doc_metadata.get("ready_for_rag"):
        splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=200)
        chunks = splitter.split_text(processed_md)
        
        metadata_payload = {
            "source": os.path.basename(file_path),
            "document_type": doc_metadata.get("medical_document_type", "UNKNOWN"),
            "title": doc_metadata.get("extracted_data", {}).get("title", "Untitled Document"),
            "file_id": doc_metadata.get("file_id")
        }
        
        docs = [Document(page_content=c, metadata=metadata_payload) for c in chunks]
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        if os.path.exists(FAISS_DB_DIR):
            vector_store = FAISS.load_local(FAISS_DB_DIR, embeddings, allow_dangerous_deserialization=True)
            vector_store.add_documents(docs)
        else:
            vector_store = FAISS.from_documents(docs, embeddings)
            
        vector_store.save_local(FAISS_DB_DIR)
        doc_metadata["chunks_created"] = len(docs)

    return doc_metadata

def setup_retriever():
    """Load or initialize FAISS vector store and return a retriever."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("[WARNING] No Google API Key found. RAG functionality will be disabled until key is provided.")
        return None

    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        
        if os.path.exists(FAISS_DB_DIR):
            vector_store = FAISS.load_local(FAISS_DB_DIR, embeddings, allow_dangerous_deserialization=True)
            return vector_store.as_retriever(search_kwargs={"k": 3})
            
        # If no DB, initialize a dummy one
        docs = [Document(page_content="No specific user health documents uploaded. Answer general medical questions based on common knowledge but always recommend consulting a doctor.", metadata={"source": "system"})]
        vector_store = FAISS.from_documents(docs, embeddings)
        return vector_store.as_retriever(search_kwargs={"k": 1})
    except Exception as e:
        print(f"[ERROR] Failed to initialize retriever: {e}")
        return None
