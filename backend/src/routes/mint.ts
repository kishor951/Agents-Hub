import { Router } from 'express'
import { MintRequest } from '../types/index.js'
import { buildMintTransaction } from '../services/cardanoService.js'

const router = Router()

/**
 * POST /api/build-mint-tx
 * Build an unsigned mint transaction for the child agent
 */
router.post('/build-mint-tx', async (req, res) => {
  try {
    const { ipfsCid, geneticHash, parents, ownerAddress }: MintRequest = req.body

    if (!ipfsCid || !geneticHash || !parents || !ownerAddress) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!Array.isArray(parents) || parents.length !== 2) {
      return res.status(400).json({ error: 'Parents must be an array of 2 token IDs' })
    }

    // Build unsigned transaction
    const txData = await buildMintTransaction(
      ownerAddress,
      ipfsCid,
      geneticHash,
      parents as [string, string]
    )

    console.log(`✅ Mint transaction built: ${txData.txHash}`)

    res.json({
      unsignedTx: txData.unsignedTx,
      txHash: txData.txHash,
      message: 'Sign this transaction with your wallet to mint the NFT'
    })
  } catch (error) {
    console.error('Mint transaction error:', error)
    res.status(500).json({ error: 'Failed to build mint transaction' })
  }
})

/**
 * POST /api/submit-tx
 * Submit a signed transaction to the blockchain
 */
router.post('/submit-tx', async (req, res) => {
  try {
    const { signedTx } = req.body

    if (!signedTx) {
      return res.status(400).json({ error: 'Missing signed transaction' })
    }

    // Submit to Cardano network
    // const txHash = await submitTransaction(signedTx)

    // Mock response for demo
    const txHash = `submitted_${Date.now()}`

    console.log(`✅ Transaction submitted: ${txHash}`)

    res.json({ txHash, status: 'submitted' })
  } catch (error) {
    console.error('Transaction submission error:', error)
    res.status(500).json({ error: 'Failed to submit transaction' })
  }
})

export default router
