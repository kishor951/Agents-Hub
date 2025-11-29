import { Router } from 'express'
import { QueryRequest } from '../types/index.js'
import { queryAgent, generatePersonaPrompt } from '../services/llmService.js'
import { getTokenInfo, buildMintTransaction } from '../services/cardanoService.js'
import { 
  editAgent, 
  batchEditAgents, 
  updateAgentLLMModel,
  updateAgentSkills,
  addAgentSkill,
  removeAgentSkill,
  validateAgentData,
  getEditableFields
} from '../services/agentEditService.js'
import multer from 'multer'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import FormData from 'form-data'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Simple in-memory storage for agents (replace with database later if needed)
let agentsStore: any[] = []

// Load agents from file on startup
const AGENTS_FILE = path.join(__dirname, '../../data/agents.json')
async function loadAgents() {
  try {
    const data = await fs.readFile(AGENTS_FILE, 'utf-8')
    agentsStore = JSON.parse(data)
    console.log(`✅ Loaded ${agentsStore.length} agents from storage`)
  } catch (error) {
    console.log('📝 No existing agents file, starting fresh')
    agentsStore = []
  }
}

// Save agents to file
async function saveAgents() {
  try {
    await fs.mkdir(path.dirname(AGENTS_FILE), { recursive: true })
    await fs.writeFile(AGENTS_FILE, JSON.stringify(agentsStore, null, 2))
    console.log(`💾 Saved ${agentsStore.length} agents to storage`)
  } catch (error) {
    console.error('❌ Failed to save agents:', error)
  }
}

// Initialize agents on startup
loadAgents()

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
 * Query an agent using LLM (Open Router + selected model)
 */
