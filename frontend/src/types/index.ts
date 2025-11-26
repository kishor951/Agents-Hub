export interface Agent {
  id: string
  name: string
  tokenId?: string
  parents?: [string, string] // parent token IDs
  skills: string[]
  personaPrompt: string
  generation: number
  geneticHash: string
  ipfsCid?: string
  ownerAddress: string
  imageUrl?: string
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
