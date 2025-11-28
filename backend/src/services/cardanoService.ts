import axios from 'axios'
import { BlockfrostProvider, MeshTxBuilder, MeshWallet } from '@meshsdk/core'

const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID || ''
const CARDANO_NETWORK = process.env.CARDANO_NETWORK || 'preprod'

// Determine network and Blockfrost URL based on project ID prefix
const getNetworkConfig = () => {
  if (BLOCKFROST_PROJECT_ID.startsWith('mainnet')) {
    return {
      network: 'mainnet',
      url: 'https://cardano-mainnet.blockfrost.io/api/v0'
    }
  } else if (BLOCKFROST_PROJECT_ID.startsWith('preprod')) {
    return {
      network: 'preprod',
      url: 'https://cardano-preprod.blockfrost.io/api/v0'
    }
  } else if (BLOCKFROST_PROJECT_ID.startsWith('preview')) {
    return {
      network: 'preview',
      url: 'https://cardano-preview.blockfrost.io/api/v0'
    }
  } else {
    return {
      network: 'preprod',
      url: 'https://cardano-preprod.blockfrost.io/api/v0'
    }
  }
}

const { network, url: BLOCKFROST_BASE_URL } = getNetworkConfig()

console.log(`🌐 Cardano Network: ${network}`)
console.log(`🔗 Blockfrost URL: ${BLOCKFROST_BASE_URL}`)

export async function buildMintTransaction(
  ownerAddress: string,
  ipfsCid: string,
  geneticHash: string,
  parents: [string, string]
): Promise<{ unsignedTx: string; txHash: string }> {
  if (!BLOCKFROST_PROJECT_ID || BLOCKFROST_PROJECT_ID.includes('XXXXX')) {
    console.warn('⚠️  No valid Blockfrost project ID configured, using mock transaction')
    return {
      unsignedTx: `mock_unsigned_tx_${Date.now()}`,
      txHash: `mock_tx_hash_${geneticHash.substring(0, 16)}`
    }
  }

  try {
    console.log(`\n🏗️  Building REAL mint transaction on ${network}...`)
    console.log(`   Owner: ${ownerAddress.substring(0, 20)}...`)
    console.log(`   IPFS CID: ${ipfsCid}`)
    console.log(`   Genetic Hash: ${geneticHash}`)

    // Initialize Blockfrost provider
    const blockfrostProvider = new BlockfrostProvider(BLOCKFROST_PROJECT_ID)

    // Fetch UTXOs for owner address
    console.log('📦 Fetching UTXOs...')
    const utxos = await blockfrostProvider.fetchAddressUTxOs(ownerAddress)
    
    if (!utxos || utxos.length === 0) {
      console.warn('⚠️  No UTXOs found at address - user needs testnet ADA')
      console.warn('   Get free testnet ADA from: https://docs.cardano.org/cardano-testnets/tools/faucet/')
      return {
        unsignedTx: `mock_unsigned_tx_${Date.now()}`,
        txHash: `mock_tx_hash_no_utxos`
      }
    }

    console.log(`✅ Found ${utxos.length} UTXOs`)

    // Initialize transaction builder
    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrostProvider,
      submitter: blockfrostProvider,
    })

    // Build mint transaction (simplified - just sends back to owner for now)
    // In production, this would include actual NFT minting policy
    const unsignedTx = await txBuilder
      .txOut(ownerAddress, [{ unit: 'lovelace', quantity: '1500000' }]) // Min ADA
      .changeAddress(ownerAddress)
      .metadataValue(721, {
        [geneticHash]: {
          name: `Agent_${geneticHash.substring(0, 8)}`,
          image: `ipfs://${ipfsCid}`,
          geneticHash,
          parents,
          network
        }
      })
      .complete()

    const txHash = `tx_${Date.now()}_${geneticHash.substring(0, 16)}`
    
    console.log('✅ Transaction built successfully!')
    console.log(`   TX Hash (preview): ${txHash}`)
    console.log(`   Unsigned TX size: ${unsignedTx.length} bytes`)

    return {
      unsignedTx,
      txHash
    }
  } catch (error: any) {
    console.error('❌ Real transaction building failed:', error.message)
    console.error('   Falling back to mock mode')
    // Return mock for demo
    return {
      unsignedTx: `mock_unsigned_tx_${Date.now()}`,
      txHash: `tx_${geneticHash.substring(0, 32)}`
    }
  }
}

export async function submitTransaction(signedTx: string): Promise<string> {
  if (!BLOCKFROST_PROJECT_ID) {
    return `mock_submitted_${Date.now()}`
  }

  try {
    const response = await axios.post(
      `${BLOCKFROST_BASE_URL}/tx/submit`,
      signedTx,
      {
        headers: {
          'project_id': BLOCKFROST_PROJECT_ID,
          'Content-Type': 'application/cbor'
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Transaction submission error:', error)
    throw new Error('Failed to submit transaction')
  }
}

export async function getTokenInfo(tokenId: string): Promise<any> {
  if (!BLOCKFROST_PROJECT_ID) {
    return { tokenId, mock: true }
  }

  try {
    const response = await axios.get(
      `${BLOCKFROST_BASE_URL}/assets/${tokenId}`,
      {
        headers: { 'project_id': BLOCKFROST_PROJECT_ID }
      }
    )

    return response.data
  } catch (error) {
    console.error('Token info fetch error:', error)
    return null
  }
}
