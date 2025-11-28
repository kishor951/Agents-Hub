export interface Agent {
  id: string
  name: string
  purpose?: string
  instructions?: string
  personality?: string
  skills: string[]
  personaPrompt?: string
  llmModel?: string
  generation: number
  geneticHash?: string
  ipfsCid?: string
  owner: string
  ownerAddress?: string // alias for owner
  imageUrl?: string
  tokenId?: string
  parents?: [string, string] // parent token IDs
  createdAt?: string
  minted?: boolean // Whether NFT has been minted on-chain
  txHash?: string | null // Transaction hash of minting
}

export interface FusionResult {
  ipfsCid: string
  geneticHash: string
  metadata: Omit<Agent, 'id'>
}

export interface MintTxResult {
  txHash: string
  tokenId: string
}

export interface WalletApi {
  getNetworkId(): Promise<number>
  getUsedAddresses(): Promise<string[]>
  getUnusedAddresses(): Promise<string[]>
  getUtxos(): Promise<string[] | undefined>
  getBalance(): Promise<string>
  signTx(tx: string, partialSign: boolean): Promise<string>
  submitTx(tx: string): Promise<string>
}
