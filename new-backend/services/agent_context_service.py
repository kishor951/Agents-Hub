"""
Agent Context Service - LangChain Agent Creation with Personality Caching

Loads agent personality from IPFS (with caching) and creates LangChain Agent instances.
Only personality is cached (1 hour TTL), other metadata fetched from blockchain each time.
"""

# Apply langchain compatibility patches before any imports
import services.langchain_patch  # noqa: F401

from typing import Optional, Dict
from services.blockchain_service import fetch_agent_metadata, fetch_agent_personality
from services.metadata_utils import extract_properties_from_metadata
from services.agent_cache_service import agent_cache


def get_agent_context(asset_id: str) -> Dict:
    """
    Fetch agent personality and metadata for conversation context.
    
    Uses personality cache to avoid IPFS calls on every conversation turn.
    Only personality is cached; other metadata fetched from blockchain each time.
    
    Args:
        asset_id (str): Cardano asset ID of the agent
    
    Returns:
        dict: {
            "personality": "string",
            "name": "string",
            "generation": "integer",
            "brain_cid": "string",
            "masumi_did": "string (optional)",
            "asset_id": "string"
        }
    
    Raises:
        ValueError: If agent not found or metadata invalid
        Exception: If IPFS fetch fails or cache retrieval fails
    """
    # Fetch agent metadata from blockchain (always fresh)
    metadata = fetch_agent_metadata(asset_id)
    
    # Extract properties from CIP-68 metadata
    properties = extract_properties_from_metadata(metadata)
    
    # Extract brain_cid
    brain_cid = None
    if properties:
        brain_cid_raw = properties.get("brain_cid")
        if brain_cid_raw:
            brain_cid = brain_cid_raw[7:] if brain_cid_raw.startswith("ipfs://") else brain_cid_raw
    
    if not brain_cid:
        raise ValueError(f"Could not find brain_cid for agent {asset_id}")
    
    # Try to get personality from cache first
    personality = None
    try:
        cached_personality = agent_cache.get(asset_id)
        if cached_personality:
            print(f"✅ [Cache] Personality cache hit for {asset_id[:30]}...")
            personality = cached_personality
        else:
            print(f"⚠️  [Cache] Personality cache miss for {asset_id[:30]}...")
    except Exception as e:
        # Cache retrieval failed - return error (no fallback)
        raise Exception(f"Cache retrieval failed: {str(e)}")
    
    # If cache miss, fetch personality from IPFS
    if not personality:
        try:
            personality = fetch_agent_personality(brain_cid)
            print(f"✅ [IPFS] Fetched personality from IPFS for {asset_id[:30]}...")
            
            # Store in cache for next time
            try:
                agent_cache.set(asset_id, personality)
                print(f"✅ [Cache] Stored personality in cache")
            except Exception as e:
                print(f"⚠️  [Cache] Failed to store personality in cache: {e}")
                # Don't raise - caching is optimization, not critical
        
        except Exception as e:
            raise Exception(f"Failed to fetch personality from IPFS: {str(e)}")
    
    # Get agent name from metadata (always fresh from blockchain)
    name = None
    if metadata.get("onchain_metadata") and isinstance(metadata.get("onchain_metadata"), dict):
        name_raw = metadata.get("onchain_metadata", {}).get("name")
        if name_raw:
            if isinstance(name_raw, bytes):
                try:
                    name = name_raw.decode('utf-8')
                except UnicodeDecodeError:
                    name = name_raw.hex()
            else:
                name = str(name_raw)
    
    if not name:
        name = f"Agent {asset_id[:8]}"
    
    # Get generation (always fresh from blockchain)
    generation = properties.get("generation", 0) if properties else 0
    
    # Get masumi_did (always fresh from blockchain)
    masumi_did = properties.get("masumi_did") if properties else None
    if masumi_did and isinstance(masumi_did, bytes):
        try:
            masumi_did = masumi_did.decode('utf-8')
        except UnicodeDecodeError:
            masumi_did = masumi_did.hex()
    elif masumi_did and not isinstance(masumi_did, str):
        masumi_did = str(masumi_did)
    
    return {
        "personality": personality,
        "name": name,
        "generation": generation,
        "brain_cid": brain_cid,
        "masumi_did": masumi_did,
        "asset_id": asset_id
    }


