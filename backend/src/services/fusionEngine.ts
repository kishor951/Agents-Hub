import crypto from 'crypto'
import { AgentMetadata } from '../types/index.js'

// Mock parent data - in production, fetch from chain/DB
const MOCK_PARENTS: Record<string, AgentMetadata> = {
  'agent001': {
    name: 'CodeMaster Alpha',
    skills: ['Python', 'JavaScript', 'Debugging', 'Code Review'],
    personaPrompt: 'Expert software engineer with focus on code quality',
    generation: 0,
    geneticHash: 'hash_alpha_001',
    ownerAddress: 'addr_test1...',
    tokenId: 'agent001'
  },
  'agent002': {
    name: 'DataWizard Beta',
    skills: ['Data Analysis', 'SQL', 'Statistics', 'Visualization'],
    personaPrompt: 'Data scientist specializing in insights and analytics',
    generation: 0,
    geneticHash: 'hash_beta_002',
    ownerAddress: 'addr_test1...',
    tokenId: 'agent002'
  },
  'agent003': {
    name: 'DesignGuru Gamma',
    skills: ['UI Design', 'UX Research', 'Prototyping', 'Figma'],
    personaPrompt: 'Creative designer focused on user experience',
    generation: 0,
    geneticHash: 'hash_gamma_003',
    ownerAddress: 'addr_test1...',
    tokenId: 'agent003'
  },
  'agent004': {
    name: 'BlockchainSage Delta',
    skills: ['Solidity', 'Smart Contracts', 'DeFi', 'Security Audits'],
    personaPrompt: 'Blockchain expert specializing in secure smart contracts',
    generation: 0,
    geneticHash: 'hash_delta_004',
    ownerAddress: 'addr_test1...',
    tokenId: 'agent004'
  }
}

export function getParentMetadata(tokenId: string): AgentMetadata | null {
  return MOCK_PARENTS[tokenId] || null
}

export function fuseAgents(
  parentA: AgentMetadata,
  parentB: AgentMetadata,
  seed: string
): AgentMetadata {
  // Merge skills: take top 3 from each, dedupe
  const combinedSkills = [
    ...parentA.skills.slice(0, 3),
    ...parentB.skills.slice(0, 3)
  ]
  const uniqueSkills = [...new Set(combinedSkills)]

  // Generate child name
  const childName = generateChildName(parentA.name, parentB.name)

  // Compose persona prompt (deterministic)
  const personaPrompt = `${parentA.personaPrompt.split(' ')[0]} ${parentB.personaPrompt.split(' ')[1] || 'specialist'} with skills in ${uniqueSkills.slice(0, 3).join(', ')}`

  // Calculate generation
  const generation = Math.max(parentA.generation, parentB.generation) + 1

  // Compute genetic hash (deterministic)
  const geneticData = JSON.stringify({
    skills: uniqueSkills.sort(),
    persona: personaPrompt,
    seed,
    parents: [parentA.tokenId, parentB.tokenId].sort()
  })
  const geneticHash = crypto.createHash('sha256').update(geneticData).digest('hex')

  return {
    name: childName,
    parents: [parentA.tokenId!, parentB.tokenId!],
    skills: uniqueSkills,
    personaPrompt,
    generation,
    geneticHash,
    ownerAddress: parentA.ownerAddress, // Inherit from parent
    imageUrl: '👶'
  }
}

function generateChildName(nameA: string, nameB: string): string {
  const wordsA = nameA.split(' ')
  const wordsB = nameB.split(' ')
  
  // Take first word from A, last word from B
  const prefix = wordsA[0]
  const suffix = wordsB[wordsB.length - 1]
  
  return `${prefix}-${suffix} Fusion`
}

export function computeGeneticHash(metadata: AgentMetadata): string {
  const geneticData = JSON.stringify({
    skills: metadata.skills.sort(),
    persona: metadata.personaPrompt,
    parents: metadata.parents?.sort() || []
  })
  return crypto.createHash('sha256').update(geneticData).digest('hex')
}
