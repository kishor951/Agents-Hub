import { Router } from 'express'
import { QueryRequest } from '../types/index.js'
import { queryAgent, generatePersonaPrompt } from '../services/llmService.js'
import { getTokenInfo, buildMintTransaction } from '../services/cardanoService.js'
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
    } catch (txError) {
      console.error('⚠️  [Mint TX] Failed to build transaction:', txError)
      // Continue - user can still mint later
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
      } : null
    })
  } catch (error) {
    console.error('❌ [Create Agent] Error:', error)
    res.status(500).json({ error: 'Failed to create agent' })
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

export default router
