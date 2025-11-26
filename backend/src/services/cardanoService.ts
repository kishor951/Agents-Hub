import axios from 'axios'

const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID || ''
const CARDANO_NETWORK = process.env.CARDANO_NETWORK || 'testnet'

const BLOCKFROST_BASE_URL = CARDANO_NETWORK === 'mainnet'
  ? 'https://cardano-mainnet.blockfrost.io/api/v0'
  : 'https://cardano-testnet.blockfrost.io/api/v0'

export async function buildMintTransaction(
  ownerAddress: string,
  ipfsCid: string,
  geneticHash: string,
  parents: [string, string]
): Promise<{ unsignedTx: string; txHash: string }> {
  if (!BLOCKFROST_PROJECT_ID) {
    console.warn('⚠️  No Blockfrost project ID configured, using mock transaction')
    return {
      unsignedTx: `mock_unsigned_tx_${Date.now()}`,
      txHash: `mock_tx_hash_${geneticHash.substring(0, 16)}`
    }
  }

  // In a real implementation:
  // 1. Fetch UTXOs for owner address
  // 2. Build transaction with minting action
  // 3. Add metadata (genetic hash, IPFS CID)
  // 4. Calculate fees
  // 5. Return unsigned tx for wallet to sign

  try {
    // Example Blockfrost call (simplified)
    const utxosResponse = await axios.get(
      `${BLOCKFROST_BASE_URL}/addresses/${ownerAddress}/utxos`,
      {
        headers: { 'project_id': BLOCKFROST_PROJECT_ID }
      }
    )

    // Build transaction using cardano-serialization-lib
    // This is a simplified mock for the hackathon
    const mockTx = {
      unsignedTx: `mock_unsigned_tx_${Date.now()}`,
      txHash: `tx_${geneticHash.substring(0, 32)}`
    }

    return mockTx
  } catch (error) {
    console.error('Cardano transaction building error:', error)
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
