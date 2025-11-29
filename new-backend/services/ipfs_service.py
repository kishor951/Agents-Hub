"""
IPFS Service - Handles IPFS storage via Pinata

Stores agent personalities (text) and images on IPFS and retrieves them using CIDs.
Uses PINATA_JWT for authentication.
"""

import os
import time
import requests
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

PINATA_JWT = os.getenv("PINATA_JWT")
PINATA_GATEWAY_URL = os.getenv("PINATA_GATEWAY_URL", "https://gateway.pinata.cloud/ipfs/")

# Retry configuration
MAX_RETRIES = 5
INITIAL_RETRY_DELAY = 1  # seconds
MAX_RETRY_DELAY = 60  # seconds


def upload_to_ipfs(content: str) -> str:
    """
    Upload text content to IPFS via Pinata with retry logic.
    
    Args:
        content (str): The text content to upload (agent personality)
    
    Returns:
        str: IPFS CID hash (without ipfs:// prefix)
    
    Raises:
        ValueError: If PINATA_JWT is not configured
        requests.RequestException: If upload fails after all retries
    
    Example:
        >>> cid = upload_to_ipfs("You are a helpful AI assistant.")
        >>> print(cid)
        QmHash123...
    """
    if not PINATA_JWT:
        raise ValueError("PINATA_JWT not configured in .env file")
    
    # Pinata API endpoint for pinning JSON/text
    url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
    
    # Prepare the payload
    payload = {
        "pinataContent": {
            "text": content
        },
        "pinataOptions": {
            "cidVersion": 1
        }
    }
    
    headers = {
        "Authorization": f"Bearer {PINATA_JWT}",
        "Content-Type": "application/json"
    }
    
    last_exception = None
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            # Check for rate limiting (429)
            if response.status_code == 429:
                if attempt < MAX_RETRIES - 1:
                    # Calculate exponential backoff delay
                    delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                    # Check if Retry-After header is present
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        try:
                            delay = int(retry_after)
                        except ValueError:
                            pass
                    
                    print(f"⚠️  Rate limited (429). Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(delay)
                    continue
                else:
                    raise Exception(f"Rate limited (429) after {MAX_RETRIES} attempts")
            
            response.raise_for_status()
            
            result = response.json()
            ipfs_hash = result.get("IpfsHash")
            
            if not ipfs_hash:
                raise ValueError(f"Pinata response missing IpfsHash: {result}")
            
            return ipfs_hash
        
        except requests.exceptions.RequestException as e:
            last_exception = e
            # Retry on network errors or 5xx errors
            if attempt < MAX_RETRIES - 1:
                # Check if it's a retryable error
                if isinstance(e, requests.exceptions.HTTPError):
                    if e.response and e.response.status_code >= 500:
                        # Server error, retry
                        delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                        print(f"⚠️  Server error ({e.response.status_code}). Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                        time.sleep(delay)
                        continue
                elif isinstance(e, (requests.exceptions.ConnectionError, requests.exceptions.Timeout)):
                    # Network error, retry
                    delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                    print(f"⚠️  Network error. Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(delay)
                    continue
            
            # If we get here, either it's the last attempt or a non-retryable error
            if attempt == MAX_RETRIES - 1:
                raise Exception(f"Failed to upload to IPFS after {MAX_RETRIES} attempts: {str(e)}")
    
    # Should not reach here, but just in case
    raise Exception(f"Failed to upload to IPFS: {str(last_exception)}")


def upload_image_to_ipfs(image_content: bytes, filename: str) -> str:
    """
    Upload image file to IPFS via Pinata with retry logic.
    
    Args:
        image_content (bytes): The image file content as bytes
        filename (str): The original filename (for metadata)
    
    Returns:
        str: IPFS CID hash (without ipfs:// prefix)
    
    Raises:
        ValueError: If PINATA_JWT is not configured
        requests.RequestException: If upload fails after all retries
    
    Example:
        >>> with open("agent.png", "rb") as f:
        ...     image_bytes = f.read()
        >>> cid = upload_image_to_ipfs(image_bytes, "agent.png")
        >>> print(cid)
        QmImageHash123...
    """
    if not PINATA_JWT:
        raise ValueError("PINATA_JWT not configured in .env file")
    
    # Pinata API endpoint for pinning files
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    
    # Prepare multipart form data
    files = {
        "file": (filename, image_content)
    }
    
    # Pinata metadata
    pinata_metadata = {
        "name": filename
    }
    
    # Pinata options
    pinata_options = {
        "cidVersion": 1
    }
    
    headers = {
        "Authorization": f"Bearer {PINATA_JWT}"
    }
    
    data = {
        "pinataMetadata": str(pinata_metadata).replace("'", '"'),
        "pinataOptions": str(pinata_options).replace("'", '"')
    }
    
    last_exception = None
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(url, files=files, data=data, headers=headers, timeout=60)
            
            # Check for rate limiting (429)
            if response.status_code == 429:
                if attempt < MAX_RETRIES - 1:
                    # Calculate exponential backoff delay
                    delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                    # Check if Retry-After header is present
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        try:
                            delay = int(retry_after)
                        except ValueError:
                            pass
                    
                    print(f"⚠️  Rate limited (429). Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(delay)
                    continue
                else:
                    raise Exception(f"Rate limited (429) after {MAX_RETRIES} attempts")
            
            response.raise_for_status()
            
            result = response.json()
            ipfs_hash = result.get("IpfsHash")
            
            if not ipfs_hash:
                raise ValueError(f"Pinata response missing IpfsHash: {result}")
            
            return ipfs_hash
        
        except requests.exceptions.RequestException as e:
            last_exception = e
            # Retry on network errors or 5xx errors
            if attempt < MAX_RETRIES - 1:
                # Check if it's a retryable error
                if isinstance(e, requests.exceptions.HTTPError):
                    if e.response and e.response.status_code >= 500:
                        # Server error, retry
                        delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                        print(f"⚠️  Server error ({e.response.status_code}). Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                        time.sleep(delay)
                        continue
                elif isinstance(e, (requests.exceptions.ConnectionError, requests.exceptions.Timeout)):
                    # Network error, retry
                    delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                    print(f"⚠️  Network error. Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(delay)
                    continue
            
            # If we get here, either it's the last attempt or a non-retryable error
            if attempt == MAX_RETRIES - 1:
                raise Exception(f"Failed to upload image to IPFS after {MAX_RETRIES} attempts: {str(e)}")
    
    # Should not reach here, but just in case
    raise Exception(f"Failed to upload image to IPFS: {str(last_exception)}")


def fetch_from_ipfs(cid: str) -> str:
    """
    Fetch content from IPFS using a CID with retry logic.
    
    Args:
        cid (str): IPFS CID (with or without ipfs:// prefix)
    
    Returns:
        str: The text content stored at that CID
    
    Raises:
        requests.RequestException: If fetch fails after all retries
    
    Example:
        >>> content = fetch_from_ipfs("QmHash123...")
        >>> print(content)
        You are a helpful AI assistant.
    """
    # Remove ipfs:// prefix if present
    cid = cid.replace("ipfs://", "").strip()
    
    # Use Pinata gateway to fetch
    url = f"{PINATA_GATEWAY_URL}{cid}"
    
    last_exception = None
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(url, timeout=30)
            
            # Check for rate limiting (429)
            if response.status_code == 429:
                if attempt < MAX_RETRIES - 1:
                    # Calculate exponential backoff delay
                    delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                    # Check if Retry-After header is present
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        try:
                            delay = int(retry_after)
                        except ValueError:
                            pass
                    
                    print(f"⚠️  Rate limited (429). Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(delay)
                    continue
                else:
                    raise Exception(f"Rate limited (429) after {MAX_RETRIES} attempts")
            
            response.raise_for_status()
            
            # The content is stored as JSON with a "text" field
            # But it might also be plain text, so try both
            try:
                json_data = response.json()
                if isinstance(json_data, dict) and "text" in json_data:
                    return json_data["text"]
                return str(json_data)
            except ValueError:
                # Not JSON, return as text
                return response.text
        
        except requests.exceptions.RequestException as e:
            last_exception = e
            # Retry on network errors or 5xx errors
            if attempt < MAX_RETRIES - 1:
                # Check if it's a retryable error
                if isinstance(e, requests.exceptions.HTTPError):
                    if e.response and e.response.status_code >= 500:
                        # Server error, retry
                        delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                        print(f"⚠️  Server error ({e.response.status_code}). Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                        time.sleep(delay)
                        continue
                elif isinstance(e, (requests.exceptions.ConnectionError, requests.exceptions.Timeout)):
                    # Network error, retry
                    delay = min(INITIAL_RETRY_DELAY * (2 ** attempt), MAX_RETRY_DELAY)
                    print(f"⚠️  Network error. Retrying in {delay} seconds... (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(delay)
                    continue
            
            # If we get here, either it's the last attempt or a non-retryable error
            if attempt == MAX_RETRIES - 1:
                raise Exception(f"Failed to fetch from IPFS after {MAX_RETRIES} attempts: {str(e)}")
    
    # Should not reach here, but just in case
    raise Exception(f"Failed to fetch from IPFS: {str(last_exception)}")

