import { Router } from 'express'
import { QueryRequest } from '../types/index.js'
import { queryAgent } from '../services/llmService.js'
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
 * Query an agent using LLM
 */
router.post('/agent/query', async (req, res) => {
  try {
    const { tokenId, query, personaPrompt, skills }: QueryRequest = req.body

    if (!query || !personaPrompt || !skills) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log(`🤖 Querying agent ${tokenId}: "${query}"`)

    const response = await queryAgent(personaPrompt, skills, query)

    res.json({ response, tokenId })
  } catch (error) {
    console.error('Agent query error:', error)
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

export default router
