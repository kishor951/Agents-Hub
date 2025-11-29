"""
Breeding Route - Handles agent breeding/fusion

Breed two existing agents by fetching their genetic data from blockchain/IPFS,
using the BreedingAgent to create a child personality, and generating purpose/instructions.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import (
    BreedAgentsRequest, BreedAgentsResponse,
    CalculateCompatibilityRequest, CalculateCompatibilityResponse, AgentDetails
)
from services.blockchain_service import fetch_agent_metadata, fetch_agent_personality
from services.ipfs_service import upload_to_ipfs
from services.masumi_service import generate_masumi_did
from agents.breeding_agent import BreedingAgent
from services.metadata_utils import extract_properties_from_metadata
from services.gemini_service import get_gemini_client
import json
import re
from datetime import datetime

router = APIRouter()


@router.post("/breed", response_model=BreedAgentsResponse)
async def breed_agents(request: BreedAgentsRequest):
    """
    Breed two existing agents.
    
    Fetches parent agents from blockchain, gets their full genetic data from IPFS,
    breeds them using the Breeding Agent (includes parent purposes/instructions in prompt, custom instructions, NO trait balance),
    generates purpose and instructions, and returns complete child genetic data.
    """
    try:
        # Fetch parent A metadata and genetic data
        parent_a_metadata = fetch_agent_metadata(request.parent_a_asset_id)
        parent_a_properties = extract_properties_from_metadata(parent_a_metadata)
        parent_a_cid = parent_a_properties.get("brain_cid", "").replace("ipfs://", "").replace("genetic://", "")
        
        if not parent_a_cid:
            raise HTTPException(status_code=400, detail="Parent A: brain_cid not found in metadata")
        
        # Fetch full genetic data for parent A (includes name, purpose, instructions, personality, skills, llmModel)
        parent_a_genetic_data_json = fetch_agent_personality(parent_a_cid)  # This returns the full genetic data JSON
        try:
            parent_a_genetic_data = json.loads(parent_a_genetic_data_json)
        except:
            # If it's not JSON, treat as personality only (legacy format)
            parent_a_genetic_data = {
                "personality": parent_a_genetic_data_json,
                "purpose": "",
                "instructions": "",
                "skills": [],
                "llm_model": ""
            }
        
        # Fetch parent B metadata and genetic data
        parent_b_metadata = fetch_agent_metadata(request.parent_b_asset_id)
        parent_b_properties = extract_properties_from_metadata(parent_b_metadata)
        parent_b_cid = parent_b_properties.get("brain_cid", "").replace("ipfs://", "").replace("genetic://", "")
        
        if not parent_b_cid:
            raise HTTPException(status_code=400, detail="Parent B: brain_cid not found in metadata")
        
        # Fetch full genetic data for parent B
        parent_b_genetic_data_json = fetch_agent_personality(parent_b_cid)
        try:
            parent_b_genetic_data = json.loads(parent_b_genetic_data_json)
        except:
            # If it's not JSON, treat as personality only (legacy format)
            parent_b_genetic_data = {
                "personality": parent_b_genetic_data_json,
                "purpose": "",
                "instructions": "",
                "skills": [],
                "llm_model": ""
            }
        
        # Get parent A's llmModel (will be used for child)
        parent_a_llm_model = parent_a_genetic_data.get("llmModel") or parent_a_genetic_data.get("llm_model") or ""
        
        # Breed personality using Breeding Agent (AI decides the mix, no trait balance)
        breeding_agent = BreedingAgent()
        
        # Prepare breeding context (include custom instructions only, no trait balance)
        breeding_context = {
            "custom_instructions": request.custom_instructions or "",
            "parent_a_purpose": parent_a_genetic_data.get("purpose", ""),
            "parent_b_purpose": parent_b_genetic_data.get("purpose", ""),
            "parent_a_instructions": parent_a_genetic_data.get("instructions", ""),
            "parent_b_instructions": parent_b_genetic_data.get("instructions", "")
        }
        
        # Breed personality (AI decides the mix, custom instructions included)
        child_personality = breeding_agent.breed_agents(
            parent_a_genetic_data.get("personality", ""),
            parent_b_genetic_data.get("personality", ""),
            context=breeding_context
        )
        
        # Generate purpose and instructions using Gemini (AI decides mix, no trait balance)
        gemini_client = get_gemini_client()
        
        # Generate child purpose (AI decides mix, no trait balance)
        purpose_prompt = f"""
