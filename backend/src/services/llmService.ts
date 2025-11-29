import axios from 'axios'

const OPEN_ROUTER_BASE_URL = 'https://openrouter.io/api/v1'
const DEFAULT_MODEL = 'openai/gpt-3.5-turbo'

// Get API key dynamically - avoid reading at import time
function getApiKey(): string | undefined {
  return process.env.OPEN_ROUTER_API_KEY
}

// Get model - use provided model or fallback to default
function getModel(llmModel?: string): string {
  if (!llmModel) return DEFAULT_MODEL
  
  // Validate it's a known model, otherwise use default
  const knownModels = [
    'openai/gpt-3.5-turbo',
    'openai/gpt-4',
    'openai/gpt-4-turbo',
    'openai/gpt-4-vision',
    'anthropic/claude-2',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-sonnet',
    'meta-llama/llama-2-7b-chat',
    'meta-llama/llama-2-13b-chat',
    'microsoft/wizardlm-2-8x22b',
    'google/palm-2-chat-bison',
    'together-ai/togethercomputer/llama-2-7b-chat',
    'huggingfaceh4/zephyr-7b-beta'
  ]
  
  // If model contains :free, try to remove it and find the base model
  let normalizedModel = llmModel
  if (llmModel.includes(':free')) {
    normalizedModel = llmModel.replace(':free', '')
  }
  
  console.log(`🔧 [Model Validation] Input: ${llmModel}, Normalized: ${normalizedModel}`)
  
  if (knownModels.includes(normalizedModel)) {
    console.log(`✅ [Model Validation] Using ${normalizedModel}`)
    return normalizedModel
  }
  
  console.log(`⚠️  [Model Validation] Unknown model ${llmModel}, falling back to ${DEFAULT_MODEL}`)
  return DEFAULT_MODEL
}

// Log on startup to debug
setTimeout(() => {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('⚠️  [LLM Service] No Open Router API key configured - will use demo mode')
  } else {
    console.log('✅ [LLM Service] Open Router API key loaded successfully')
  }
}, 100)

interface AgentPersonality {
  name: string
  description: string
  traits: string[]
  expertise: string[]
  tone: string
}

// Define different agent personalities
const AGENT_PERSONALITIES: Record<string, AgentPersonality> = {
  codemaster: {
    name: 'CodeMaster',
    description: 'Expert software developer and code reviewer',
    traits: ['precise', 'logical', 'detail-oriented', 'helpful'],
    expertise: ['Python', 'JavaScript', 'TypeScript', 'Rust', 'Code optimization'],
    tone: 'professional and encouraging'
  },
  datawizard: {
    name: 'DataWizard',
    description: 'Data science and analytics specialist',
    traits: ['analytical', 'methodical', 'creative', 'thorough'],
    expertise: ['Data Analysis', 'SQL', 'Statistics', 'Machine Learning', 'Visualization'],
    tone: 'insightful and explanatory'
  },
  designer: {
    name: 'DesignThinker',
    description: 'UX/UI design and creative problem solver',
    traits: ['creative', 'empathetic', 'innovative', 'collaborative'],
    expertise: ['UI/UX Design', 'User Research', 'Design Systems', 'Accessibility', 'Branding'],
    tone: 'inspiring and collaborative'
  },
  devops: {
    name: 'DevOpsGuru',
    description: 'Infrastructure and DevOps specialist',
    traits: ['systematic', 'reliable', 'security-focused', 'proactive'],
    expertise: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'System Administration'],
    tone: 'confident and practical'
  }
}

export async function queryAgent(
  personaPrompt: string,
  skills: string[],
  query: string,
  llmModel?: string
): Promise<string> {
  const apiKey = getApiKey()
  const model = getModel(llmModel)
  
  // Demo mode if no API key
  if (!apiKey) {
    console.log('📋 [Demo Mode] No Open Router API key - returning mock response')
    return `[Demo Mode] As an agent with skills in ${skills.join(', ')}, I would help you with: ${query}. My expertise includes ${personaPrompt}.`
  }

  try {
    console.log(`🤖 [Open Router] Querying model: ${model}...`)

    const systemPrompt = `You are an AI agent with the following persona: ${personaPrompt}.
Your core skills are: ${skills.join(', ')}.
Respond directly and helpfully based on your skills and persona. Keep responses concise (2-3 sentences).`

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
    }

    console.log('📤 Full Request body:', JSON.stringify(requestBody, null, 2))
    console.log(`📤 Using model: "${model}"`)
    console.log(`📤 API URL: ${OPEN_ROUTER_BASE_URL}/chat/completions`)
    console.log(`📤 Headers: Content-Type: application/json, Authorization: Bearer [hidden]`)

    try {
      const response = await axios.post(`${OPEN_ROUTER_BASE_URL}/chat/completions`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.REFERRER_URL || 'https://agents-hub.example.com',
          'X-Title': 'Agents Hub'
        },
        timeout: 30000
      })

      console.log(`📥 Response status: ${response.status}`)
      console.log(`📥 Response data:`, response.data)

      const responseText = response.data.choices?.[0]?.message?.content

      if (!responseText) {
        throw new Error('No response content from Open Router')
      }

      console.log(`✅ Agent response generated (${responseText.length} chars)`)
      return responseText
    } catch (axiosError: any) {
      if (axiosError.response) {
        // The request was made and the server responded with a status code outside 2xx
        console.log(`❌ Error response status: ${axiosError.response.status}`)
        console.log(`❌ Error response statusText: ${axiosError.response.statusText}`)
        console.log(`❌ Error response data:`, axiosError.response.data)
        console.log(`❌ Error response headers:`, axiosError.response.headers)
        
        const errorMsg = axiosError.response.data?.error?.message || 
                        JSON.stringify(axiosError.response.data) || 
                        axiosError.response.statusText
        
        throw new Error(`Open Router API error: ${axiosError.response.status} ${axiosError.response.statusText} - ${errorMsg}`)
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.log(`❌ No response received from Open Router`)
        console.log(`❌ Request:`, axiosError.request)
        throw new Error(`Open Router API error: No response received`)
      } else {
        // Something happened in setting up the request
        console.log(`❌ Error setting up request:`, axiosError.message)
        throw new Error(`Open Router API error: ${axiosError.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Open Router API error:', error)
    return `Error querying agent: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Get a predefined agent personality by type
 */
export function getAgentPersonality(agentType: string): AgentPersonality {
  return AGENT_PERSONALITIES[agentType.toLowerCase()] || AGENT_PERSONALITIES.codemaster
}

/**
 * Generate a persona prompt from agent metadata
 */
export function generatePersonaPrompt(agentName: string, skills: string[]): string {
  const agentType = agentName.toLowerCase().replace(/[^a-z]/g, '')
  const personality = getAgentPersonality(agentType)

  return `You are ${personality.name}, a ${personality.description}. 
Your personality traits: ${personality.traits.join(', ')}. 
Approach conversations in a ${personality.tone} manner.`
}
