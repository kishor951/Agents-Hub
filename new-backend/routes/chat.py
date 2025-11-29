"""
Chat routes - Chat API endpoints for agent conversations
"""

from fastapi import APIRouter, HTTPException, Query
from services.chat_service import (
    send_message_to_agent,
    create_conversation_session,
    get_conversation_history,
    delete_session
)
from services.conversation_service import storage
from models.schemas import (
    ChatRequest,
    ChatResponse,
    ConversationSession,
    CreateSessionRequest,
    CreateSessionResponse,
    ChatMessage,
    ChatHistoryResponse
)
from typing import Optional

router = APIRouter()


@router.post("/chat/message", response_model=ChatResponse)
def chat_message(request: ChatRequest):
    """
    Send a message to an agent and get response.
    
    Creates a new session if session_id is not provided.
    Uses LangChain with Gemini to generate agent response based on personality.
    """
    try:
        result = send_message_to_agent(
            agent_asset_id=request.agent_asset_id,
            user_message=request.message,
            session_id=request.session_id,
            context=request.context,
            user_address=request.user_address
        )
        return ChatResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.get("/chat/sessions", response_model=list[ConversationSession])
def list_sessions(
    agent_asset_id: Optional[str] = Query(None, description="Filter by agent asset ID"),
    user_address: Optional[str] = Query(None, description="Filter by user address")
):
    """
    List all conversation sessions, optionally filtered.
    """
    try:
        sessions = storage.list_sessions(
            agent_asset_id=agent_asset_id,
            user_address=user_address
        )
        return [ConversationSession(**session) for session in sessions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")


@router.get("/chat/sessions/{session_id}", response_model=ChatHistoryResponse)
def get_session_history(
    session_id: str,
    limit: Optional[int] = Query(10, description="Number of messages to return", ge=1, le=100),
    offset: Optional[int] = Query(0, description="Number of messages to skip", ge=0)
):
    """
    Get conversation history for a session with pagination support.
    
    Returns last N messages (default: 10) with pagination support.
    Messages are returned in chronological order (oldest first).
    """
    try:
        session = storage.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        # Get messages with pagination
        messages = storage.get_messages(session_id, limit=limit, offset=offset)
        
        # Get total message count
        total = storage.get_message_count(session_id)
        
        # Check if there are more messages
        has_more = (offset + len(messages)) < total
        
        return ChatHistoryResponse(
            session=ConversationSession(**session),
            messages=[ChatMessage(**msg) for msg in messages],
            total=total,
            has_more=has_more
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session history: {str(e)}")


@router.post("/chat/sessions", response_model=CreateSessionResponse)
def create_session(request: CreateSessionRequest):
    """
    Create a new conversation session.
    """
    try:
        session_id = create_conversation_session(
            agent_asset_id=request.agent_asset_id,
            user_address=request.user_address
        )
        session = storage.get_session(session_id)
        
        return CreateSessionResponse(
            session_id=session_id,
            created_at=session["created_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.delete("/chat/sessions/{session_id}")
def delete_chat_session(session_id: str):
    """
    Delete a conversation session and all messages.
    """
    try:
        deleted = delete_session(session_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        return {"success": True, "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")

