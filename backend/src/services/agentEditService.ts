import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Agent {
  id: string
  name: string
  purpose: string
  instructions: string
  personality: string
  skills: string[]
  llmModel: string
  [key: string]: any
}

interface EditAgentRequest {
  name?: string
  purpose?: string
  instructions?: string
  personality?: string
  skills?: string[]
  llmModel?: string
}

/**
 * Edit agent properties
 */
export async function editAgent(
  agents: Agent[],
  agentId: string,
  updates: EditAgentRequest
): Promise<Agent | null> {
  const agentIndex = agents.findIndex(a => a.id === agentId)
  
  if (agentIndex === -1) {
    console.log(`❌ [Edit Agent] Agent not found: ${agentId}`)
    return null
  }

  const oldAgent = { ...agents[agentIndex] }
  const agent = agents[agentIndex]

  // Update fields if provided
  if (updates.name !== undefined) {
    console.log(`✏️  [Edit Agent] Name: "${agent.name}" → "${updates.name}"`)
    agent.name = updates.name
  }

  if (updates.purpose !== undefined) {
    console.log(`✏️  [Edit Agent] Purpose updated`)
    agent.purpose = updates.purpose
  }

  if (updates.instructions !== undefined) {
    console.log(`✏️  [Edit Agent] Instructions updated`)
    agent.instructions = updates.instructions
  }

  if (updates.personality !== undefined) {
    console.log(`✏️  [Edit Agent] Personality updated`)
    agent.personality = updates.personality
  }

  if (updates.skills !== undefined && Array.isArray(updates.skills)) {
    console.log(`✏️  [Edit Agent] Skills: [${oldAgent.skills.join(', ')}] → [${updates.skills.join(', ')}]`)
    agent.skills = updates.skills
  }

  if (updates.llmModel !== undefined) {
    console.log(`✏️  [Edit Agent] LLM Model: "${oldAgent.llmModel}" → "${updates.llmModel}"`)
    agent.llmModel = updates.llmModel
  }

  agent.updatedAt = new Date().toISOString()
  
  console.log(`✅ [Edit Agent] Agent ${agentId} updated successfully`)
  return agent
}

/**
 * Batch update multiple agents
 */
export async function batchEditAgents(
  agents: Agent[],
  updates: Array<{ agentId: string; changes: EditAgentRequest }>
): Promise<Array<{ agentId: string; success: boolean; agent?: Agent; error?: string }>> {
  const results = []

  for (const update of updates) {
    try {
      const agent = await editAgent(agents, update.agentId, update.changes)
      if (agent) {
        results.push({
          agentId: update.agentId,
          success: true,
          agent
        })
      } else {
        results.push({
          agentId: update.agentId,
          success: false,
          error: 'Agent not found'
        })
      }
    } catch (error) {
      results.push({
        agentId: update.agentId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

/**
 * Update LLM model for an agent
 */
export async function updateAgentLLMModel(
  agents: Agent[],
  agentId: string,
  llmModel: string
): Promise<Agent | null> {
  return editAgent(agents, agentId, { llmModel })
}

/**
 * Update skills for an agent
 */
export async function updateAgentSkills(
  agents: Agent[],
  agentId: string,
  skills: string[]
): Promise<Agent | null> {
  return editAgent(agents, agentId, { skills })
}

/**
 * Add a skill to an agent
 */
export async function addAgentSkill(
  agents: Agent[],
  agentId: string,
  skill: string
): Promise<Agent | null> {
  const agentIndex = agents.findIndex(a => a.id === agentId)
  if (agentIndex === -1) return null

  const agent = agents[agentIndex]
  if (!agent.skills.includes(skill)) {
    agent.skills.push(skill)
    agent.updatedAt = new Date().toISOString()
    console.log(`✅ [Add Skill] Added "${skill}" to agent ${agentId}`)
  }
  return agent
}

/**
 * Remove a skill from an agent
 */
export async function removeAgentSkill(
  agents: Agent[],
  agentId: string,
  skill: string
): Promise<Agent | null> {
  const agentIndex = agents.findIndex(a => a.id === agentId)
  if (agentIndex === -1) return null

  const agent = agents[agentIndex]
  agent.skills = agent.skills.filter(s => s !== skill)
  agent.updatedAt = new Date().toISOString()
  console.log(`✅ [Remove Skill] Removed "${skill}" from agent ${agentId}`)
  return agent
}

/**
 * Update agent name
 */
export async function updateAgentName(
  agents: Agent[],
  agentId: string,
  name: string
): Promise<Agent | null> {
  return editAgent(agents, agentId, { name })
}

/**
 * Update agent purpose
 */
export async function updateAgentPurpose(
  agents: Agent[],
  agentId: string,
  purpose: string
): Promise<Agent | null> {
  return editAgent(agents, agentId, { purpose })
}

/**
 * Update agent personality
 */
export async function updateAgentPersonality(
  agents: Agent[],
  agentId: string,
  personality: string
): Promise<Agent | null> {
  return editAgent(agents, agentId, { personality })
}

/**
 * Get all editable fields for an agent
 */
export function getEditableFields(agent: Agent): EditAgentRequest {
  return {
    name: agent.name,
    purpose: agent.purpose,
    instructions: agent.instructions,
    personality: agent.personality,
    skills: agent.skills,
    llmModel: agent.llmModel
  }
}

/**
 * Validate agent data
 */
export function validateAgentData(data: EditAgentRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (data.name !== undefined && typeof data.name !== 'string') {
    errors.push('Name must be a string')
  }
  if (data.name !== undefined && data.name.trim().length === 0) {
    errors.push('Name cannot be empty')
  }

  if (data.purpose !== undefined && typeof data.purpose !== 'string') {
    errors.push('Purpose must be a string')
  }

  if (data.instructions !== undefined && typeof data.instructions !== 'string') {
    errors.push('Instructions must be a string')
  }

  if (data.personality !== undefined && typeof data.personality !== 'string') {
    errors.push('Personality must be a string')
  }

  if (data.skills !== undefined) {
    if (!Array.isArray(data.skills)) {
      errors.push('Skills must be an array')
    } else if (data.skills.some(s => typeof s !== 'string')) {
      errors.push('All skills must be strings')
    }
  }

  if (data.llmModel !== undefined && typeof data.llmModel !== 'string') {
    errors.push('LLM Model must be a string')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
