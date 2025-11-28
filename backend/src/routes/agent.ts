import { Router } from 'express'
import { QueryRequest } from '../types/index.js'
import { queryAgent, generatePersonaPrompt } from '../services/llmService.js'
import { getTokenInfo } from '../services/cardanoService.js'

const router = Router()

/**
 * GET /api/agent/:tokenId
 * Get agent metadata by token ID
 */
router.get('/agent/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params

    // In production, fetch from database or chain
    const tokenInfo = await getTokenInfo(tokenId)

    if (!tokenInfo) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    res.json(tokenInfo)
  } catch (error) {
    console.error('Agent fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch agent' })
  }
})

/**
 * POST /api/agent/query
 * Query an agent using LLM (Open Router + Grok 4.1)
 */
router.post('/agent/query', async (req, res) => {
  try {
    const { tokenId, query, personaPrompt, skills, agentName }: QueryRequest & { agentName?: string } = req.body

    if (!query || !skills || skills.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: query and skills array' })
    }

    console.log(`\n🤖 [Agent Query] Agent: ${tokenId || agentName || 'Unknown'}`)
    console.log(`   Query: "${query.substring(0, 50)}..."`)
    console.log(`   Skills: ${skills.join(', ')}`)

    // Use provided persona prompt or generate one
    const persona = personaPrompt || generatePersonaPrompt(agentName || tokenId || 'Agent', skills)

    const response = await queryAgent(persona, skills, query)

    console.log(`✅ [Agent Response] Received ${response.length} characters\n`)

    res.json({ 
      response, 
      tokenId, 
      agentName,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Agent query error:', error)
    res.status(500).json({ error: 'Failed to query agent' })
  }
})

/**
 * GET /api/agents
 * List all agents (optional for demo)
 */
router.get('/agents', async (req, res) => {
  try {
    const { owner } = req.query

    // Mock data for demo
    const mockAgents = [
      {
        id: '1',
        tokenId: 'agent001',
        name: 'CodeMaster Alpha',
        skills: ['Python', 'JavaScript', 'Debugging', 'Code Review'],
        generation: 0,
        ownerAddress: owner || 'addr_test1...'
      },
      {
        id: '2',
        tokenId: 'agent002',
        name: 'DataWizard Beta',
        skills: ['Data Analysis', 'SQL', 'Statistics', 'Visualization'],
        generation: 0,
        ownerAddress: owner || 'addr_test1...'
      }
    ]

    res.json({ agents: mockAgents })
  } catch (error) {
    console.error('Agents list error:', error)
    res.status(500).json({ error: 'Failed to fetch agents' })
  }
})

/**
 * GET /api/agents/configs
 * Load agent configurations from the agents directory
 * Note: This endpoint returns empty since agents are user-created, not predefined
 */
router.get('/agents/configs', async (req, res) => {
  try {
    // Since agents are user-created and not predefined,
    // this endpoint returns empty configurations
    const configs: { [key: string]: any } = {}

    console.log('📊 No predefined agent configurations (agents are user-created)')
    res.json(configs)
  } catch (error) {
    console.error('❌ Agent configs loading error:', error)
    res.status(500).json({ error: 'Failed to load agent configurations' })
  }
})

export default router
