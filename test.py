import os
from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import Dict, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not PINECONE_API_KEY or not OPENAI_API_KEY:
    raise ValueError("❌ API keys not found in .env file")

# Configuration
INDEX_NAME = "network-dsa"
NAMESPACES = ["computer-networking-pdf", "networking-pdf"]

# Initialize components
embeddings = OpenAIEmbeddings(
    openai_api_key=OPENAI_API_KEY,
    model="text-embedding-3-small",
    dimensions=1024
)

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# Enable streaming in LLM
llm = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,
    model="gpt-4o-mini",
    temperature=0.7,
    streaming=True
)

# Multi-namespace retriever
class MultiNamespaceRetriever:
    def __init__(self, vectorstores: Dict[str, PineconeVectorStore]):
        self.vectorstores = vectorstores
        
    def get_relevant_documents(self, query: str, k: int = 3) -> List:
        all_docs = []
        for namespace, vectorstore in self.vectorstores.items():
            try:
                docs = vectorstore.similarity_search(query, k=k)
                for doc in docs:
                    doc.metadata['source_namespace'] = namespace
                all_docs.extend(docs)
            except:
                pass
        return all_docs

# Create vectorstores
logger.info("Initializing vectorstores...")
vectorstores = {
    ns: PineconeVectorStore(index=index, embedding=embeddings, namespace=ns)
    for ns in NAMESPACES
}
retriever = MultiNamespaceRetriever(vectorstores)
logger.info(f"✅ Initialized {len(vectorstores)} vectorstores: {list(vectorstores.keys())}")

# Prompt template
prompt = ChatPromptTemplate.from_template("""You are an intelligent assistant specialized in Networking and Data Structures & Algorithms (DSA).

Context from knowledge base:
{context}

User Question: {question}

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE STRICTLY:

1. ALWAYS use ONLY the information provided in the Context above
2. If the Context is empty or says "No relevant information found", respond with:
   "I don't have information about this topic in my knowledge base. Please ask questions related to DSA or Computer Networks."

3. NEVER use symbols like hash, dollar, percent, asterisk, or any special formatting symbols in your response

4. Response Format Rules:
   - Write in plain natural language
   - Use simple sentences and short paragraphs
   - For lists, use simple numbered points like: 1. First point 2. Second point
   - For emphasis, just write clearly without any special symbols
   - NO markdown formatting, NO special characters

5. For DSA Questions:
   - Explain the logic first in very simple terms
   - Then show code if needed (keep it clean and simple)
   - Focus on understanding, not just the solution
   - Keep it short and clear

6. For Computer Networks Questions:
   - Explain in easy, structured way
   - Use simple real-world examples
   - Avoid technical jargon unless necessary
   - Keep it practical and understandable

7. STRICT RULE: Only answer if the information is in the Context section above. Do not add anything from your general knowledge.

Provide your answer now:""")

# Format documents
def format_docs(docs: List) -> str:
    if not docs:
        return "No relevant information found."
    return "\n\n---\n\n".join([
        f"[Source: {doc.metadata.get('source_namespace', 'unknown')}]\n{doc.page_content}"
        for doc in docs
    ])

# RAG chain with streaming
rag_chain = (
    {
        "context": lambda x: format_docs(retriever.get_relevant_documents(x["question"])), 
        "question": lambda x: x["question"]
    }
    | prompt
    | llm
    | StrOutputParser()
)

# Initialize FastAPI
app = FastAPI(
    title="RAG Chatbot API",
    description="Streaming RAG API for Networking and DSA questions - Next.js Ready",
    version="1.0.0"
)

# Configure CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default dev server
        "http://localhost:3001",
        "https://*.vercel.app",   # Vercel deployments
        "*"                       # Allow all (remove in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class QuestionRequest(BaseModel):
    question: str

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is binary search?"
            }
        }

# Streaming generator
async def generate_answer(question: str):
    """Generate streaming answer"""
    if not question or not question.strip():
        yield "Please provide a valid question."
        return
    
    try:
        logger.info(f"Processing question: {question}")
        for chunk in rag_chain.stream({"question": question}):
            yield chunk
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        yield f"Error: {str(e)}"

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "RAG Chatbot API - Next.js Ready",
        "version": "1.0.0",
        "namespaces": NAMESPACES,
        "endpoints": {
            "POST /ask": "Ask a question and get streaming response",
            "GET /health": "Health check endpoint"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "namespaces": list(vectorstores.keys()),
        "index": INDEX_NAME
    }

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Ask a question and receive a streaming response
    
    - **question**: Your question about DSA or Networking
    
    Returns: Streaming text response
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    return StreamingResponse(
        generate_answer(request.question),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

# Run the server
if __name__ == "__main__":
    logger.info("\n" + "="*60)
    logger.info("🚀 Starting RAG Chatbot API for Next.js")
    logger.info("="*60)
    logger.info(f"Index: {INDEX_NAME}")
    logger.info(f"Namespaces: {', '.join(NAMESPACES)}")
    logger.info("="*60 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )