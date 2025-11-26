import axios from 'axios'
import { AgentMetadata } from '../types/index.js'

const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY || ''
const IPFS_PROVIDER = process.env.IPFS_PROVIDER || 'nft.storage'

export async function pinToIPFS(metadata: AgentMetadata): Promise<string> {
  if (!NFT_STORAGE_API_KEY) {
    // For demo/testing, return mock CID
    console.warn('⚠️  No IPFS API key configured, using mock CID')
    const mockCid = `Qm${Buffer.from(JSON.stringify(metadata)).toString('hex').substring(0, 44)}`
    return mockCid
  }

  try {
    if (IPFS_PROVIDER === 'nft.storage') {
      return await pinWithNFTStorage(metadata)
    } else {
      throw new Error(`Unsupported IPFS provider: ${IPFS_PROVIDER}`)
    }
  } catch (error) {
    console.error('IPFS pinning error:', error)
    // Fallback to mock for demo
    const mockCid = `Qm${Buffer.from(JSON.stringify(metadata)).toString('hex').substring(0, 44)}`
    return mockCid
  }
}

async function pinWithNFTStorage(metadata: AgentMetadata): Promise<string> {
  const response = await axios.post(
    'https://api.nft.storage/upload',
    JSON.stringify(metadata),
    {
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data.value.cid
}

export async function fetchFromIPFS(cid: string): Promise<AgentMetadata> {
  try {
    const response = await axios.get(`https://ipfs.io/ipfs/${cid}`, {
      timeout: 10000
    })
    return response.data
  } catch (error) {
    console.error('IPFS fetch error:', error)
    throw new Error('Failed to fetch metadata from IPFS')
  }
}
