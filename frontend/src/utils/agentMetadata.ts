/**
 * This function constructs the "DNA" of the agent.
 * It follows the CIP-68 standard so the agent can evolve later.
 */

export interface AgentMetadataOptions {
  generation?: number;           // Generation number (0 for genesis, incremented for bred agents)
  parentAssetIds?: string[];     // Optional: Array of parent asset IDs for lineage tracking
  xp?: number;                   // Experience points (default: 0)
  breedCount?: number;            // How many times this agent has bred (default: 0)
  geneticHash?: string;           // Genetic hash for verification
  geneticDataIpfsCid?: string;   // IPFS CID for retrieving full genetic data
  imageIpfsCid?: string;          // IPFS CID for agent image
}

export const createAgentMetadata = (
  agentName: string, 
  identifier: string,  // Genetic hash (for verification)
  masumiDid: string, // The Agent's ID (e.g., did:masumi:...)
  options?: AgentMetadataOptions // Optional: Generation, parents, genetic hash, IPFS CID, image
) => {
  const generation = options?.generation ?? 0;
  const xp = options?.xp ?? 0;
  const breedCount = options?.breedCount ?? 0;
  
  // Build properties object
  const properties: any = {
    generation,
    xp,
    breed_count: breedCount,
    // Use IPFS CID for brain_cid (genetic data is stored in IPFS)
    // If genetic_data_ipfs_cid is provided, use it; otherwise fall back to genetic:// hash
    brain_cid: options?.geneticDataIpfsCid 
      ? `ipfs://${options.geneticDataIpfsCid}` 
      : `genetic://${options?.geneticHash || identifier}`,  // Fallback for legacy agents
    genetic_hash: options?.geneticHash || identifier,  // Genetic hash (for verification)
    masumi_did: masumiDid || ""  // Masumi DID (always generated)
  };
  
  // Add parent references if provided (for lineage tracking)
  if (options?.parentAssetIds && options.parentAssetIds.length > 0) {
    properties.parents = options.parentAssetIds;
  }
  
  // Use provided image or default placeholder
  const imageUrl = options?.imageIpfsCid 
    ? `ipfs://${options.imageIpfsCid}` 
    : "ipfs://QmRyXXXXX"; // TODO: Replace with a generic "Egg" or "Robot" image hash
  
  return {
    // Standard NFT Fields (Visible on Marketplaces like JPG.store)
    name: agentName,
    image: imageUrl,
    mediaType: "image/jpg",
    description: `AI Agent - Linked to ${masumiDid || 'Cardano'}${generation > 0 ? ` (Gen ${generation})` : ''}`,
    
    // 🚨 THE CRITICAL PART (The Living State)
    // These fields go into the "Reference Token" (The Vault).
    // You can UPDATE these later using the generator!
    properties
  };
};

/**
 * Helper function to create metadata for a bred agent (child of two parents)
 */
export const createBredAgentMetadata = (
  agentName: string,
  brainCid: string,
  masumiDid: string,
  parentA_assetId: string,
  parentB_assetId: string,
  parentA_generation: number = 1,  // First generation is 1, not 0
  parentB_generation: number = 1   // First generation is 1, not 0
) => {
  // Child generation is max(parent generations) + 1
  const childGeneration = Math.max(parentA_generation, parentB_generation) + 1;
  
  return createAgentMetadata(agentName, brainCid, masumiDid, {
    generation: childGeneration,
    parentAssetIds: [parentA_assetId, parentB_assetId],
    xp: 0,
    breedCount: 0
  });
};

