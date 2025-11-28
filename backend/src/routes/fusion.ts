import { Router } from 'express'
import { FusionRequest, FusionResult } from '../types/index.js'
import { fuseAgents } from '../services/fusionEngine.js'
import { pinToIPFS } from '../services/ipfsService.js'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Load agents from storage
const AGENTS_FILE = path.join(__dirname, '../../data/agents.json')
async function loadAgentsFromStorage() {
  try {
    const data = await fs.readFile(AGENTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.log('⚠️  No agents file found')
    return []
  }
}

// Save agents to storage
async function saveAgentsToStorage(agents: any[]) {
  try {
    await fs.mkdir(path.dirname(AGENTS_FILE), { recursive: true })
    await fs.writeFile(AGENTS_FILE, JSON.stringify(agents, null, 2))
    console.log(`💾 Saved ${agents.length} agents to storage`)
  } catch (error) {
    console.error('❌ Failed to save agents:', error)
  }
}

/**
 * POST /api/fuse
 * Fuse two parent agents into a child agent
 */
router.post('/fuse', async (req, res) => {
  try {
    const { parentA_token, parentB_token, seed, ownerAddress }: FusionRequest & { ownerAddress?: string } = req.body

    if (!parentA_token || !parentB_token || !seed) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (parentA_token === parentB_token) {
      return res.status(400).json({ error: 'Parent agents must be different' })
    }

    // Load agents from storage
    const agents = await loadAgentsFromStorage()
    
    // Find parent agents by tokenId
    const parentA = agents.find((a: any) => a.tokenId === parentA_token)
    const parentB = agents.find((a: any) => a.tokenId === parentB_token)

    if (!parentA || !parentB) {
      return res.status(404).json({ error: 'Parent agent not found' })
    }

    console.log(`🧬 Fusing: ${parentA.name} + ${parentB.name}`)

    // Convert agent format to AgentMetadata format expected by fusionEngine
    const parentAMetadata = {
      name: parentA.name,
      skills: parentA.skills || [],
      personaPrompt: parentA.personality || parentA.purpose || '',
      generation: parentA.generation || 0,
      geneticHash: parentA.geneticHash || `hash_${parentA.tokenId}`,
      ownerAddress: parentA.owner,
      tokenId: parentA.tokenId
    }

    const parentBMetadata = {
      name: parentB.name,
      skills: parentB.skills || [],
      personaPrompt: parentB.personality || parentB.purpose || '',
      generation: parentB.generation || 0,
      geneticHash: parentB.geneticHash || `hash_${parentB.tokenId}`,
      ownerAddress: parentB.owner,
      tokenId: parentB.tokenId
    }

    // Execute fusion logic
    const childMetadata = fuseAgents(parentAMetadata, parentBMetadata, seed)

    // Pin metadata to IPFS
    const ipfsCid = await pinToIPFS(childMetadata)
    childMetadata.ipfsCid = ipfsCid

    const result: FusionResult = {
      ipfsCid,
      geneticHash: childMetadata.geneticHash,
      metadata: childMetadata
    }

    console.log(`✅ Fusion complete: ${childMetadata.name} (${ipfsCid})`)

    // Save child agent to storage
    if (ownerAddress) {
      const childAgent = {
        id: Date.now().toString(),
        tokenId: `child_${childMetadata.geneticHash.substring(0, 8)}`,
        name: childMetadata.name,
        purpose: childMetadata.personaPrompt,
        instructions: 'Fusion of parent agents',
        personality: childMetadata.personaPrompt,
        skills: childMetadata.skills,
        llmModel: 'x-ai/grok-4.1-fast:free',
        generation: childMetadata.generation,
        owner: ownerAddress,
        ipfsCid,
        imageUrl: '👶',
        createdAt: new Date().toISOString(),
        parents: childMetadata.parents || [],
        geneticHash: childMetadata.geneticHash,
        minted: false,
        txHash: ''
      }

      agents.push(childAgent)
      await saveAgentsToStorage(agents)
      console.log(`👶 Child agent saved: ${childAgent.name}`)
    }

    res.json(result)
  } catch (error) {
    console.error('Fusion error:', error)
    res.status(500).json({ error: 'Fusion failed' })
  }
})

/**
 * POST /api/pin
 * Pin arbitrary JSON to IPFS
 */
router.post('/pin', async (req, res) => {
  try {
    const metadata = req.body

    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({ error: 'Invalid metadata' })
    }

    const ipfsCid = await pinToIPFS(metadata)

    res.json({ ipfsCid })
  } catch (error) {
    console.error('Pin error:', error)
    res.status(500).json({ error: 'Failed to pin to IPFS' })
  }
})

