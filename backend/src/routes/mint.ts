import { Router } from 'express'
import { MintRequest } from '../types/index.js'
import { buildMintTransaction } from '../services/cardanoService.js'
import axios from 'axios'

const router = Router()

// Get network configuration from environment
const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID || ''

const getNetworkConfig = () => {
  if (BLOCKFROST_PROJECT_ID.startsWith('mainnet')) {
    return { network: 'mainnet', url: 'https://cardano-mainnet.blockfrost.io/api/v0' }
  } else if (BLOCKFROST_PROJECT_ID.startsWith('preprod')) {
    return { network: 'preprod', url: 'https://cardano-preprod.blockfrost.io/api/v0' }
  } else if (BLOCKFROST_PROJECT_ID.startsWith('preview')) {
    return { network: 'preview', url: 'https://cardano-preview.blockfrost.io/api/v0' }
  } else {
    return { network: 'preprod', url: 'https://cardano-preprod.blockfrost.io/api/v0' }
  }
}

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

    console.log('📤 Submitting signed transaction to blockchain...')

    // Check if Blockfrost is configured
    if (!BLOCKFROST_PROJECT_ID || BLOCKFROST_PROJECT_ID.includes('XXXXX')) {
      console.log('⚠️  Mock mode - transaction not submitted')
      const mockTxHash = `mock_submitted_${Date.now()}`
      return res.json({ 
        txHash: mockTxHash,
        status: 'submitted',
        network: 'mock',
        message: 'Mock mode - configure BLOCKFROST_PROJECT_ID for real submission'
      })
    }

    const { network, url } = getNetworkConfig()
    console.log(`🌐 Submitting to ${network} network...`)

    try {
      // Submit transaction to Blockfrost
      const response = await axios.post(
        `${url}/tx/submit`,
        signedTx,
        {
          headers: {
            'Content-Type': 'application/cbor',
            'project_id': BLOCKFROST_PROJECT_ID
          }
        }
      )

      const txHash = response.data
      console.log(`✅ Transaction submitted successfully!`)
      console.log(`   TX Hash: ${txHash}`)
      console.log(`   Network: ${network}`)
      console.log(`   Explorer: https://${network}.cardanoscan.io/transaction/${txHash}`)

      res.json({ 
        txHash,
        status: 'submitted',
        network,
        explorerUrl: `https://${network}.cardanoscan.io/transaction/${txHash}`
      })
    } catch (blockfrostError: any) {
      console.error('❌ Blockfrost submission error:', blockfrostError.response?.data || blockfrostError.message)
      
      // Provide helpful error messages
      if (blockfrostError.response?.status === 400) {
        return res.status(400).json({ 
          error: 'Invalid transaction format',
          details: blockfrostError.response.data
        })
      } else if (blockfrostError.response?.status === 403) {
        return res.status(403).json({ 
          error: 'Blockfrost authentication failed - check your API key'
        })
      } else if (blockfrostError.response?.data?.message?.includes('UTxO')) {
        return res.status(400).json({ 
          error: 'Transaction validation failed - UTxO may have been spent',
          details: blockfrostError.response.data
        })
      }

      throw blockfrostError
    }
  } catch (error: any) {
    console.error('❌ Transaction submission error:', error.message)
    res.status(500).json({ 
      error: 'Failed to submit transaction',
      message: error.message
    })
  }
})

export default router
