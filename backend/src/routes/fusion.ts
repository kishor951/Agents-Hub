import { Router } from 'express'
import { FusionRequest, FusionResult } from '../types/index.js'
import { getParentMetadata, fuseAgents } from '../services/fusionEngine.js'
import { pinToIPFS } from '../services/ipfsService.js'

const router = Router()

/**
 * POST /api/fuse
 * Fuse two parent agents into a child agent
 */
router.post('/fuse', async (req, res) => {
  try {
    const { parentA_token, parentB_token, seed }: FusionRequest = req.body

    if (!parentA_token || !parentB_token || !seed) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (parentA_token === parentB_token) {
      return res.status(400).json({ error: 'Parent agents must be different' })
    }

    // Fetch parent metadata (from mock data or chain)
    const parentA = getParentMetadata(parentA_token)
    const parentB = getParentMetadata(parentB_token)

    if (!parentA || !parentB) {
      return res.status(404).json({ error: 'Parent agent not found' })
    }

    // Execute fusion logic
    const childMetadata = fuseAgents(parentA, parentB, seed)

    // Pin metadata to IPFS
    const ipfsCid = await pinToIPFS(childMetadata)
    childMetadata.ipfsCid = ipfsCid

    const result: FusionResult = {
      ipfsCid,
      geneticHash: childMetadata.geneticHash,
      metadata: childMetadata
    }

    console.log(`✅ Fusion complete: ${childMetadata.name} (${ipfsCid})`)

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

export default router
