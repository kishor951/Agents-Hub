"""
Agents Hub Python Backend
FastAPI application for agent creation and management
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import agent, chat, breed
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Agents Hub API",
    version="1.0.0",
    description="Python backend for Agents Hub - Agent creation and management"
)

# CORS middleware - allow frontend on port 3000 (or Vite default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(breed.router, prefix="/api")  # Register the breeding router

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Agents Hub API is running",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Agents Hub API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

