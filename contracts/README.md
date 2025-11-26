# Agents Hub - Smart Contracts

This directory contains the Plutus smart contracts for the Agents Hub platform.

## Overview

The smart contracts handle:
- NFT minting validation
- Parent ownership verification
- Genetic hash validation
- Breeding fee enforcement

## Development

For hackathon MVP, we use simplified validators. Production deployment would require:

1. Full Plutus development environment
2. Plutarch or PlutusTx compilation
3. Comprehensive testing
4. Audit before mainnet

## Validator Logic (Pseudocode)

```haskell
-- Simplified breeding validator logic
validateBreeding :: BreedingParams -> ValidatorResult
validateBreeding params = do
  -- Check caller owns both parent NFTs
  assert (ownerOf parentA == signer)
  assert (ownerOf parentB == signer)
  
  -- Verify parents are different
  assert (parentA /= parentB)
  
  -- Validate breeding fee paid
  assert (feePaid >= requiredFee)
  
  -- Verify genetic hash matches
  assert (computeHash(metadata) == providedHash)
  
  -- Check breed count limits (optional)
  assert (breedCount parentA < maxBreeds)
  assert (breedCount parentB < maxBreeds)
  
  return Valid
```

## For Hackathon Demo

We simulate on-chain validation by:
1. Backend generates correct genetic hash
2. Frontend wallet signs transaction
3. Blockfrost submits to testnet
4. Mock validation passes with correct parameters

## Future Work

- [ ] Implement full Plutus validators
- [ ] Add redeemer scripts for burning/trading
- [ ] Implement breeding count tracking on-chain
- [ ] Add royalty enforcement
- [ ] Create marketplace contract