Parent A Purpose: {parent_a_genetic_data.get("purpose", "")}
Parent B Purpose: {parent_b_genetic_data.get("purpose", "")}
Custom Instructions: {request.custom_instructions or "None"}

Create a unique purpose for the child agent that combines both parents' purposes.
The AI should decide the optimal mix of traits from both parents.
Keep it concise (1-2 sentences).
"""
        try:
            purpose_response = gemini_client.generate_content(purpose_prompt)
            child_purpose = purpose_response.text.strip()
        except Exception as e:
            print(f"⚠️ [Breed] Failed to generate purpose, using fallback: {e}")
            # Fallback: Combine parent purposes
            child_purpose = f"Combined purpose from {parent_a_genetic_data.get('purpose', 'Parent A')} and {parent_b_genetic_data.get('purpose', 'Parent B')}"
        
        # Generate child instructions (AI decides mix, no trait balance)
        instructions_prompt = f"""
Parent A Instructions: {parent_a_genetic_data.get("instructions", "")}
Parent B Instructions: {parent_b_genetic_data.get("instructions", "")}
Custom Breeding Instructions: {request.custom_instructions or "None"}

Create detailed instructions for the child agent that combine both parents' instructions.
The AI should decide the optimal mix of approaches from both parents.
Include the custom breeding instructions if provided.
Keep it comprehensive but clear.
"""
        try:
            instructions_response = gemini_client.generate_content(instructions_prompt)
            child_instructions = instructions_response.text.strip()
        except Exception as e:
            print(f"⚠️ [Breed] Failed to generate instructions, using fallback: {e}")
            # Fallback: Combine parent instructions
            child_instructions = f"Follow instructions from both parents: {parent_a_genetic_data.get('instructions', '')} and {parent_b_genetic_data.get('instructions', '')}"
        
        # Prepare child genetic data (full structure)
        child_genetic_data = {
            "name": request.child_name,
            "purpose": child_purpose,
            "instructions": child_instructions,
            "personality": child_personality,
            "skills": request.predicted_skills or [],  # From compatibility calculation (predicted child skills)
            "llmModel": parent_a_llm_model,  # Use parent A's llmModel
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Upload child genetic data to IPFS
        child_genetic_data_json = json.dumps(child_genetic_data, sort_keys=True, ensure_ascii=False)
        child_ipfs_hash = upload_to_ipfs(child_genetic_data_json)
        
        # Generate Masumi DID
        masumi_did = generate_masumi_did()
        
        return BreedAgentsResponse(
            ipfs_hash=child_ipfs_hash,
            child_text=child_personality,  # For backward compatibility
            masumi_did=masumi_did,
            parent_a_personality=parent_a_genetic_data.get("personality", ""),
            parent_b_personality=parent_b_genetic_data.get("personality", ""),
            # Additional fields for frontend
            child_purpose=child_purpose,
            child_instructions=child_instructions,
            child_skills=request.predicted_skills or [],
            child_llm_model=parent_a_llm_model
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to breed agents: {str(e)}")


@router.post("/calculate-compatibility", response_model=CalculateCompatibilityResponse)
async def calculate_compatibility(request: CalculateCompatibilityRequest):
    """
    Calculate compatibility between two agents.
    
    Analyzes both agents' details (purpose, instructions, personality, skills),
    uses Gemini AI to generate compatibility analysis and predict child skills,
    and calculates a compatibility score (0-100).
    
    Can accept either:
    - asset_ids (will fetch from blockchain/IPFS)
    - full agent details directly
    """
    try:
        # Get agent details (either from blockchain or from request)
        parent_a_details = None
        parent_b_details = None
        
        if request.parent_a_asset_id and request.parent_b_asset_id:
            # Fetch from blockchain
            parent_a_metadata = fetch_agent_metadata(request.parent_a_asset_id)
            parent_a_properties = extract_properties_from_metadata(parent_a_metadata)
            parent_a_cid = parent_a_properties.get("brain_cid", "").replace("ipfs://", "").replace("genetic://", "")
            
            if parent_a_cid:
                parent_a_genetic_data_json = fetch_agent_personality(parent_a_cid)
                try:
                    parent_a_genetic_data = json.loads(parent_a_genetic_data_json)
                    parent_a_details = AgentDetails(
                        name=parent_a_metadata.get("onchain_metadata", {}).get("name"),
                        purpose=parent_a_genetic_data.get("purpose", ""),
                        instructions=parent_a_genetic_data.get("instructions", ""),
                        personality=parent_a_genetic_data.get("personality", ""),
                        skills=parent_a_genetic_data.get("skills", [])
                    )
                except:
                    # Legacy format - personality only
                    parent_a_details = AgentDetails(
                        name=parent_a_metadata.get("onchain_metadata", {}).get("name"),
                        personality=parent_a_genetic_data_json,
                        skills=[]
                    )
            
            parent_b_metadata = fetch_agent_metadata(request.parent_b_asset_id)
            parent_b_properties = extract_properties_from_metadata(parent_b_metadata)
            parent_b_cid = parent_b_properties.get("brain_cid", "").replace("ipfs://", "").replace("genetic://", "")
            
            if parent_b_cid:
                parent_b_genetic_data_json = fetch_agent_personality(parent_b_cid)
                try:
                    parent_b_genetic_data = json.loads(parent_b_genetic_data_json)
                    parent_b_details = AgentDetails(
                        name=parent_b_metadata.get("onchain_metadata", {}).get("name"),
                        purpose=parent_b_genetic_data.get("purpose", ""),
                        instructions=parent_b_genetic_data.get("instructions", ""),
                        personality=parent_b_genetic_data.get("personality", ""),
                        skills=parent_b_genetic_data.get("skills", [])
                    )
                except:
                    # Legacy format - personality only
                    parent_b_details = AgentDetails(
                        name=parent_b_metadata.get("onchain_metadata", {}).get("name"),
                        personality=parent_b_genetic_data_json,
                        skills=[]
                    )
        elif request.parent_a and request.parent_b:
            # Use provided details directly
            parent_a_details = request.parent_a
            parent_b_details = request.parent_b
        else:
            raise HTTPException(
                status_code=400,
                detail="Either provide parent_a_asset_id and parent_b_asset_id, or parent_a and parent_b details"
            )
        
        if not parent_a_details or not parent_b_details:
            raise HTTPException(
                status_code=400,
                detail="Could not fetch agent details. Please check asset IDs or provide full details."
            )
        
        # Use Gemini to analyze compatibility
        gemini_client = get_gemini_client()
        
        # Prepare agent information for analysis
        parent_a_info = f"""
