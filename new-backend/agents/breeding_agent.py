"""
Breeding Agent - Core LLM Agent with Instructions for Breeding AI Agents

This is the heart of the breeding system. It uses Gemini with structured
instructions to analyze two parent agent personalities and create a unique child.
"""

import sys
import os
import google.generativeai as genai
from typing import Optional, Dict

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.gemini_service import get_gemini_client


class BreedingAgent:
    """
    LLM Agent that breeds two parent agent personalities into a unique child.
    
    Uses Gemini with system instructions to ensure consistent, creative breeding.
    """
    
    def __init__(self, gemini_client=None):
        """
        Initialize the Breeding Agent.
        
        Args:
            gemini_client: Optional Gemini client. If None, will create one.
        """
        if gemini_client is None:
            self.client = get_gemini_client()
        else:
            self.client = gemini_client
        
        # System instructions for the breeding agent
        self.system_instructions = """
You are a Genetic Breeding Engine for AI Agents on Cardano.

Your role is to:
1. Analyze two parent agent personalities (system prompts)
2. Identify their core traits, behaviors, and characteristics
3. Create a unique child personality that:
   - Inherits meaningful traits from both parents
   - Creates novel combinations and emergent behaviors
   - Maintains coherence and personality consistency
   - Is distinct from both parents (not just a merge)
   - Is suitable as a system prompt for an AI agent

Output Format:
- Return ONLY the child personality as a system prompt
- Start with "You are..." or similar directive
- Be creative but coherent
- Length: 100-300 words
- Make it unique and interesting
"""
    
    def breed_agents(self, parent_a: str, parent_b: str, context: Optional[Dict] = None) -> str:
        """
        Breed two parent agent personalities into a unique child.
        
        Args:
            parent_a (str): First parent agent's personality/system prompt
            parent_b (str): Second parent agent's personality/system prompt
            context (Optional[Dict]): Additional context including:
                - custom_instructions (str): Custom breeding instructions
                - parent_a_purpose (str): Parent A's purpose (for reference)
                - parent_b_purpose (str): Parent B's purpose (for reference)
                - parent_a_instructions (str): Parent A's instructions (for reference)
                - parent_b_instructions (str): Parent B's instructions (for reference)
        
        Returns:
            str: Unique child personality/system prompt
        
        Note: AI decides the optimal mix of traits (no trait balance slider influence).
        Parent purposes and instructions are included in the prompt for richer context.
        """
        # Extract context values
        custom_instructions = context.get("custom_instructions", "") if context else ""
        parent_a_purpose = context.get("parent_a_purpose", "") if context else ""
        parent_b_purpose = context.get("parent_b_purpose", "") if context else ""
        parent_a_instructions = context.get("parent_a_instructions", "") if context else ""
        parent_b_instructions = context.get("parent_b_instructions", "") if context else ""
        
        # Construct the breeding prompt with context (include parent purposes/instructions, no trait balance)
        prompt = f"""
Parent A Personality:
{parent_a}

Parent B Personality:
{parent_b}
"""
        
        # Include parent purposes if available
        if parent_a_purpose or parent_b_purpose:
            prompt += f"""
Parent A Purpose: {parent_a_purpose or "Not specified"}
Parent B Purpose: {parent_b_purpose or "Not specified"}
"""
        
        # Include parent instructions if available
        if parent_a_instructions or parent_b_instructions:
            prompt += f"""
Parent A Instructions: {parent_a_instructions or "Not specified"}
Parent B Instructions: {parent_b_instructions or "Not specified"}
"""
        
        prompt += """
Create a unique child personality that combines traits from both parents.
The AI should decide the optimal mix of characteristics from both parents.
"""
        
        if custom_instructions:
            prompt += f"\nCustom Breeding Instructions: {custom_instructions}\n"
        
        prompt += """
The child should inherit meaningful characteristics from both parents while
creating something new and distinct. Make it coherent and suitable as a
system prompt for an AI agent.
"""
        
        try:
            # Use Gemini with system instructions
            # Note: Gemini API structure may vary, this is the general approach
            response = self.client.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8,  # Creative but controlled
                    top_p=0.95,
                    top_k=40,
                )
            )
            
            child_personality = response.text.strip()
            
            # Ensure it starts with a directive if it doesn't
            if not (child_personality.startswith("You are") or 
                    child_personality.startswith("You're") or
                    child_personality.startswith("You")):
                # Add a directive if missing
                child_personality = f"You are {child_personality.lower()}"
            
            return child_personality
        
        except Exception as e:
            raise Exception(f"Failed to breed agents: {str(e)}")


if __name__ == "__main__":
    # Test the breeding agent (requires GEMINI_API_KEY in .env)
    print("Testing Breeding Agent...")
    
    try:
        agent = BreedingAgent()
        
        parent_a = "You are a ruthless trader who loves high risk and quick decisions. You thrive on volatility and make bold moves."
        parent_b = "You are a cautious poet who speaks in riddles and thinks deeply. You value wisdom and contemplation."
        
        print(f"\nParent A: {parent_a}")
        print(f"\nParent B: {parent_b}")
        print("\nBreeding agents...")
        
        # Test with context
        context = {
            "custom_instructions": "Focus on creative problem-solving traits",
            "parent_a_purpose": "Maximize trading profits",
            "parent_b_purpose": "Create beautiful poetry"
        }
        
        child = agent.breed_agents(parent_a, parent_b, context=context)
        
        print(f"\n✅ Child Personality Generated:")
        print(f"{child}")
        print(f"\n✅ Breeding agent works! (Generated {len(child)} characters)")
        
    except ValueError as e:
        print(f"⚠️  Configuration error: {e}")
        print("   Add GEMINI_API_KEY to backend/.env file")
    except Exception as e:
        print(f"❌ Error: {e}")