router.post('/agent/query', async (req, res) => {
  try {
    const { tokenId, query, personaPrompt, skills, agentName, llmModel }: QueryRequest & { agentName?: string; llmModel?: string } = req.body

    console.log('\n🔧 [DEBUG] /api/agent/query received')
    console.log('🔧 [DEBUG] Request body:', JSON.stringify(req.body, null, 2))

    if (!query || !skills || skills.length === 0) {
      console.log('🔧 [DEBUG] Validation failed: missing query or skills')
      return res.status(400).json({ error: 'Missing required fields: query and skills array' })
    }

    console.log(`\n🤖 [Agent Query] Agent: ${tokenId || agentName || 'Unknown'}`)
    console.log(`   Query: "${query.substring(0, 50)}..."`)
    console.log(`   LLM Model: ${llmModel || 'undefined (will use default)'}`)
    console.log(`   Skills: ${skills.join(', ')}`)

    // Use provided persona prompt or generate one
    const persona = personaPrompt || generatePersonaPrompt(agentName || tokenId || 'Agent', skills)
    console.log(`   Persona: ${persona.substring(0, 50)}...`)

    console.log('🔧 [DEBUG] Calling queryAgent with llmModel:', llmModel)
    const response = await queryAgent(persona, skills, query, llmModel)

    console.log(`✅ [Agent Response] Received ${response.length} characters`)
    console.log(`✅ [Response Preview] ${response.substring(0, 100)}...`)

    res.json({ 
      response, 
      tokenId, 
      agentName,
      llmModel,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Agent query error:', error)
    console.log('🔧 [DEBUG] Error stack:', (error as any)?.stack)
    res.status(500).json({ error: 'Failed to query agent', details: (error as any)?.message })
  }
})

/**
 * POST /api/agents/create
 * Create a new agent with IPFS upload
 */
router.post('/agents/create', upload.single('picture'), async (req, res) => {
  try {
    const { name, purpose, instructions, personality, skills, llmModel, owner } = req.body
    const picture = req.file

    console.log(`\n🤖 [Create Agent] Name: ${name}`)
    console.log(`   Owner: ${owner}`)
    console.log(`   Picture: ${picture ? 'Yes' : 'No'}`)

    // Step 1: Validate
    if (!name || !purpose || !instructions || !owner) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Step 2: Upload to IPFS (Pinata)
    let ipfsCid = null
    let imageIpfsCid = null

    try {
      const PINATA_API_KEY = process.env.PINATA_API_KEY
      const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY

      // Upload image if provided
      if (picture && PINATA_API_KEY) {
        const imageForm = new FormData()
        imageForm.append('file', picture.buffer, {
          filename: picture.originalname,
          contentType: picture.mimetype
        })

        const imageRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', imageForm, {
          headers: {
            ...imageForm.getHeaders(),
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY
          }
        })

        imageIpfsCid = imageRes.data.IpfsHash
        console.log(`📤 [IPFS] Image uploaded: ${imageIpfsCid}`)
      }

      // Upload metadata
      if (PINATA_API_KEY) {
        const metadata = {
          name,
          purpose,
          instructions,
          personality,
          skills: skills ? skills.split(',').map((s: string) => s.trim()) : [],
          llmModel,
          image: imageIpfsCid ? `ipfs://${imageIpfsCid}` : undefined,
          created: new Date().toISOString()
        }

        const metadataRes = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY
          }
        })

        ipfsCid = metadataRes.data.IpfsHash
        console.log(`📤 [IPFS] Metadata uploaded: ${ipfsCid}`)
      } else {
        console.log('⚠️  [IPFS] No Pinata keys - skipping upload (demo mode)')
        ipfsCid = `mock_cid_${Date.now()}`
      }
    } catch (ipfsError) {
      console.error('❌ [IPFS] Upload failed:', ipfsError)
      // Continue without IPFS for demo
      ipfsCid = `mock_cid_${Date.now()}`
    }

    // Step 3: Save agent
    const agentId = Date.now().toString()
    const tokenId = `agent_${owner.substring(0, 8)}_${Date.now()}`
    
    const newAgent: any = {
      id: agentId,
      tokenId,
      name,
      purpose,
      instructions,
      personality,
      skills: skills ? skills.split(',').map((s: string) => s.trim()) : [],
      llmModel,
      generation: 1,
      owner,
      ipfsCid,
      imageIpfsCid,
      imageUrl: imageIpfsCid ? `https://gateway.pinata.cloud/ipfs/${imageIpfsCid}` : undefined,
      createdAt: new Date().toISOString(),
      minted: false,
      txHash: ''
    }

    agentsStore.push(newAgent)
    await saveAgents()

    console.log(`✅ [Create Agent] Saved agent: ${newAgent.id}`)

    // Step 4: Build mint transaction for the agent (creation = instant NFT)
    let mintTxData = null
    let mintError = null
    try {
      // Compute genetic hash for agent (hash of metadata)
      const geneticData = {
        name,
        purpose,
        instructions,
        personality,
        skills: skills ? skills.split(',').map((s: string) => s.trim()) : [],
        llmModel,
        timestamp: newAgent.createdAt
      }
      const geneticHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(geneticData))
        .digest('hex')
        .substring(0, 16)

      console.log(`🧬 [Genetic Hash] ${geneticHash}`)

      // Build mint transaction for this agent
      mintTxData = await buildMintTransaction(
        owner,
        ipfsCid || `mock_cid_${Date.now()}`,
        geneticHash,
        [tokenId, tokenId] // Parent references (self-created agents)
      )

      console.log(`💳 [Mint TX] Built: ${mintTxData.txHash}`)

      // Store transaction info with agent
      newAgent.txHash = mintTxData.txHash
      await saveAgents()
    } catch (txError: any) {
      console.error('⚠️  [Mint TX] Failed to build transaction:', txError)
      mintError = txError.message || 'Failed to build mint transaction'
      // Continue - agent is still saved, user can try again with funds
      mintTxData = null
    }

    console.log(`✅ [Create Agent] Complete! Agent ID: ${newAgent.id}`)

    res.json({ 
      success: true, 
      agent: newAgent,
      ipfsCid,
      imageIpfsCid,
      mintTx: mintTxData ? {
        unsignedTx: mintTxData.unsignedTx,
        txHash: mintTxData.txHash,
        message: 'Sign this transaction to mint your agent as an NFT'
      } : null,
      mintError: mintError // Send error info to frontend
    })
  } catch (error) {
    console.error('❌ [Create Agent] Error:', error)
    res.status(500).json({ error: 'Failed to create agent' })
  }
})

/**
 * DELETE /api/agents/:id
 * Remove an agent from local storage (does not burn on-chain NFTs)
 */
