/**
 * API Client Service
 * 
 * Handles all communication with the Python FastAPI backend
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface AgentData {
  asset_id: string;
  name?: string;
  purpose?: string;
  instructions?: string;
  personality?: string;
  skills?: string[];
  llm_model?: string;
  generation?: number;
  xp?: number;
  breed_count?: number;
  brain_cid?: string;
  genetic_hash?: string;
  masumi_did?: string;
  parents?: string[];
  mint_tx_hash?: string;
}

/**
 * Fetch agent data by asset ID
 * 
 * @param assetId - Cardano asset ID (User Token 222)
 * @returns AgentData with full metadata (snake_case format)
 */
export async function fetchAgent(assetId: string): Promise<AgentData> {
  try {
    console.log(`🔍 [API] Fetching agent data for asset_id: ${assetId.substring(0, 30)}...`);
    
    const response = await fetch(`${API_URL}/api/agents/${assetId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      console.error(`❌ [API] Failed to fetch agent: ${errorData.detail || response.statusText}`);
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [API] Fetched agent data for ${assetId.substring(0, 30)}...`);
    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("Failed to connect to backend API. Make sure the server is running on " + API_URL);
    }
    throw error;
  }
}

/**
 * Health check - verify backend is running
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === "ok" || data.status === "healthy";
  } catch (error) {
    console.error("❌ [API] Backend health check failed:", error);
    return false;
  }
}

// Chat API Types
export interface ChatRequest {
  agent_asset_id: string;
  message: string;
  session_id?: string;
  context?: ChatContext;
  user_address?: string;
}

export interface ChatContext {
  max_history?: number;
  temperature?: number;
}

export interface ChatResponse {
  session_id: string;
  message_id: string;
  response: string;
  agent_asset_id: string;
  agent_name: string;
  timestamp: string;
  metadata: {
    model_used: string;
    response_time: number;
  };
}

export interface ConversationSession {
  session_id: string;
  agent_asset_id: string;
  user_address?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  agent_asset_id?: string;
  metadata?: any;
}

export interface ChatHistoryResponse {
  session: ConversationSession;
  messages: ChatMessage[];
  total: number;
  has_more: boolean;
}

/**
 * Send a message to an agent
 */
export async function sendChatMessage(
  agentAssetId: string,
  message: string,
  sessionId?: string,
  context?: ChatContext,
  userAddress?: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_URL}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_asset_id: agentAssetId,
        message,
        session_id: sessionId,
        user_address: userAddress,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("Failed to connect to backend API. Make sure the server is running on " + API_URL);
    }
    throw error;
  }
}

/**
 * Get chat sessions
 */
export async function getChatSessions(
  agentAssetId?: string,
  userAddress?: string
): Promise<ConversationSession[]> {
  try {
    const params = new URLSearchParams();
    if (agentAssetId) params.append("agent_asset_id", agentAssetId);
    if (userAddress) params.append("user_address", userAddress);

    const response = await fetch(`${API_URL}/api/chat/sessions?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("Failed to connect to backend API. Make sure the server is running on " + API_URL);
    }
    throw error;
  }
}

/**
 * Get chat history for a session with pagination
 */
export async function getChatHistory(
  sessionId: string,
  limit: number = 10,
  offset: number = 0
): Promise<ChatHistoryResponse> {
  try {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const response = await fetch(`${API_URL}/api/chat/sessions/${sessionId}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("Failed to connect to backend API. Make sure the server is running on " + API_URL);
    }
    throw error;
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  agentAssetId: string,
  userAddress?: string
): Promise<{ session_id: string; created_at: string }> {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_asset_id: agentAssetId,
        user_address: userAddress,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("Failed to connect to backend API. Make sure the server is running on " + API_URL);
    }
    throw error;
  }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(
  sessionId: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_URL}/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("Failed to connect to backend API. Make sure the server is running on " + API_URL);
    }
    throw error;
  }
}

// Breeding API Types
export interface BreedAgentsRequest {
  parent_a_asset_id: string;
  parent_b_asset_id: string;
  child_name: string;
  trait_balance: number;  // 0-100, kept in schema but NOT used in LLM calls
  custom_instructions?: string;
  predicted_skills: string[];
}

export interface BreedAgentsResponse {
  ipfs_hash: string;
  child_text: string;  // Child personality (for backward compatibility)
  masumi_did: string;
  parent_a_personality: string;
  parent_b_personality: string;
  // Additional fields for complete child data
  child_purpose: string;
  child_instructions: string;
  child_skills: string[];
  child_llm_model: string;
}

/**
 * Breed two agents
 * 
 * @param parentA_assetId - Parent A's asset ID
 * @param parentB_assetId - Parent B's asset ID
 * @param childName - User-entered child name
 * @param traitBalance - Trait balance (0-100, UI only, not used in LLM)
 * @param customInstructions - Custom breeding instructions (optional)
 * @param predictedSkills - Predicted child skills from compatibility calculation
 * @returns BreedAgentsResponse with complete child data
 */
export async function breedAgents(
  parentA_assetId: string,
  parentB_assetId: string,
  childName: string,
  traitBalance: number = 50,
  customInstructions?: string,
  predictedSkills: string[] = []
): Promise<BreedAgentsResponse> {
  try {
    console.log(`🔍 [API] Breeding agents: ${parentA_assetId.substring(0, 10)}... and ${parentB_assetId.substring(0, 10)}...`);
    console.log(`   Child name: ${childName}`);
    console.log(`   Trait balance: ${traitBalance}% A / ${100 - traitBalance}% B (UI only, not used in LLM)`);
    console.log(`   Predicted skills: ${predictedSkills.length} skills`);
    
    const response = await fetch(`${API_URL}/api/breed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent_a_asset_id: parentA_assetId,
        parent_b_asset_id: parentB_assetId,
        child_name: childName,
        trait_balance: traitBalance,
        custom_instructions: customInstructions || null,
        predicted_skills: predictedSkills
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      console.error(`❌ [API] Failed to breed agents: ${errorData.detail || response.statusText}`);
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [API] Breeding successful: ${data.ipfs_hash.substring(0, 10)}...`);
    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("Failed to connect to backend API. Make sure the server is running on " + API_URL);
    }
    throw error;
  }
}

