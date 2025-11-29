"""
Conversation Service - In-Memory Storage for Chat Sessions

Manages conversation sessions and messages using in-memory storage.
Data is lost on server restart (acceptable for MVP).
"""

from typing import Dict, List, Optional
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
MAX_SESSIONS = int(os.getenv("MAX_SESSIONS", "1000"))


class InMemoryConversationStorage:
    """
    In-memory storage for conversation sessions and messages.
    
    Uses Python dictionaries for fast O(1) lookups.
    Data is lost on server restart.
    """
    
    def __init__(self):
        self.sessions: Dict[str, dict] = {}
        self.messages: Dict[str, List[dict]] = {}
        self.max_sessions = MAX_SESSIONS
    
    def create_session(
        self, 
        agent_asset_id: str, 
        user_address: Optional[str] = None
    ) -> str:
        """
        Create new conversation session and return session_id.
        
        Args:
            agent_asset_id (str): The Cardano asset ID of the agent
            user_address (str, optional): User's Cardano address
        
        Returns:
            str: Session ID (UUID)
        """
        session_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        self.sessions[session_id] = {
            "session_id": session_id,
            "agent_asset_id": agent_asset_id,
            "user_address": user_address,
            "created_at": now,
            "updated_at": now,
            "message_count": 0
        }
        
        self.messages[session_id] = []
        
        # Cleanup if too many sessions
        if len(self.sessions) > self.max_sessions:
            self._cleanup_old_sessions()
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """
        Get session by ID.
        
        Args:
            session_id (str): Session ID
        
        Returns:
            dict: Session data or None if not found
        """
        return self.sessions.get(session_id)
    
    def add_message(
        self, 
        session_id: str, 
        role: str, 
        content: str,
        agent_asset_id: Optional[str] = None, 
        metadata: Optional[dict] = None
    ):
        """
        Add message to session.
        
        Args:
            session_id (str): Session ID
            role (str): 'user' or 'agent'
            content (str): Message content
            agent_asset_id (str, optional): Agent asset ID (for agent messages)
            metadata (dict, optional): Additional metadata
        
        Raises:
            ValueError: If session not found
        """
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        message = {
            "message_id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "agent_asset_id": agent_asset_id,
            "metadata": metadata or {}
        }
        
        self.messages[session_id].append(message)
        self.sessions[session_id]["message_count"] += 1
        self.sessions[session_id]["updated_at"] = datetime.utcnow().isoformat()
    
    def get_messages(
        self, 
        session_id: str, 
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[dict]:
        """
        Get messages for session with pagination support.
        
        Args:
            session_id (str): Session ID
            limit (int, optional): Maximum number of messages to return
            offset (int, optional): Number of messages to skip (for pagination)
        
        Returns:
            List[dict]: List of messages (empty list if session not found)
        """
        if session_id not in self.messages:
            return []
        
        messages = self.messages[session_id]
        
        # Apply pagination (reverse order - most recent first)
        if limit is not None or offset is not None:
            # Reverse to get most recent first
            reversed_messages = list(reversed(messages))
            
            # Apply offset
            if offset:
                reversed_messages = reversed_messages[offset:]
            
            # Apply limit
            if limit:
                reversed_messages = reversed_messages[:limit]
            
            # Reverse back to chronological order (oldest first)
            return list(reversed(reversed_messages))
        
        # No pagination - return all messages
        return messages
    
    def get_message_count(self, session_id: str) -> int:
        """
        Get total number of messages in session.
        
        Args:
            session_id (str): Session ID
        
        Returns:
            int: Total message count (0 if session not found)
        """
        if session_id not in self.messages:
            return 0
        return len(self.messages[session_id])
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete session and all messages.
        
        Args:
            session_id (str): Session ID
        
        Returns:
            bool: True if deleted, False if not found
        """
        deleted = False
        if session_id in self.sessions:
            del self.sessions[session_id]
            deleted = True
        if session_id in self.messages:
            del self.messages[session_id]
            deleted = True
        return deleted
    
    def list_sessions(
        self, 
        agent_asset_id: Optional[str] = None,
        user_address: Optional[str] = None
    ) -> List[dict]:
        """
        List all sessions, optionally filtered.
        
        Args:
            agent_asset_id (str, optional): Filter by agent asset ID
            user_address (str, optional): Filter by user address
        
        Returns:
            List[dict]: List of session dictionaries
        """
        sessions = list(self.sessions.values())
        
        if agent_asset_id:
            sessions = [s for s in sessions if s["agent_asset_id"] == agent_asset_id]
        if user_address:
            sessions = [s for s in sessions if s.get("user_address") == user_address]
        
        return sessions
    
    def _cleanup_old_sessions(self):
        """
        Remove oldest sessions if limit exceeded.
        Removes oldest 10% of sessions.
        """
        if len(self.sessions) <= self.max_sessions:
            return
        
        # Sort by updated_at, remove oldest
        sorted_sessions = sorted(
            self.sessions.items(),
            key=lambda x: x[1]["updated_at"]
        )
        
        # Remove oldest 10% of sessions
        to_remove = max(1, len(sorted_sessions) // 10)
        for session_id, _ in sorted_sessions[:to_remove]:
            self.delete_session(session_id)


# Global instance
storage = InMemoryConversationStorage()


if __name__ == "__main__":
    # Test the storage service
    print("Testing In-Memory Conversation Storage...")
    
    # Create a test session
    session_id = storage.create_session(
        agent_asset_id="test_agent_123",
        user_address="test_user_address"
    )
    print(f"✅ Created session: {session_id}")
    
    # Add messages
    storage.add_message(session_id, "user", "Hello, agent!")
    storage.add_message(session_id, "agent", "Hello! How can I help you?", 
                       agent_asset_id="test_agent_123")
    print("✅ Added messages")
    
    # Get session
    session = storage.get_session(session_id)
    print(f"✅ Retrieved session: {session['message_count']} messages")
    
    # Get messages with pagination
    messages = storage.get_messages(session_id, limit=10, offset=0)
    print(f"✅ Retrieved {len(messages)} messages (paginated)")
    for msg in messages:
        print(f"   {msg['role']}: {msg['content']}")
    
    # List sessions
    sessions = storage.list_sessions(agent_asset_id="test_agent_123")
    print(f"✅ Found {len(sessions)} sessions for agent")
    
    # Delete session
    deleted = storage.delete_session(session_id)
    print(f"✅ Deleted session: {deleted}")
    
    print("\n✅ In-memory storage service works correctly!")

