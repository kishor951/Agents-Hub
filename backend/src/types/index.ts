export interface AgentMetadata {
  name: string
  parents?: [string, string]
  skills: string[]
  personaPrompt: string
  generation: number
  geneticHash: string
  ownerAddress: string
  tokenId?: string
  ipfsCid?: string
  imageUrl?: string
}

export interface FusionRequest {
  parentA_token: string
  parentB_token: string
  seed: string
}

export interface FusionResult {
  ipfsCid: string
  geneticHash: string
  metadata: AgentMetadata
}

export interface MintRequest {
  ipfsCid: string
  geneticHash: string
  parents: [string, string]
  ownerAddress: string
}

export interface QueryRequest {
  tokenId: string
  query: string
  personaPrompt: string
  skills: string[]
}