router.delete('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params
    const ownerFromRequest = (req.body && req.body.owner) || (typeof req.query.owner === 'string' ? req.query.owner : undefined)

    if (!id) {
      return res.status(400).json({ error: 'Agent id is required' })
    }

    const agentIndex = agentsStore.findIndex(agent => agent.id === id)

    if (agentIndex === -1) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    const agent = agentsStore[agentIndex]

    if (ownerFromRequest && agent.owner !== ownerFromRequest) {
      return res.status(403).json({ error: 'Owner mismatch - cannot delete this agent' })
    }

    agentsStore.splice(agentIndex, 1)
    await saveAgents()

    console.log(`🗑️  [Delete Agent] Removed agent ${id}${agent.minted ? ' (minted on-chain)' : ''}`)

    res.json({
      success: true,
      message: 'Agent removed from local storage',
      agent,
    })
  } catch (error) {
    console.error('❌ [Delete Agent] Error:', error)
    res.status(500).json({ error: 'Failed to delete agent' })
  }
})

/**
 * POST /api/agents/:id/mint-complete
 * Update agent with final mint transaction hash
 */
router.post('/agents/:id/mint-complete', async (req, res) => {
  try {
    const { id } = req.params
    const { txHash } = req.body

    if (!txHash) {
      return res.status(400).json({ error: 'txHash is required' })
    }

    console.log(`\n✅ [Mint Complete] Agent: ${id}`)
    console.log(`   TX Hash: ${txHash}`)

    // Find agent
    const agent = agentsStore.find(a => a.id === id)
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    // Update agent with minting info
    agent.minted = true
    agent.txHash = txHash
    agent.mintedAt = new Date().toISOString()

    // Save to storage
    await saveAgents()

    console.log(`💾 [Mint Complete] Agent ${id} marked as minted`)
    console.log(`   TX Hash: ${txHash}`)

    res.json({ 
      success: true,
      agent
    })
  } catch (error) {
    console.error('❌ [Mint Complete] Error:', error)
    res.status(500).json({ error: 'Failed to update agent mint status' })
  }
})

/**
 * GET /api/agents
 * List all agents (optional for demo)
 */
