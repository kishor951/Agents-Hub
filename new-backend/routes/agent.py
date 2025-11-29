"""
Agent routes - Agent creation and management endpoints
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from services.ipfs_service import upload_to_ipfs, upload_image_to_ipfs, fetch_from_ipfs
from services.gemini_service import generate_personality
from services.masumi_service import generate_masumi_did
from services.blockchain_service import fetch_agent_metadata, fetch_agent_personality
from services.metadata_utils import extract_properties_from_metadata
from models.schemas import CreateAgentResponse
import hashlib
import json
from datetime import datetime
from typing import Optional

router = APIRouter()


@router.post("/agents/create", response_model=CreateAgentResponse)
async def create_agent(
    name: str = Form(...),
    purpose: str = Form(...),
    instructions: str = Form(...),
    personality: str = Form(""),  # Ignored - always regenerate
    skills: str = Form(""),
    llmModel: str = Form("x-ai/grok-4.1-fast:free"),
    owner: str = Form(...),
    picture: Optional[UploadFile] = File(None)
):
    """
    Create a new agent - generates personality, uploads to IPFS, returns metadata.
    
    This endpoint matches the Reference /create endpoint format.
    Frontend will build CIP-68 transaction using the returned metadata.
    
    Args:
        name: Agent name (required)
        purpose: Agent purpose (required)
        instructions: Agent instructions (required)
        personality: Ignored - always regenerated using Gemini
        skills: Comma-separated skills list
        llmModel: LLM model to use (default: x-ai/grok-4.1-fast:free)
        owner: Wallet address of agent owner (required)
        picture: Optional image file
    
    Returns:
        CreateAgentResponse: Metadata for frontend to build CIP-68 transaction
    """
    try:
        # Step 1: Validate required fields
        if not name or not purpose or not instructions or not owner:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: name, purpose, instructions, owner"
            )
        
        # Step 2: Upload image to IPFS (if provided)
        image_ipfs_cid = None
        if picture:
            try:
                image_content = await picture.read()
                image_ipfs_cid = upload_image_to_ipfs(image_content, picture.filename or "agent_image")
                print(f"📤 [IPFS] Image uploaded: {image_ipfs_cid}")
            except Exception as e:
                print(f"⚠️  [IPFS] Image upload failed: {e}")
                # Continue without image - not critical
        
        
        # Step 4: Prepare genetic data and upload to IPFS (so it can be retrieved later)
        skills_list = [s.strip() for s in skills.split(",") if s.strip()]
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        genetic_data = {
            "name": name,
            "purpose": purpose,
            "instructions": instructions,
            "personality": personality,  # Use generated personality
            "skills": sorted(skills_list),  # Sort for consistency
            "llmModel": llmModel,
            "timestamp": timestamp
        }
        
        # Generate genetic hash (for verification/identification)
        genetic_hash = hashlib.sha256(
            json.dumps(genetic_data, sort_keys=True).encode()
        ).hexdigest()[:16]
        
        print(f"🧬 [Genetic Hash] {genetic_hash}")
        
        # Upload genetic data to IPFS (so it can be retrieved when viewing agents)
        genetic_data_ipfs_cid = None
        try:
            # Convert genetic_data to JSON string
            genetic_data_json = json.dumps(genetic_data, sort_keys=True, ensure_ascii=False)
            # Upload to IPFS (will be stored as {"text": genetic_data_json})
            genetic_data_ipfs_cid = upload_to_ipfs(genetic_data_json)
            print(f"📤 [IPFS] Genetic data uploaded: {genetic_data_ipfs_cid}")
            print(f"   - Contains: name, purpose, instructions, personality, skills, llmModel, timestamp")
        except Exception as e:
            print(f"⚠️  [IPFS] Genetic data upload failed: {e}")
            # Continue - we'll still return genetic_hash for identification
            genetic_data_ipfs_cid = None
        
        # Step 5: Generate Masumi DID (always generate - local UUID, no API key needed)
        masumi_did = generate_masumi_did()
        print(f"🆔 [Masumi] Generated DID: {masumi_did}")
        
        # Step 6: Return response
        # Return both genetic_hash (for verification) and genetic_data_ipfs_cid (for retrieval)
        return CreateAgentResponse(
            genetic_hash=genetic_hash,
            masumi_did=masumi_did,
            image_ipfs_cid=image_ipfs_cid,
            genetic_data_ipfs_cid=genetic_data_ipfs_cid  # IPFS CID for retrieving full genetic data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Create Agent] Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create agent: {str(e)}"
        )


@router.get("/agents/{asset_id}")
def get_agent(asset_id: str):
    """
    Fetch agent data by asset ID.
    
    Returns agent metadata and personality from blockchain and IPFS.
    Matches Reference /agents/{asset_id} endpoint format.
    
    Args:
        asset_id: Cardano asset ID (User Token 222)
    
    Returns:
        dict: Agent data with snake_case keys:
            - asset_id: str
            - name: str | None
            - generation: int
            - xp: int
            - breed_count: int
            - brain_cid: str | None
            - masumi_did: str | None
            - personality: str | None
            - parents: list[str] | None
            - mint_tx_hash: str
    """
    try:
        print(f"🔍 [Get Agent] Fetching agent metadata for asset_id: {asset_id[:30]}...")
        
        # Fetch metadata from blockchain
        metadata = fetch_agent_metadata(asset_id)
        
        # Extract properties from CIP-68 metadata
        properties = extract_properties_from_metadata(metadata)
        
        # Extract brain_cid and fetch genetic data (full agent information)
        brain_cid = None
        genetic_data = None
        personality = None
        purpose = None
        instructions = None
        skills = []
        llm_model = None
        
        if properties:
            brain_cid_raw = properties.get("brain_cid")
            if brain_cid_raw:
                # Remove ipfs:// prefix if present
                brain_cid = brain_cid_raw[7:] if brain_cid_raw.startswith("ipfs://") else brain_cid_raw
                # Also handle genetic:// prefix (for legacy agents without IPFS upload)
                if brain_cid_raw.startswith("genetic://"):
                    print(f"⚠️  [Get Agent] Legacy agent with genetic:// hash - genetic data not available")
                    brain_cid = None  # No IPFS content for genetic-only agents
                else:
                    try:
                        # Fetch genetic data from IPFS
                        # fetch_from_ipfs() returns the "text" field content (already unwrapped)
                        genetic_data_json_str = fetch_from_ipfs(brain_cid)
                        
                        # Parse the JSON string to get genetic_data dict
                        try:
                            genetic_data = json.loads(genetic_data_json_str)
                            
                            # Extract all fields from genetic data
                            personality = genetic_data.get("personality")
                            purpose = genetic_data.get("purpose")
                            instructions = genetic_data.get("instructions")
                            skills = genetic_data.get("skills", [])
                            llm_model = genetic_data.get("llmModel")
                            
                            print(f"✅ [Get Agent] Fetched genetic data from IPFS")
                            print(f"   - Name: {genetic_data.get('name')}")
                            print(f"   - Purpose: {purpose[:50] if purpose else 'N/A'}...")
                            print(f"   - Personality: {len(personality) if personality else 0} chars")
                            print(f"   - Skills: {len(skills)} skills")
                            print(f"   - LLM Model: {llm_model}")
                        except json.JSONDecodeError as e:
                            # If it's not valid JSON, treat as plain text personality (legacy format)
                            print(f"⚠️  [Get Agent] IPFS content is not valid JSON, treating as personality text: {e}")
                            personality = genetic_data_json_str
                            genetic_data = None
                    except Exception as e:
                        print(f"⚠️  [Get Agent] Failed to fetch genetic data from IPFS: {e}")
                        genetic_data = None
        
        # Get name from onchain_metadata
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
                    name = str(name_raw) if name_raw else None
        
        # Build response (snake_case format - matching Reference)
        # Ensure all values are JSON-serializable (no bytes objects)
        parents = properties.get("parents") if properties else None
        if parents and isinstance(parents, list):
            # Ensure all parent IDs are strings
            parents = [str(p) if not isinstance(p, str) else p for p in parents]
        
        masumi_did = properties.get("masumi_did") if properties else None
        if masumi_did and isinstance(masumi_did, bytes):
            try:
                masumi_did = masumi_did.decode('utf-8')
            except UnicodeDecodeError:
                masumi_did = masumi_did.hex()
        elif masumi_did and not isinstance(masumi_did, str):
            masumi_did = str(masumi_did)
        
        # Ensure mint_tx_hash is a string
        mint_tx_hash = metadata.get("mint_tx_hash")
        if mint_tx_hash and isinstance(mint_tx_hash, bytes):
            mint_tx_hash = mint_tx_hash.hex()
        elif mint_tx_hash and not isinstance(mint_tx_hash, str):
            mint_tx_hash = str(mint_tx_hash)
        
        # Use name from genetic_data if available (more accurate), otherwise use onchain_metadata
        final_name = genetic_data.get("name") if genetic_data else name
        
        response = {
            "asset_id": str(asset_id),
            "name": final_name,
            "purpose": purpose,  # From genetic data
            "instructions": instructions,  # From genetic data
            "personality": str(personality) if personality else None,  # From genetic data
            "skills": skills if isinstance(skills, list) else [],  # From genetic data
            "llm_model": llm_model,  # From genetic data
            "generation": int(properties.get("generation", 0)) if properties else 0,
            "xp": int(properties.get("xp", 0)) if properties else 0,
            "breed_count": int(properties.get("breed_count", 0)) if properties else 0,
            "brain_cid": str(brain_cid) if brain_cid else None,
            "genetic_hash": properties.get("genetic_hash") if properties else None,  # Include genetic hash
            "masumi_did": masumi_did,
            "parents": parents,
            "mint_tx_hash": mint_tx_hash
        }
        response["generation"] = response["generation"] + 1
        
        print(f"✅ [Get Agent] Returning agent data for {asset_id[:30]}...")
        return response
    
    except ValueError as e:
        print(f"❌ [Get Agent] Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ [Get Agent] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent: {str(e)}")

