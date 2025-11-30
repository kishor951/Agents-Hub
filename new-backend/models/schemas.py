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


# Breeding API Models
class BreedAgentsRequest(BaseModel):
    """Request model for POST /api/breed"""
    parent_a_asset_id: str
    parent_b_asset_id: str
    child_name: str  # User-entered child name
    trait_balance: int = 50  # 0-100, percentage from parent A (kept in schema but NOT used in LLM calls)
    custom_instructions: Optional[str] = None  # Custom breeding instructions from UI
    predicted_skills: Optional[List[str]] = []  # Predicted child skills from compatibility calculation


class BreedAgentsResponse(BaseModel):
    """Response model for POST /api/breed"""
    ipfs_hash: str  # IPFS CID of child genetic data
    child_text: str  # Child personality (for backward compatibility)
    masumi_did: str
    parent_a_personality: str
    parent_b_personality: str
    # Additional fields for complete child data
    child_purpose: str
    child_instructions: str
    child_skills: List[str]
    child_llm_model: str


# Compatibility Calculation API Models
class AgentDetails(BaseModel):
    """Agent details for compatibility calculation"""
    name: Optional[str] = None
    purpose: Optional[str] = None
    instructions: Optional[str] = None
    personality: Optional[str] = None
    skills: Optional[List[str]] = []


class CalculateCompatibilityRequest(BaseModel):
    """Request model for POST /api/calculate-compatibility"""
    # Option 1: Provide asset IDs (will fetch from blockchain)
    parent_a_asset_id: Optional[str] = None
    parent_b_asset_id: Optional[str] = None
    
    # Option 2: Provide full agent details directly
    parent_a: Optional[AgentDetails] = None
    parent_b: Optional[AgentDetails] = None


class CalculateCompatibilityResponse(BaseModel):
    """Response model for POST /api/calculate-compatibility"""
    score: int  # Compatibility percentage (0-100)
    analysis: str  # Genetic analysis text (detailed explanation)
    predicted_skills: List[str]  # Predicted child skills (based on parent skills)
    predicted_name: Optional[str] = None  # AI-generated name for the child agent