router.get('/agents', async (req, res) => {
  try {
    const { owner } = req.query

    // Filter agents by owner if provided
    const filteredAgents = owner 
      ? agentsStore.filter(agent => agent.owner === owner)
      : agentsStore

    console.log(`📋 [List Agents] Returning ${filteredAgents.length} agents${owner ? ` for owner ${owner}` : ''}`)

    res.json({ agents: filteredAgents })
  } catch (error) {
    console.error('❌ Agents list error:', error)
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

/**
 * PUT /api/agents/:agentId
 * Update agent properties (e.g., LLM model)
 */
router.put('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params
    const { llmModel } = req.body

    console.log('\n🔧 [DEBUG] PUT /api/agents/:agentId received')
    console.log('🔧 [DEBUG] agentId:', agentId)
    console.log('🔧 [DEBUG] llmModel:', llmModel)
    console.log('🔧 [DEBUG] Agents store size:', agentsStore.length)

    if (!llmModel) {
      console.log('🔧 [DEBUG] Validation failed: missing llmModel')
      return res.status(400).json({ error: 'Missing required field: llmModel' })
    }

    // Find and update agent
    const agentIndex = agentsStore.findIndex(a => a.id === agentId)
    
    console.log('🔧 [DEBUG] Found agent at index:', agentIndex)
    
    if (agentIndex === -1) {
      console.log('🔧 [DEBUG] Agent not found in store')
      console.log('🔧 [DEBUG] Available agent IDs:', agentsStore.map(a => a.id))
      return res.status(404).json({ error: 'Agent not found' })
    }

    const oldModel = agentsStore[agentIndex].llmModel
    console.log(`🔧 [DEBUG] Updating agent ${agentId}:`, { from: oldModel, to: llmModel })
    
    agentsStore[agentIndex].llmModel = llmModel
    await saveAgents()

    console.log(`✅ [Update Agent] ${agentId}: Model changed from ${oldModel} to ${llmModel}`)

    res.json({ 
      success: true,
      agent: agentsStore[agentIndex],
      message: `LLM model updated from ${oldModel} to ${llmModel}`
    })
  } catch (error) {
    console.error('❌ Agent update error:', error)
    console.log('🔧 [DEBUG] Error stack:', (error as any)?.stack)
    res.status(500).json({ error: 'Failed to update agent', details: (error as any)?.message })
  }
})

/**
 * PATCH /api/agents/:agentId/edit
 * Edit agent properties (name, skills, llmModel, personality, etc.)
 */
router.patch('/agents/:agentId/edit', async (req, res) => {
  try {
    const { agentId } = req.params
    const updates = req.body

    console.log(`\n✏️  [Edit Agent] Agent: ${agentId}`)
    console.log(`✏️  [Edit Agent] Updates:`, JSON.stringify(updates, null, 2))

    // Validate the update data
    const validation = validateAgentData(updates)
    if (!validation.valid) {
      console.log('❌ [Edit Agent] Validation failed:', validation.errors)
      return res.status(400).json({ 
        error: 'Invalid agent data', 
        details: validation.errors 
      })
    }

    // Apply edits using the service function
    const updatedAgent = await editAgent(agentsStore, agentId, updates)

    if (!updatedAgent) {
      console.log('❌ [Edit Agent] Agent not found')
      return res.status(404).json({ error: 'Agent not found' })
    }

    // Save changes to file
    await saveAgents()

    console.log(`✅ [Edit Agent] Successfully updated agent ${agentId}`)

    res.json({
      success: true,
      agent: updatedAgent,
      message: 'Agent updated successfully'
    })
  } catch (error) {
    console.error('❌ [Edit Agent] Error:', error)
    res.status(500).json({ 
      error: 'Failed to edit agent', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

/**
 * PATCH /api/agents/:agentId/llm-model
 * Update only the LLM model
 */
router.patch('/agents/:agentId/llm-model', async (req, res) => {
  try {
    const { agentId } = req.params
    const { llmModel } = req.body

    if (!llmModel) {
      return res.status(400).json({ error: 'LLM model is required' })
    }

    console.log(`\n🤖 [Update LLM] Agent: ${agentId}, Model: ${llmModel}`)

    const updatedAgent = await updateAgentLLMModel(agentsStore, agentId, llmModel)

    if (!updatedAgent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    await saveAgents()

    res.json({
      success: true,
      agent: updatedAgent,
      message: `LLM model updated to ${llmModel}`
    })
  } catch (error) {
    console.error('❌ [Update LLM] Error:', error)
    res.status(500).json({ error: 'Failed to update LLM model' })
  }
})

/**
 * PATCH /api/agents/:agentId/skills
 * Update agent skills
 */
router.patch('/agents/:agentId/skills', async (req, res) => {
  try {
    const { agentId } = req.params
    const { skills, action } = req.body // action: 'add', 'remove', 'replace'

    console.log(`\n⚡ [Update Skills] Agent: ${agentId}, Action: ${action}`)

    let updatedAgent = agentsStore.find(a => a.id === agentId)

    if (!updatedAgent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    if (action === 'add' && skills) {
      for (const skill of skills) {
        updatedAgent = await addAgentSkill(agentsStore, agentId, skill)
      }
    } else if (action === 'remove' && skills) {
      for (const skill of skills) {
        updatedAgent = await removeAgentSkill(agentsStore, agentId, skill)
      }
    } else if (action === 'replace' && skills) {
      updatedAgent = await updateAgentSkills(agentsStore, agentId, skills)
    }

    await saveAgents()

    res.json({
      success: true,
      agent: updatedAgent,
      message: `Skills ${action}ed successfully`
    })
  } catch (error) {
    console.error('❌ [Update Skills] Error:', error)
    res.status(500).json({ error: 'Failed to update skills' })
  }
})

/**
 * GET /api/agents/:agentId/edit-fields
 * Get all editable fields for an agent
 */
router.get('/agents/:agentId/edit-fields', async (req, res) => {
  try {
    const { agentId } = req.params

    const agent = agentsStore.find(a => a.id === agentId)

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    const editableFields = getEditableFields(agent)

    res.json({
      agentId,
      editableFields,
      availableLLMModels: [
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'openai/gpt-4', name: 'GPT-4' },
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
        { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
        { id: 'meta-llama/llama-2-7b-chat', name: 'Llama 2 7B' },
        { id: 'microsoft/wizardlm-2-8x22b', name: 'WizardLM 2' }
      ]
    })
  } catch (error) {
    console.error('❌ Error fetching edit fields:', error)
    res.status(500).json({ error: 'Failed to fetch edit fields' })
  }
})

export default router