def create_langchain_agent(
    agent_context: Dict,
    llm=None,
    conversation_history: Optional[str] = None
) -> Dict:
    """
    Create a LangChain agent configuration from agent personality.
    
    Returns a system prompt and configuration for use with LangChain.
    
    Args:
        agent_context (dict): Agent context from get_agent_context()
        llm: LLM instance (optional, will use Gemini if not provided)
        conversation_history (str, optional): Formatted conversation history
    
    Returns:
        dict: {
            "system_prompt": "string",
            "llm": LLM instance,
            "agent_name": "string"
        }
    """
    personality = agent_context.get("personality", "")
    name = agent_context.get("name", "Agent")
    generation = agent_context.get("generation", 0)
    
    # Use Gemini LLM if not provided
    if llm is None:
        from services.gemini_service import get_gemini_langchain_llm
        try:
            llm = get_gemini_langchain_llm()
        except Exception as e:
            raise ValueError(f"Failed to initialize LLM: {str(e)}")
    
    # Create role based on agent name and generation
    role = f"AI Agent on Cardano - {name}"
    if generation > 0:
        role += f" (Generation {generation})"
    
    # Build system prompt with personality
    system_prompt = f"""You are {role}.

Your personality and characteristics:
{personality}

Your goal is to engage in natural, personality-consistent conversation with users. 
Stay true to your personality in all interactions."""

    # Add conversation history if provided (last 10 messages)
    if conversation_history:
        system_prompt += f"\n\nPrevious conversation:\n{conversation_history}"
    
    return {
        "system_prompt": system_prompt,
        "llm": llm,
        "agent_name": name
    }


def format_conversation_history(messages: list, max_messages: int = 10) -> str:
    """
    Format conversation history for agent context.
    
    Args:
        messages (list): List of message dictionaries
        max_messages (int): Maximum number of messages to include (default: 10)
    
    Returns:
        str: Formatted conversation history string
    """
    if not messages:
        return ""
    
    # Take last N messages
    recent_messages = messages[-max_messages:] if len(messages) > max_messages else messages
    
    formatted = []
    for msg in recent_messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        
        if role == "user":
            formatted.append(f"User: {content}")
        elif role == "agent":
            formatted.append(f"Agent: {content}")
        else:
            formatted.append(f"{role.capitalize()}: {content}")
    
    return "\n".join(formatted)


if __name__ == "__main__":
    # Test the service (requires a valid agent asset_id)
    print("Testing Agent Context Service...")
    print("\n⚠️  This test requires:")
    print("   1. A valid agent asset_id")
    print("   2. BLOCKFROST_API_KEY configured")
    print("   3. PINATA_JWT configured")
    print("   4. GEMINI_API_KEY configured")
    print("\nTo test with a real agent, provide an asset_id as argument")
    print("Example: python agent_context_service.py <asset_id>")
    
    import sys
    if len(sys.argv) > 1:
        asset_id = sys.argv[1]
        try:
            print(f"\nFetching agent context for: {asset_id}")
            context = get_agent_context(asset_id)
            print(f"✅ Agent context retrieved:")
            print(f"   Name: {context['name']}")
            print(f"   Generation: {context['generation']}")
            print(f"   Personality length: {len(context['personality'])} chars")
            print(f"   Personality preview: {context['personality'][:200]}...")
            
            print(f"\nCreating LangChain agent configuration...")
            agent_config = create_langchain_agent(context)
            print(f"✅ LangChain agent configuration created:")
            print(f"   Agent name: {agent_config['agent_name']}")
            print(f"   System prompt length: {len(agent_config['system_prompt'])} chars")
            print(f"   LLM type: {type(agent_config['llm']).__name__}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("\n✅ Agent context service module loaded successfully")
        print("   (Run with asset_id to test full functionality)")

