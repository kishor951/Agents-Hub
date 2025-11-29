"""
Masumi Service - Generates Masumi Decentralized Identifiers (DIDs)

Each agent gets a unique DID in the format: did:masumi:testnet:agent-{uuid}

NOTE: Currently generates DID format locally. For production, integrate with Masumi Network API
to actually register the DID. See: https://docs.masumi.network/
"""

import uuid
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Masumi Network API configuration (if available)
MASUMI_API_URL = os.getenv("MASUMI_API_URL")  # e.g., "https://api.masumi.network"
MASUMI_API_KEY = os.getenv("MASUMI_API_KEY")  # API key if required


def generate_masumi_did(register_with_masumi: bool = False) -> str:
    """
    Generate a unique Masumi DID for an agent.
    
    Args:
        register_with_masumi: If True, attempts to register DID with Masumi Network API.
                             Currently defaults to False (local generation only).
    
    Returns:
        str: A DID in the format did:masumi:testnet:agent-{uuid}
    
    Example:
        >>> did = generate_masumi_did()
        >>> print(did)
        did:masumi:testnet:agent-550e8400-e29b-41d4-a716-446655440000
    
    Note:
        Currently generates DID format locally. For production integration with Masumi Network:
        1. Set MASUMI_API_URL and MASUMI_API_KEY in .env
        2. Set register_with_masumi=True
        3. Implement actual API registration call
    """
    # Generate a UUID for uniqueness (always generate - no API key needed for local generation)
    agent_uuid = str(uuid.uuid4())
    
    # Format: did:masumi:testnet:agent-{uuid}
    did = f"did:masumi:testnet:agent-{agent_uuid}"
    
    # TODO: Register with Masumi Network API if enabled
    if register_with_masumi and MASUMI_API_URL and MASUMI_API_KEY:
        try:
            # Placeholder for actual Masumi Network API registration
            # This would call Masumi's DID registration endpoint
            # response = requests.post(
            #     f"{MASUMI_API_URL}/dids/register",
            #     headers={"Authorization": f"Bearer {MASUMI_API_KEY}"},
            #     json={"did": did, "network": "testnet"}
            # )
            # response.raise_for_status()
            print(f"⚠️  Masumi Network registration not yet implemented. Generated DID locally: {did}")
        except Exception as e:
            print(f"⚠️  Failed to register DID with Masumi Network: {e}")
            print(f"   Using locally generated DID: {did}")
    
    return did


if __name__ == "__main__":
    # Test the service
    print("Testing Masumi Service...")
    did = generate_masumi_did()
    
    if did:
        print(f"Generated DID: {did}")
        
        # Verify format
        assert did.startswith("did:masumi:testnet:agent-"), "DID format incorrect"
        assert len(did) > 30, "DID too short"
        
        # Generate a few more to verify uniqueness
        dids = [generate_masumi_did() for _ in range(5)]
        dids = [d for d in dids if d is not None]
        assert len(set(dids)) == len(dids), "DIDs are not unique!"
        
        print("✅ Masumi service works correctly!")
        print(f"✅ Generated {len(dids)} unique DIDs")
    else:
        print("⚠️  MASUMI_API_KEY not set - DID generation skipped (optional feature)")

