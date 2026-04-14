import os
import re
import base64
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pymupdf4llm

FAISS_DB_DIR = os.path.join(os.path.dirname(__file__), "..", "faiss_index_google")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def describe_image(image_path):
    """Use Gemini 1.5 Flash Vision to describe an extracted chart or image."""
    try:
        # Gemini 1.5 Flash supports both text and vision natively
        llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", max_output_tokens=300)
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

def ingest_complex_document(file_path: str):
    """
    Ingest a PDF using pymupdf4llm (Markdown + Tables preserved).
    Extracts images, runs Vision API on them, and saves to FAISS.
    """
    # Create dir for images
    img_dir = os.path.join(os.path.dirname(__file__), "..", "extracted_images")
    os.makedirs(img_dir, exist_ok=True)
    
    # 1. Extract markdown and images (saving them to disk temporarily)
    md_text = pymupdf4llm.to_markdown(file_path, write_images=True, image_path=img_dir)
    
    # 2. Process all image tags logically via Vision API
    def replace_image_with_vision(match):
        img_filename = match.group(1)
        
        # Absolute resolution
        img_path = img_filename if os.path.isabs(img_filename) else os.path.join(img_dir, os.path.basename(img_filename))
            
        if os.path.exists(img_path):
            print(f"👀 Utilizing Gemini Vision AI for chart/image: {img_path}")
            description = describe_image(img_path)
            return f"\n\n[DIAGRAM/CHART EXTRACTED DATA]: {description}\n\n"
        return ""

    # Matches ![alt](img_path)
    processed_md = re.sub(r'!\[.*?\]\((.*?)\)', replace_image_with_vision, md_text)
    
    # 3. Chunk using splitters mindful of markdown/tables
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200, 
        chunk_overlap=200,
        separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""]
    )
    chunks = splitter.split_text(processed_md)
    docs = [Document(page_content=chunk, metadata={"source": os.path.basename(file_path)}) for chunk in chunks]
    
    # 4. Save to FAISS persistently
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    if os.path.exists(FAISS_DB_DIR):
        vector_store = FAISS.load_local(FAISS_DB_DIR, embeddings, allow_dangerous_deserialization=True)
        vector_store.add_documents(docs)
    else:
        vector_store = FAISS.from_documents(docs, embeddings)
        
    vector_store.save_local(FAISS_DB_DIR)
    return len(docs)

def setup_retriever():
    """Load or initialize FAISS vector store and return a retriever."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("⚠️ Warning: No Google API Key found. RAG functionality will be disabled until key is provided.")
        return None

    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
        
        if os.path.exists(FAISS_DB_DIR):
            vector_store = FAISS.load_local(FAISS_DB_DIR, embeddings, allow_dangerous_deserialization=True)
            return vector_store.as_retriever(search_kwargs={"k": 3})
            
        # If no DB, initialize a dummy one
        docs = [Document(page_content="No specific user health documents uploaded. Answer general medical questions based on common knowledge but always recommend consulting a doctor.", metadata={"source": "system"})]
        vector_store = FAISS.from_documents(docs, embeddings)
        return vector_store.as_retriever(search_kwargs={"k": 1})
    except Exception as e:
        print(f"⚠️ Failed to initialize retriever: {e}")
        return None
