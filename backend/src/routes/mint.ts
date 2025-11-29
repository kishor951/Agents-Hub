import { Router } from 'express'
import { MintRequest } from '../types/index.js'
import { buildMintTransaction } from '../services/cardanoService.js'
import axios from 'axios'

const router = Router()

const getNetworkConfig = () => {
  const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID || ''
  
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
      return res.status(400).json({ error: 'Missing signedTx' })
    }

    console.log('📤 Submitting signed transaction to blockchain...')
    console.log('   Signed TX length:', signedTx.length)
    console.log('   Signed TX (first 50 chars):', signedTx.substring(0, 50))

    // Read BLOCKFROST_PROJECT_ID dynamically (not at module load time)
    const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID || ''
    
    console.log('🔑 Blockfrost ID check:', BLOCKFROST_PROJECT_ID ? `Present (${BLOCKFROST_PROJECT_ID.substring(0, 10)}...)` : 'MISSING')

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

    // The wallet returns a complete signed transaction - submit directly
    console.log('📡 Sending to Blockfrost...')

    // The wallet returns a complete signed transaction - submit directly
    console.log('📡 Sending to Blockfrost...')

      // Retry logic for rate limits
      let lastError: any = null
      const maxRetries = 3
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            const delay = Math.pow(2, attempt - 1) * 1000 // Exponential backoff: 2s, 4s, 8s
            console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }

          // Submit transaction to Blockfrost
          const response = await axios.post(
            `${url}/tx/submit`,
            Buffer.from(signedTx, 'hex'),
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

        return res.json({ 
          txHash,
          status: 'submitted',
          network,
          explorerUrl: `https://${network}.cardanoscan.io/transaction/${txHash}`
        })
      } catch (blockfrostError: any) {
        lastError = blockfrostError
        
        // Rate limit - retry
        if (blockfrostError.response?.status === 429) {
          console.log(`⚠️  Rate limit hit (429), will retry...`)
          if (attempt < maxRetries) continue
        }
        
        // Other errors - don't retry
        console.error('❌ Blockfrost submission error:', blockfrostError.response?.data || blockfrostError.message)
        
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

        break // Don't retry for non-rate-limit errors
      }
    }

    // All retries failed
    throw lastError
  } catch (error: any) {
    console.error('❌ Transaction submission error:', error.message)
    res.status(500).json({ 
      error: 'Failed to submit transaction',
      message: error.message
    })
  }
})

export default router
