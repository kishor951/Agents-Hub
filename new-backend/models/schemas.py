"""
Pydantic models for request/response schemas
"""

from pydantic import BaseModel
from typing import Optional, Dict, List


class CreateAgentResponse(BaseModel):
    """
    Response model for POST /api/agents/create
    Returns genetic hash and IPFS CID for genetic data retrieval
    """
    genetic_hash: str  # For verification/identification
    masumi_did: str  # Always generated (local UUID, no API key needed)
    image_ipfs_cid: Optional[str] = None  # Optional - if image uploaded
    genetic_data_ipfs_cid: Optional[str] = None  # IPFS CID for retrieving full genetic data (name, purpose, instructions, personality, skills, llmModel)
    
    class Config:
        json_schema_extra = {
            "example": {
                "genetic_hash": "abc123def456",
                "masumi_did": "did:masumi:testnet:agent-uuid",
                "image_ipfs_cid": "QmImageHash123...",
                "genetic_data_ipfs_cid": "QmGeneticDataHash123..."
            }
        }


# Chat API Models
class ChatRequest(BaseModel):
    """Request model for POST /api/chat/message"""
    agent_asset_id: str
    message: str
    session_id: Optional[str] = None
    context: Optional[Dict] = None
    user_address: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for POST /api/chat/message"""
    session_id: str
    message_id: str
    response: str
    agent_asset_id: str
    agent_name: str
    timestamp: str
    metadata: Dict


class ConversationSession(BaseModel):
    """Model for conversation session"""
    session_id: str
    agent_asset_id: str
    user_address: Optional[str]
    created_at: str
    updated_at: str
    message_count: int


class CreateSessionRequest(BaseModel):
    """Request model for POST /api/chat/sessions"""
    agent_asset_id: str
    user_address: Optional[str] = None


class CreateSessionResponse(BaseModel):
    """Response model for POST /api/chat/sessions"""
    session_id: str
    created_at: str


class ChatMessage(BaseModel):
    """Model for chat message"""
    message_id: str
    session_id: str
    role: str  # "user" or "agent"
    content: str
    timestamp: str
    agent_asset_id: Optional[str] = None
    metadata: Optional[Dict] = None


class ChatHistoryResponse(BaseModel):
    """Response model for GET /api/chat/sessions/{session_id}"""
    session: ConversationSession
    messages: List[ChatMessage]
    total: int  # Total number of messages in session
    has_more: bool  # Whether there are more messages to load

