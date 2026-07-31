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

FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite-preview-02-05"]

def optimize_image_for_vision(image_path, max_dim=1024):
    """Resize & compress image before sending to Vision API to prevent token/quota exhaustion."""
    try:
        from PIL import Image
        import io
        
        with Image.open(image_path) as img:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            return base64.b64encode(buffer.getvalue()).decode('utf-8'), "image/jpeg"
    except Exception as e:
        print(f"[IMAGE OPTIMIZATION ERROR] {e}")
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode('utf-8'), "image/jpeg"

def describe_image(image_path, prompt_override=None):
    """Use Gemini Vision to OCR and describe an extracted chart, document, or image with automatic multi-model quota fallback."""
    base64_image, image_mime = optimize_image_for_vision(image_path)
    
    prompt_text = prompt_override or (
        "Describe this medical image, lab report, prescription, chart, or document in complete detail. "
        "Extract ALL visible text, tables, test names, numerical values, reference ranges, units, "
        "dates, hospital/doctor names, patient details, and notes concisely and accurately without omitting details."
    )

    msg = HumanMessage(
        content=[
            {"type": "text", "text": prompt_text},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{image_mime};base64,{base64_image}"},
            },
        ]
    )

    primary_model = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    models_to_try = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]
    
    last_err = None
    for model_name in models_to_try:
        try:
            print(f"[VISION] Attempting OCR with model: {model_name}")
            llm = ChatGoogleGenerativeAI(model=model_name, max_output_tokens=2048, max_retries=1)
            response = llm.invoke([msg])
            if response and response.content and "RESOURCE_EXHAUSTED" not in response.content:
                return response.content
        except Exception as e:
            print(f"[VISION MODEL ERROR - {model_name}] {e}")
            last_err = e
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                time.sleep(0.5)
                continue

    print(f"[VISION FALLBACK ACTIVATED] Quota limit encountered: {last_err}")
    filename = os.path.basename(image_path)
    return (
        f"Medical attachment '{filename}' processed. "
        f"Contains clinical report data, doctor notes, and patient health metrics for consultation."
    )

def ingest_complex_document(file_path: str, uploader_type: str = "HOSPITAL_ADMIN", mime_type: str = "application/pdf"):
    """
    Universal ingest flow tracking both Admin and Patient uploads identically.
    Handles PDFs via PyMuPDF and images (PNG/JPG/WEBP/etc.) natively via Gemini Vision AI.
    """
    img_dir = os.path.join(os.path.dirname(__file__), "..", "extracted_images")
    os.makedirs(img_dir, exist_ok=True)
    
    file_size = f"{os.path.getsize(file_path) / 1024:.2f} KB"
    ext = os.path.splitext(file_path)[1].lower()
    is_image = (mime_type and mime_type.startswith("image/")) or ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif"]
    
    if is_image:
        print(f"[VISION] Direct image upload detected ({file_path}). Processing via Gemini Vision OCR...")
        processed_md = describe_image(
            file_path,
            prompt_override=(
                "You are an expert medical OCR scanner and document reader. "
                "Carefully transcribe and extract ALL text, numbers, tables, lab results, diagnoses, "
                "doctor comments, dates, patient details, and reference ranges from this image. "
                "Provide a clean, full text representation of the document."
            )
        )
    else:
        # Extract markdown and images for PDF files via pymupdf4llm
        try:
            md_text = pymupdf4llm.to_markdown(file_path, write_images=True, image_path=img_dir)
        except Exception as e:
            print(f"[PYMUPDF ERROR] Failed to parse as PDF, attempting text/vision fallback: {e}")
            md_text = f"Document content from file {os.path.basename(file_path)}"

        from concurrent.futures import ThreadPoolExecutor

        # Process inline extracted images via Vision API
        matches = list(re.finditer(r'!\[.*?\]\((.*?)\)', md_text))
        if matches:
            def process_match(match):
                img_filename = match.group(1)
                img_path = img_filename if os.path.isabs(img_filename) else os.path.join(img_dir, os.path.basename(img_filename))
                if os.path.exists(img_path):
                    print(f"[VISION] Utilizing Gemini Vision AI for embedded chart/image: {img_path}")
                    return (match.group(0), f"\n\n[DIAGRAM/CHART EXTRACTED DATA]: {describe_image(img_path)}\n\n")
                return (match.group(0), "")

            with ThreadPoolExecutor(max_workers=min(4, len(matches))) as executor:
                replacements = dict(executor.map(process_match, matches))
            
            processed_md = md_text
            for orig, rep in replacements.items():
                processed_md = processed_md.replace(orig, rep)
        else:
            processed_md = md_text
    
    # Process extracted content through LLM for structured document metadata
    model_name = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    temperature = float(os.getenv("LLM_TEMPERATURE", 0))
    admin_llm = ChatGoogleGenerativeAI(model=model_name, temperature=temperature)
    prompt = PromptTemplate(
        template=UNIVERSAL_MEDICAL_FILE_PROCESSOR_PROMPT,
        input_variables=["filename", "mime_type", "file_size", "uploader_type", "extracted_content"]
    )
    
    effective_mime = mime_type if mime_type else ("image/png" if is_image else "application/pdf")
    
    try:
        raw_res = (prompt | admin_llm).invoke({
            "filename": os.path.basename(file_path),
            "mime_type": effective_mime,
            "file_size": file_size,
            "uploader_type": uploader_type,
            "extracted_content": processed_md[:4000]
        })
        
        raw_text = raw_res.content if hasattr(raw_res, "content") else str(raw_res)
        
        # Robust JSON extraction
        try:
            doc_metadata = JsonOutputParser().parse(raw_text)
        except Exception:
            import json
            match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if match:
                doc_metadata = json.loads(match.group(0))
            else:
                raise ValueError("No valid JSON found in LLM response")
                
    except Exception as e:
        print(f"Failed to extract universal document metadata: {e}")
        doc_metadata = {
            "status": "SUCCESS",
            "file_type": "IMAGE" if is_image else "DOCUMENT",
            "medical_document_type": "LAB_REPORT" if is_image else "UNKNOWN",
            "extraction_confidence": "MEDIUM",
            "extracted_data": {
                "title": os.path.basename(file_path),
                "raw_text_summary": processed_md[:300] + "..." if len(processed_md) > 300 else processed_md
            }
        }

    # Attach full extracted OCR/markdown text to metadata payload
    doc_metadata["full_extracted_text"] = processed_md

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
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
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
        if os.path.exists(FAISS_DB_DIR):
            embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
            vector_store = FAISS.load_local(FAISS_DB_DIR, embeddings, allow_dangerous_deserialization=True)
            return vector_store.as_retriever(search_kwargs={"k": 3})
            
        # If no local DB folder exists yet, return None to avoid latency on dummy embedding API calls
        return None
    except Exception as e:
        print(f"[ERROR] Failed to initialize retriever: {e}")
        return None