Name: {parent_a_details.name or 'Unknown'}
Purpose: {parent_a_details.purpose or 'Not specified'}
Instructions: {parent_a_details.instructions or 'Not specified'}
Personality: {parent_a_details.personality or 'Not specified'}
Skills: {', '.join(parent_a_details.skills or []) or 'None'}
"""
        
        parent_b_info = f"""
Name: {parent_b_details.name or 'Unknown'}
Purpose: {parent_b_details.purpose or 'Not specified'}
Instructions: {parent_b_details.instructions or 'Not specified'}
Personality: {parent_b_details.personality or 'Not specified'}
Skills: {', '.join(parent_b_details.skills or []) or 'None'}
"""
        
        # Generate compatibility analysis and score using Gemini
        compatibility_prompt = f"""
Analyze the compatibility between two AI agents for breeding purposes.

Parent A:
{parent_a_info}

Parent B:
{parent_b_info}

Please provide:
1. A compatibility score from 0-100 (where 100 is perfect compatibility)
2. A detailed genetic analysis explaining the synergy, potential traits, and how their characteristics would combine
3. A list of 3-5 predicted skills that a child agent would likely inherit

Format your response as JSON:
{{
  "score": <number 0-100>,
  "analysis": "<detailed text analysis>",
  "predicted_skills": ["<skill1>", "<skill2>", "<skill3>"]
}}

