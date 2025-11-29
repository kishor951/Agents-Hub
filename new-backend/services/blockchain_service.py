"""
Blockchain Service - Fetches agent data from Cardano using Blockfrost

Retrieves CIP-68 token metadata and extracts agent information.
"""

import os
import requests
import time
from typing import Optional, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BLOCKFROST_API_KEY = os.getenv("BLOCKFROST_API_KEY")
BLOCKFROST_BASE_URL = "https://cardano-preprod.blockfrost.io/api/v0"

# Retry configuration for rate limiting
MAX_RETRIES = 5
INITIAL_RETRY_DELAY = 1  # seconds
MAX_RETRY_DELAY = 60  # seconds


def fetch_agent_metadata(asset_id: str) -> Dict:
    """
    Fetch agent metadata from Cardano blockchain using Blockfrost.
    
    For CIP-68 tokens, we need to:
    1. Get the asset information
    2. Find the Reference Token (label 100)
    3. Extract metadata from the Reference Token
    
    Args:
        asset_id (str): The Cardano asset ID (User Token 222)
    
    Returns:
        dict: Agent metadata including brain_cid, masumi_did, generation, etc.
    
    Raises:
        ValueError: If BLOCKFROST_API_KEY is not configured
        requests.RequestException: If API call fails
    
    Example:
        >>> metadata = fetch_agent_metadata("abc123...")
        >>> print(metadata['brain_cid'])
        ipfs://QmHash...
    """
    if not BLOCKFROST_API_KEY:
        raise ValueError(
            "BLOCKFROST_API_KEY not configured in .env file. "
            "Please add: BLOCKFROST_API_KEY=your_key_here"
        )
    
    headers = {
        "project_id": BLOCKFROST_API_KEY
    }
    
    try:
        # Step 1: Get asset information
        # Clean asset_id (remove any whitespace, newlines, or URL encoding)
        asset_id = asset_id.strip()
        
        # Remove any URL-encoded characters or extra whitespace
        import urllib.parse
        asset_id = urllib.parse.unquote(asset_id)
        asset_id = asset_id.strip()
        
        # Validate asset_id format (should be policy_id + asset_name, typically 56+ chars)
        # Policy ID is 56 hex chars, asset name varies
        if len(asset_id) < 56:
            raise ValueError(
                f"Invalid asset_id format. Expected at least 56 characters (policy_id), "
                f"got {len(asset_id)}. Asset ID: {asset_id[:50]}..."
            )
        
        # Check if asset_id contains only hex characters (after removing any prefixes)
        # Blockfrost expects just the hex string
        if not all(c in '0123456789abcdefABCDEF' for c in asset_id):
            raise ValueError(
                f"Invalid asset_id format. Asset ID should contain only hexadecimal characters. "
                f"Got: {asset_id[:50]}..."
            )
        
        asset_url = f"{BLOCKFROST_BASE_URL}/assets/{asset_id}"
        
        # Debug: Log the request (without exposing full API key)
        print(f"🔍 [Blockchain] Fetching asset from Blockfrost")
        print(f"   Asset ID length: {len(asset_id)}")
        print(f"   Asset ID (first 30): {asset_id[:30]}...")
        print(f"   Asset ID (last 30): ...{asset_id[-30:]}")
        print(f"   API Key present: {bool(BLOCKFROST_API_KEY)}")
        
        asset_response = requests.get(asset_url, headers=headers, timeout=30)
        
        # Better error handling for 403
        if asset_response.status_code == 403:
            error_detail = asset_response.text[:500] if asset_response.text else "No error details"
            raise Exception(
                f"Blockfrost API returned 403 Forbidden for asset {asset_id[:30]}...\n"
                f"This could mean:\n"
                f"1. The asset doesn't exist on preprod network\n"
                f"2. The asset ID format is incorrect\n"
                f"3. The API key doesn't have access to this asset\n\n"
                f"Error details: {error_detail}"
            )
        
        asset_response.raise_for_status()
        asset_data = asset_response.json()
        
        # Step 2: For CIP-68, we need to find the Reference Token
        # The asset_id is the User Token (222), we need to find its Reference Token (100)
        # CIP-68 structure: Reference Token has same policy + name with label 100
        
        # Extract policy and asset name from asset_id
        # Asset ID format: {policy_id}{asset_name_hex}
        # For CIP-68: asset_name has label 222, we need label 100
        
        # Get the minting transaction to find the Reference Token
        # This is a simplified approach - in production, you'd parse the CIP-68 structure properly
        mint_tx_hash = asset_data.get("initial_mint_tx_hash")
        
        if not mint_tx_hash:
            raise ValueError(f"Could not find minting transaction for asset {asset_id}")
        
        # Get transaction metadata (with retry logic for rate limiting)
        tx_url = f"{BLOCKFROST_BASE_URL}/txs/{mint_tx_hash}/metadata"
        tx_metadata = None
        last_exception = None
        
        for attempt in range(MAX_RETRIES):
            try:
                tx_response = requests.get(tx_url, headers=headers, timeout=30)
                
                # Check for rate limiting (429)
                if tx_response.status_code == 429:
                    if attempt < MAX_RETRIES - 1:
                        # Calculate exponential backoff delay
                        delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                        # Check if Retry-After header is present
                        retry_after = tx_response.headers.get("Retry-After")
                        if retry_after:
                            try:
                                delay = int(retry_after)
                            except ValueError:
                                pass
                        
                        print(f"⚠️  [Blockchain] Rate limited (429). Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                        time.sleep(delay)
                        continue
                    else:
                        raise Exception(f"Rate limited (429) after {MAX_RETRIES} attempts")
                
                tx_response.raise_for_status()
                tx_metadata = tx_response.json()
                break  # Success, exit retry loop
                
            except requests.exceptions.HTTPError as e:
                if e.response and e.response.status_code == 429:
                    # Already handled above, continue retry
                    if attempt == MAX_RETRIES - 1:
                        raise Exception(f"Rate limited (429) after {MAX_RETRIES} attempts")
                    continue
                else:
                    # Other HTTP errors, don't retry
                    raise
            except requests.exceptions.RequestException as e:
                last_exception = e
                # Retry on network errors
                if attempt < MAX_RETRIES - 1:
                    delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                    print(f"⚠️  [Blockchain] Network error. Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(delay)
                    continue
                else:
                    raise Exception(f"Failed to fetch transaction metadata after {MAX_RETRIES} attempts: {str(e)}")
        
        if tx_metadata is None:
            raise Exception(f"Failed to fetch transaction metadata: {str(last_exception)}")
        
        # Get asset onchain metadata (this is where CIP-68 metadata is typically stored)
        # Blockfrost provides onchain_metadata which contains the actual metadata
        asset_onchain_metadata = asset_data.get("onchain_metadata", {})
        
        metadata = {
            "asset_id": asset_id,
            "mint_tx_hash": mint_tx_hash,
            "raw_metadata": tx_metadata,
            "asset_data": asset_data,  # Full asset data
            "onchain_metadata": asset_onchain_metadata  # This is where CIP-68 metadata should be
        }
        
        # Try to extract CIP-68 metadata
        # Note: This is a placeholder - actual CIP-68 parsing would be more complex
        # You'd need to parse the datum from the Reference Token UTXO
        
        return metadata
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            raise Exception(
                f"Blockfrost API returned 403 Forbidden. "
                f"This usually means:\n"
                f"1. BLOCKFROST_API_KEY is missing or incorrect in .env\n"
                f"2. The API key doesn't have access to preprod network\n"
                f"3. The API key has expired or been revoked\n\n"
                f"Please check your .env file and ensure BLOCKFROST_API_KEY is set correctly."
            )
        raise Exception(f"Failed to fetch agent metadata: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch agent metadata: {str(e)}")


def fetch_agent_personality(brain_cid: str) -> str:
    """
    Fetch agent personality from IPFS using brain_cid.
    
    This is a convenience function that calls the IPFS service.
    
    Args:
        brain_cid (str): IPFS CID (with or without ipfs:// prefix)
    
    Returns:
        str: Agent personality/system prompt
    """
    from services.ipfs_service import fetch_from_ipfs
    return fetch_from_ipfs(brain_cid)

