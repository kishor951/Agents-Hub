/**
 * This function constructs the "DNA" of the agent.
 * It follows the CIP-68 standard so the agent can evolve later.
 */

export interface AgentMetadataOptions {
  generation?: number;           // Generation number (1 for genesis, incremented for bred agents)
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
  // Genesis agents are generation 1, treat 0 as 1 for legacy agents
  const generation = options?.generation && options.generation > 0 ? options.generation : 1;
  const xp = options?.xp ?? 0;
  const breedCount = options?.breedCount ?? 0;
  
  // Determine brain_cid: prioritize geneticDataIpfsCid (IPFS storage)
  const brain_cid = options?.geneticDataIpfsCid 
    ? `ipfs://${options.geneticDataIpfsCid}` 
    : `genetic://${options?.geneticHash || identifier}`;  // Fallback for legacy agents
  
  // Build properties object
  const properties: any = {
    generation,
    xp,
    breed_count: breedCount,
    // Use IPFS CID for brain_cid (genetic data is stored in IPFS)
    // If genetic_data_ipfs_cid is provided, use it; otherwise fall back to genetic:// hash
    brain_cid: brain_cid,
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
  
  console.log('📝 [createAgentMetadata] Creating agent metadata:')
  console.log(`   Name: ${agentName}`)
  console.log(`   Brain CID: ${brain_cid}`)
  console.log(`   Genetic Hash: ${properties.genetic_hash}`)
  console.log(`   Masumi DID: ${masumiDid}`)
  console.log(`   Generation: ${generation}`)
  console.log(`   Has geneticDataIpfsCid: ${!!options?.geneticDataIpfsCid}`)
  if (options?.geneticDataIpfsCid) {
    console.log(`   IPFS CID: ${options.geneticDataIpfsCid}`)
  }
  
  return {
    // Standard NFT Fields (Visible on Marketplaces like JPG.store)
    name: agentName,
    image: imageUrl,
    mediaType: "image/jpg",
    description: `AI Agent - Linked to ${masumiDid || 'Cardano'} (Gen ${generation})`,
    
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
  parentA_generation: number = 1,  // Genesis agents are generation 1
  parentB_generation: number = 1   // Genesis agents are generation 1
) => {
  // Treat 0 as 1 for legacy agents (there is no generation 0)
  const parentA_gen = parentA_generation > 0 ? parentA_generation : 1
  const parentB_gen = parentB_generation > 0 ? parentB_generation : 1
  
  // Child generation is max(parent generations) + 1
  // Example: Gen 1 + Gen 1 = Gen 2, Gen 2 + Gen 2 = Gen 3, Gen 1 + Gen 2 = Gen 3
  const childGeneration = Math.max(parentA_gen, parentB_gen) + 1;
  
  // Extract genetic hash from IPFS CID (first 16 chars for verification)
  const geneticHash = brainCid.length >= 16 ? brainCid.substring(0, 16) : brainCid;
  
  console.log('📝 [createBredAgentMetadata] Creating metadata for bred agent:')
  console.log(`   Agent Name: ${agentName}`)
  console.log(`   Brain CID (IPFS): ${brainCid}`)
  console.log(`   Genetic Hash: ${geneticHash}`)
  console.log(`   Masumi DID: ${masumiDid}`)
  console.log(`   Parent A generation (input): ${parentA_generation}, normalized: ${parentA_gen}`)
  console.log(`   Parent B generation (input): ${parentB_generation}, normalized: ${parentB_gen}`)
  console.log(`   Child generation: ${childGeneration} (max(${parentA_gen}, ${parentB_gen}) + 1)`)
  console.log(`   Parent A Asset ID: ${parentA_assetId.substring(0, 20)}...`)
  console.log(`   Parent B Asset ID: ${parentB_assetId.substring(0, 20)}...`)
  
  // CRITICAL FIX: Pass brainCid as geneticDataIpfsCid so brain_cid is set to ipfs://...
  // Also pass geneticHash for verification
  const metadata = createAgentMetadata(agentName, geneticHash, masumiDid, {
    generation: childGeneration,
    parentAssetIds: [parentA_assetId, parentB_assetId],
    xp: 0,
    breedCount: 0,
    geneticHash: geneticHash,
    geneticDataIpfsCid: brainCid  // THIS IS THE KEY FIX - pass IPFS CID here!
  });
  
  console.log('✅ [createBredAgentMetadata] Metadata created:')
  console.log(`   brain_cid: ${metadata.properties.brain_cid}`)
  console.log(`   genetic_hash: ${metadata.properties.genetic_hash}`)
  console.log(`   masumi_did: ${metadata.properties.masumi_did}`)
  console.log(`   generation: ${metadata.properties.generation}`)
  console.log(`   parents: ${metadata.properties.parents?.join(', ') || 'none'}`)
  
  return metadata;
};

