"""
Agent Cache Service - In-Memory Cache for Agent Personality

Caches agent personality to avoid IPFS calls on every conversation turn.
Only personality is cached (not full context).
"""

from typing import Optional, Dict
from datetime import datetime, timedelta
import os
from collections import OrderedDict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
CACHE_TTL = int(os.getenv("AGENT_CACHE_TTL", "3600"))  # 1 hour default
MAX_CACHE_SIZE = int(os.getenv("AGENT_CACHE_MAX_SIZE", "100"))  # 100 agents default


class AgentPersonalityCache:
    """
    In-memory cache for agent personality strings.
    
    Uses OrderedDict for LRU eviction.
    Only personality is cached (not full agent context).
    """
    
    def __init__(self, ttl: int = CACHE_TTL, max_size: int = MAX_CACHE_SIZE):
        """
        Initialize cache.
        
        Args:
            ttl (int): Time to live in seconds (default: 1 hour)
            max_size (int): Maximum number of cached agents (default: 100)
        """
        self.cache: OrderedDict[str, Dict] = OrderedDict()
        self.ttl = ttl
        self.max_size = max_size
    
    def get(self, asset_id: str) -> Optional[str]:
        """
        Get cached personality for agent.
        
        Args:
            asset_id (str): Agent asset ID
        
        Returns:
            str: Cached personality string, or None if not found/expired
        
        Raises:
            Exception: If cache retrieval fails (returns error, no fallback)
        """
        try:
            if asset_id not in self.cache:
                return None
            
            cached_data = self.cache[asset_id]
            expires_at = cached_data.get("expires_at")
            
            # Check if expired
            if expires_at and datetime.utcnow() > expires_at:
                # Remove expired entry
                del self.cache[asset_id]
                return None
            
            # Move to end (LRU)
            self.cache.move_to_end(asset_id)
            
            return cached_data.get("personality")
        
        except Exception as e:
            # Return error if cache retrieval fails (no fallback)
            raise Exception(f"Cache retrieval failed: {str(e)}")
    
    def set(self, asset_id: str, personality: str) -> None:
        """
        Store personality in cache.
        
        Args:
            asset_id (str): Agent asset ID
            personality (str): Agent personality string
        """
        try:
            expires_at = datetime.utcnow() + timedelta(seconds=self.ttl)
            
            # Remove if exists (to update position)
            if asset_id in self.cache:
                del self.cache[asset_id]
            
            # Add to cache
            self.cache[asset_id] = {
                "personality": personality,
                "expires_at": expires_at
            }
            
            # Move to end (LRU)
            self.cache.move_to_end(asset_id)
            
            # Evict oldest if cache is full
            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)  # Remove oldest (first item)
        
        except Exception as e:
            print(f"⚠️  [Cache] Failed to store personality: {e}")
            # Don't raise - caching is optimization, not critical
    
    def clear(self) -> None:
        """Clear entire cache."""
        self.cache.clear()
    
    def invalidate(self, asset_id: str) -> bool:
        """
        Remove specific agent from cache.
        
        Args:
            asset_id (str): Agent asset ID
        
        Returns:
            bool: True if removed, False if not found
        """
        if asset_id in self.cache:
            del self.cache[asset_id]
            return True
        return False
    
    def size(self) -> int:
        """Get current cache size."""
        return len(self.cache)
    
    def cleanup_expired(self) -> int:
        """
        Remove all expired entries.
        
        Returns:
            int: Number of entries removed
        """
        now = datetime.utcnow()
        expired = [
            asset_id for asset_id, data in self.cache.items()
            if data.get("expires_at") and now > data["expires_at"]
        ]
        
        for asset_id in expired:
            del self.cache[asset_id]
        
        return len(expired)


# Global cache instance
agent_cache = AgentPersonalityCache()


if __name__ == "__main__":
    # Test the cache service
    print("Testing Agent Personality Cache...")
    
    # Test set/get
    test_asset_id = "test_agent_123"
    test_personality = "I am a helpful AI agent."
    
    agent_cache.set(test_asset_id, test_personality)
    print(f"✅ Stored personality for {test_asset_id}")
    
    cached = agent_cache.get(test_asset_id)
    if cached == test_personality:
        print(f"✅ Retrieved personality: {cached[:50]}...")
    else:
        print(f"❌ Cache mismatch!")
    
    # Test expiration
    print(f"\n✅ Cache size: {agent_cache.size()}")
    
    # Test cleanup
    removed = agent_cache.cleanup_expired()
    print(f"✅ Cleaned up {removed} expired entries")
    
    # Test invalidate
    invalidated = agent_cache.invalidate(test_asset_id)
    print(f"✅ Invalidated entry: {invalidated}")
    
    # Test clear
    agent_cache.clear()
    print(f"✅ Cleared cache. Size: {agent_cache.size()}")
    
    print("\n✅ Agent personality cache service works correctly!")