Be specific and detailed in your analysis. Consider:
- How well their purposes align
- How their personalities would complement each other
- How their skills would combine
- What unique traits might emerge
"""
        
        try:
            response = gemini_client.generate_content(compatibility_prompt)
            response_text = response.text.strip()
            
            # Try to extract JSON from response
            json_match = re.search(r'\{[^{}]*"score"[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                compatibility_data = json.loads(json_str)
            else:
                # If no JSON found, try to extract score and analysis manually
                score_match = re.search(r'"score"\s*:\s*(\d+)', response_text)
                score = int(score_match.group(1)) if score_match else 75
                
                # Extract analysis (text between "analysis" and next field or end)
                analysis_match = re.search(r'"analysis"\s*:\s*"([^"]+)"', response_text, re.DOTALL)
                analysis = analysis_match.group(1) if analysis_match else response_text
                
                # Extract predicted skills
                skills_match = re.search(r'"predicted_skills"\s*:\s*\[(.*?)\]', response_text, re.DOTALL)
                if skills_match:
                    skills_str = skills_match.group(1)
                    predicted_skills = [s.strip().strip('"') for s in skills_str.split(',')]
                else:
                    # Fallback: combine parent skills
                    all_skills = list(set((parent_a_details.skills or []) + (parent_b_details.skills or [])))
                    predicted_skills = all_skills[:5] if len(all_skills) > 5 else all_skills
                
                compatibility_data = {
                    "score": score,
                    "analysis": analysis,
                    "predicted_skills": predicted_skills
                }
            
            # Ensure score is in valid range
            score = max(0, min(100, int(compatibility_data.get("score", 75))))
            analysis = compatibility_data.get("analysis", response_text)
            predicted_skills = compatibility_data.get("predicted_skills", [])
            
            # If no skills predicted, combine parent skills as fallback
            if not predicted_skills:
                all_skills = list(set((parent_a_details.skills or []) + (parent_b_details.skills or [])))
                predicted_skills = all_skills[:5] if len(all_skills) > 5 else all_skills
            
            return CalculateCompatibilityResponse(
                score=score,
                analysis=analysis,
                predicted_skills=predicted_skills
            )
            
        except Exception as e:
            print(f"⚠️ [Compatibility] Gemini analysis failed: {e}")
            # Fallback: Calculate basic compatibility score based on skill overlap
            parent_a_skills = set(parent_a_details.skills or [])
            parent_b_skills = set(parent_b_details.skills or [])
            
            # Calculate score based on skill overlap and purpose similarity
            skill_overlap = len(parent_a_skills & parent_b_skills)
            total_skills = len(parent_a_skills | parent_b_skills)
            skill_score = (skill_overlap / total_skills * 50) if total_skills > 0 else 50
            
            # Simple purpose similarity (check if purposes contain similar keywords)
            purpose_a = (parent_a_details.purpose or "").lower()
            purpose_b = (parent_b_details.purpose or "").lower()
            purpose_words_a = set(purpose_a.split())
            purpose_words_b = set(purpose_b.split())
            purpose_overlap = len(purpose_words_a & purpose_words_b)
            total_words = len(purpose_words_a | purpose_words_b)
            purpose_score = (purpose_overlap / total_words * 50) if total_words > 0 else 50
            
            fallback_score = int((skill_score + purpose_score))
            fallback_analysis = f"{parent_a_details.name or 'Parent A'} and {parent_b_details.name or 'Parent B'} show potential for breeding. Their combined skills and purposes suggest a compatible match."
            fallback_skills = list((parent_a_skills | parent_b_skills))[:5]
            
            return CalculateCompatibilityResponse(
                score=fallback_score,
                analysis=fallback_analysis,
                predicted_skills=fallback_skills
            )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate compatibility: {str(e)}")

