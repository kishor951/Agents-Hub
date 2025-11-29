"""
Gemini Service - Google Gemini API integration

Handles text generation using Google's Gemini AI model.
Used for generating agent personalities and LangChain integration.
"""

import os
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def get_gemini_langchain_llm():
    """
    Initialize and return a LangChain-compatible Gemini LLM for chat.
    
    Uses langchain_google_genai with workaround for compatibility issues.
    
    Returns:
        ChatGoogleGenerativeAI: LangChain Gemini LLM instance
    
    Raises:
        ValueError: If GEMINI_API_KEY is not configured
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured in .env file")
    
    # Apply langchain compatibility patches
    import services.langchain_patch  # noqa: F401
    
    # Try to use langchain_google_genai with workaround
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        # Create LLM instance with convert_system_message_to_human=True
        # This is required because Gemini doesn't support SystemMessage directly
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GEMINI_API_KEY,
            convert_system_message_to_human=True,  # Convert SystemMessage to HumanMessage
            temperature=0.7,
        )
        return llm
    except Exception as e:
        # If that fails, create a simple wrapper using LLM base class
        from langchain_core.language_models.llms import LLM
        from typing import List, Any
        
        class SimpleGeminiLLM(LLM):
            """Simple LLM wrapper for Gemini that avoids Pydantic issues"""
            
            @property
            def _llm_type(self) -> str:
                return "gemini"
            
            def _call(
                self,
                prompt: str,
                stop: Optional[List[str]] = None,
                run_manager: Optional[Any] = None,
                **kwargs: Any,
            ) -> str:
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-2.0-flash")
                response = model.generate_content(prompt)
                return response.text
        
        return SimpleGeminiLLM()


def get_gemini_client():
    """
    Initialize and return a Gemini client.
    
    Returns:
        genai.GenerativeModel: Configured Gemini model
    
    Raises:
        ValueError: If GEMINI_API_KEY is not configured
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured in .env file")
    
    # Configure the API
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Use Gemini Flash model
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    return model


def generate_personality(instruction: str, context: Optional[dict] = None) -> str:
    """
    Generate an agent personality using Gemini.
    
    Args:
        instruction (str): Instruction for what kind of personality to generate
        context (dict, optional): Additional context for generation
    
    Returns:
        str: Generated personality/system prompt
    
    Example:
        >>> personality = generate_personality("Create a helpful AI assistant")
        >>> print(personality)
        You are a helpful AI assistant...
    """
    model = get_gemini_client()
    
    # Construct the prompt
    prompt = f"Create a system prompt for an AI agent. {instruction}"
    
    if context:
        prompt += f"\n\nContext: {context}"
    
    # Generate content
    response = model.generate_content(prompt)
    
    return response.text


if __name__ == "__main__":
    # Test the service (requires GEMINI_API_KEY in .env)
    print("Testing Gemini Service...")
    
    if not GEMINI_API_KEY:
        print("⚠️  GEMINI_API_KEY not configured in .env file")
        print("   To test Gemini service:")
        print("   1. Get API key from https://makersuite.google.com/app/apikey")
        print("   2. Add GEMINI_API_KEY=your_key_here to new-backend/.env")
        print("   3. Run this test again")
    else:
        try:
            print("Generating test personality...")
            personality = generate_personality(
                "Create a helpful AI assistant personality",
                {}
            )
            print(f"✅ Generated personality:")
            print(f"{personality[:200]}...")
            print(f"\n✅ Gemini service works! (Generated {len(personality)} characters)")
            
        except Exception as e:
            print(f"❌ Error: {e}")

