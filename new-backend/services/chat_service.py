"""
Chat Service - Core LLM interaction logic using LangChain

Handles sending messages to agents and managing conversations.
"""

# Apply langchain compatibility patches before any imports
import services.langchain_patch  # noqa: F401

from typing import Optional, Dict
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from services.agent_context_service import (
    get_agent_context,
    create_langchain_agent,
    format_conversation_history
)
from services.conversation_service import storage
import time


def send_message_to_agent(
    agent_asset_id: str,
    user_message: str,
    session_id: Optional[str] = None,
    context: Optional[Dict] = None,
    user_address: Optional[str] = None
) -> Dict:
    """
    Send a message to an agent and get response using LangChain.
    
    Args:
        agent_asset_id (str): Cardano asset ID of the agent
        user_message (str): User's message
        session_id (str, optional): Existing session ID (creates new if not provided)
        context (dict, optional): Additional context (max_history, temperature, etc.)
        user_address (str, optional): User's Cardano address
    
    Returns:
        dict: {
            "session_id": "string",
            "message_id": "string",
            "response": "string",
            "agent_asset_id": "string",
            "agent_name": "string",
            "timestamp": "string",
            "metadata": {
                "model_used": "string",
                "response_time": "float"
            }
        }
    
    Raises:
        ValueError: If agent not found or invalid input
        Exception: If LangChain execution fails
    """
    start_time = time.time()
    
    # Validate input
    if not agent_asset_id:
        raise ValueError("agent_asset_id is required")
    if not user_message or not user_message.strip():
        raise ValueError("user_message cannot be empty")
    
    # Get or create session
    if session_id:
        session = storage.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
    else:
        session_id = storage.create_session(agent_asset_id, user_address)
    
    # Get agent context (uses personality cache)
    try:
        agent_context = get_agent_context(agent_asset_id)
    except Exception as e:
        raise ValueError(f"Failed to load agent: {str(e)}")
    
    # Get conversation history
    history_messages = storage.get_messages(session_id)
    max_history = context.get("max_history", 10) if context else 10
    conversation_history = format_conversation_history(history_messages, max_history)
    
    # Store user message
    storage.add_message(session_id, "user", user_message, metadata={"user_address": user_address})
    
    # Create LangChain agent configuration
    try:
        agent_config = create_langchain_agent(
            agent_context,
            llm=None,  # Will use default Gemini LLM
            conversation_history=conversation_history
        )
    except Exception as e:
        raise Exception(f"Failed to create LangChain agent: {str(e)}")
    
    # Build messages for LangChain
    messages = [
        SystemMessage(content=agent_config["system_prompt"]),
        HumanMessage(content=user_message)
    ]
    
    # Get LLM and invoke
    try:
        llm = agent_config["llm"]
        response = llm.invoke(messages)
        
        # Extract response text
        if hasattr(response, 'content'):
            agent_response = response.content
        elif isinstance(response, str):
            agent_response = response
        else:
            agent_response = str(response)
        
        agent_response = agent_response.strip()
        
    except Exception as e:
        raise Exception(f"LangChain execution failed: {str(e)}")
    
    # Store agent response
    response_time = time.time() - start_time
    storage.add_message(
        session_id,
        "agent",
        agent_response,
        agent_asset_id=agent_asset_id,
        metadata={
            "model_used": "gemini-2.0-flash",
            "response_time": response_time
        }
    )
    
    # Build response
    return {
        "session_id": session_id,
        "message_id": storage.get_messages(session_id)[-1]["message_id"],
        "response": agent_response,
        "agent_asset_id": agent_asset_id,
        "agent_name": agent_config["agent_name"],
        "timestamp": storage.get_messages(session_id)[-1]["timestamp"],
        "metadata": {
            "model_used": "gemini-2.0-flash",
            "response_time": round(response_time, 2)
        }
    }


def create_conversation_session(
    agent_asset_id: str,
    user_address: Optional[str] = None
) -> str:
    """
    Create a new conversation session.
    
    Args:
        agent_asset_id (str): Cardano asset ID of the agent
        user_address (str, optional): User's Cardano address
    
    Returns:
        str: Session ID
    """
    return storage.create_session(agent_asset_id, user_address)


def get_conversation_history(session_id: str, limit: int = 50) -> list:
    """
    Retrieve conversation history for a session.
    
    Args:
        session_id (str): Session ID
        limit (int): Maximum number of messages to return
    
    Returns:
        list: List of message dictionaries
    """
    return storage.get_messages(session_id, limit=limit)


def delete_session(session_id: str) -> bool:
    """
    Delete a conversation session and all messages.
    
    Args:
        session_id (str): Session ID
    
    Returns:
        bool: True if deleted, False if not found
    """
    return storage.delete_session(session_id)


if __name__ == "__main__":
    # Test the chat service (requires a valid agent asset_id)
    print("Testing Chat Service...")
    print("\n⚠️  This test requires:")
    print("   1. A valid agent asset_id")
    print("   2. All environment variables configured")
    print("\nTo test with a real agent, provide an asset_id as argument")
    print("Example: python chat_service.py <asset_id>")
    
    import sys
    if len(sys.argv) > 1:
        asset_id = sys.argv[1]
        try:
            print(f"\nCreating session for agent: {asset_id}")
            session_id = create_conversation_session(asset_id)
            print(f"✅ Created session: {session_id}")
            
            print(f"\nSending test message...")
            response = send_message_to_agent(
                agent_asset_id=asset_id,
                user_message="Hello! Can you introduce yourself?",
                session_id=session_id
            )
            print(f"✅ Received response:")
            print(f"   Agent: {response['agent_name']}")
            print(f"   Response: {response['response']}")
            print(f"   Response time: {response['metadata']['response_time']}s")
            
            print(f"\nGetting conversation history...")
            history = get_conversation_history(session_id)
            print(f"✅ Retrieved {len(history)} messages")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("\n✅ Chat service module loaded successfully")
        print("   (Run with asset_id to test full functionality)")