/**
 * POST /api/submit-breeding-tx
 * Submit a signed breeding transaction to Blockfrost
 */
router.post('/submit-breeding-tx', async (req, res) => {
  try {
    const { signedTx, geneticHash } = req.body

    if (!signedTx) {
      return res.status(400).json({ error: 'Missing signed transaction' })
    }

    // Get network config from Blockfrost key
    const blockfrostKey = process.env.BLOCKFROST_PROJECT_ID
    if (!blockfrostKey) {
      console.warn('⚠️  No Blockfrost key - demo mode')
      return res.json({ 
        txHash: `mock_tx_${Date.now()}`, 
        status: 'demo_mode',
        network: 'demo'
      })
    }

    // Determine network from key prefix
    let network = 'mainnet'
    if (blockfrostKey.startsWith('preprod')) {
      network = 'preprod'
    } else if (blockfrostKey.startsWith('preview')) {
      network = 'preview'
    }

    const blockfrostUrl = `https://cardano-${network}.blockfrost.io/api/v0`

    console.log(`📤 Submitting breeding transaction to ${network}...`)

    // Submit signed transaction to Blockfrost
    try {
      const response = await axios.post(
        `${blockfrostUrl}/tx/submit`,
        signedTx,
        {
          headers: {
            'Content-Type': 'application/cbor',
            'project_id': blockfrostKey
          }
        }
      )

      const txHash = response.data
      console.log(`✅ Breeding TX submitted: ${txHash}`)

      // Update child agent with tx hash
      const agents = await loadAgentsFromStorage()
      const childAgent = agents.find((a: any) => a.geneticHash?.substring(0, 8) === geneticHash?.substring(0, 8))
      if (childAgent) {
        childAgent.txHash = txHash
        childAgent.minted = 'pending'
        await saveAgentsToStorage(agents)
      }

      res.json({
        txHash,
        status: 'submitted',
        network,
        explorerUrl: `https://${network}.cardanoscan.io/transaction/${txHash}`
      })
    } catch (blockfrostError: any) {
      if (blockfrostError.response?.status === 400) {
        const errorData = blockfrostError.response.data
        console.error('❌ Transaction submission failed:', errorData)
        return res.status(400).json({
          error: 'Transaction submission failed',
          details: errorData
        })
      }
      throw blockfrostError
    }
  } catch (error) {
    console.error('Submission error:', error)
    res.status(500).json({ error: 'Failed to submit transaction' })
  }
})

/**
 * GET /api/tx-status/:txHash
 * Check transaction status on Blockfrost
 */
router.get('/tx-status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params

    const blockfrostKey = process.env.BLOCKFROST_PROJECT_ID
    if (!blockfrostKey) {
      // Demo mode - always return confirmed after a few checks
      return res.json({ confirmed: Math.random() > 0.3 })
    }

    // Determine network from key prefix
    let network = 'mainnet'
    if (blockfrostKey.startsWith('preprod')) {
      network = 'preprod'
    } else if (blockfrostKey.startsWith('preview')) {
      network = 'preview'
    }

    const blockfrostUrl = `https://cardano-${network}.blockfrost.io/api/v0`

    try {
      const response = await axios.get(`${blockfrostUrl}/txs/${txHash}`, {
        headers: { 'project_id': blockfrostKey }
      })

      const txData = response.data
      console.log(`✅ TX ${txHash.substring(0, 8)}... confirmed with ${txData.output_amount.length} outputs`)

      res.json({
        confirmed: true,
        block: txData.block,
        blockHeight: txData.block_height,
        blockTime: txData.block_time,
        outputAmount: txData.output_amount
      })
    } catch (blockfrostError: any) {
      if (blockfrostError.response?.status === 404) {
        // Transaction not yet in blockchain
        return res.json({ confirmed: false })
      }
      throw blockfrostError
    }
  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({ error: 'Failed to check transaction status' })
  }
})

export default router
