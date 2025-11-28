import fetch from 'node-fetch'

const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY
const OPEN_ROUTER_BASE_URL = 'https://openrouter.io/api/v1'
const DEFAULT_MODEL = 'x-ai/grok-4.1-fast:free'

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
  query: string
): Promise<string> {
  // Demo mode if no API key
  if (!OPEN_ROUTER_API_KEY) {
    console.log('📋 [Demo Mode] No Open Router API key - returning mock response')
    return `[Demo Mode] As an agent with skills in ${skills.join(', ')}, I would help you with: ${query}. My expertise includes ${personaPrompt}.`
  }

  try {
    console.log(`🤖 [Open Router] Querying Grok 4.1 Fast...`)

    const systemPrompt = `You are an AI agent with the following persona: ${personaPrompt}.
Your core skills are: ${skills.join(', ')}.
Respond directly and helpfully based on your skills and persona. Keep responses concise (2-3 sentences).`

    const response = await fetch(`${OPEN_ROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPEN_ROUTER_API_KEY}`,
        'HTTP-Referer': process.env.REFERRER_URL || 'https://agents-hub.example.com',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Open Router API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json() as any
    const responseText = data.choices?.[0]?.message?.content

    if (!responseText) {
      throw new Error('No response content from Open Router')
    }

    console.log(`✅ Agent response generated (${responseText.length} chars)`)
    return responseText
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
