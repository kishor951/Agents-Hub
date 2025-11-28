# 🧬 Agents Hub Smart Contracts

Cardano Plutus/Aiken validators for NFT agent breeding and minting.

## 📁 Structure

```
contracts/
├── aiken.toml                 # Project configuration
├── validators/
│   └── agents/
│       └── breed.ak          # Main mint validator
├── lib/
│   └── agents_breeding.ak    # Shared utilities
└── plutus.json               # Generated blueprint (CIP-0057)
```

## 🏗️ Building

### Prerequisites
- [Aiken](https://aiken-lang.org/) (v1.0+)
- Cardano toolchain (optional, for testing)

### Build Contracts

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies (if any)
aiken check

# Compile and generate plutus.json
aiken build
```

### Output

After building, you'll get:
- **plutus.json** - CIP-0057 Plutus Blueprint
  - Contains compiled UPLC code
  - Defines Redeemer structure
  - Interface for Mesh SDK

## 🔐 Validators

### breed.ak - Mint Handler

**Purpose**: Validate agent breeding and NFT minting

**Rules Enforced**:
1. ✅ Parent Agent A NFT consumed (UTXO present)
2. ✅ Parent Agent B NFT consumed (UTXO present)
3. ✅ Breeding fee paid (10 ADA minimum)
4. ✅ Genetic hash valid (32 bytes)
5. ✅ Owner authorized (signature required)

**Redeemer Type**:
```haskell
type BreedingRedeemer {
  parent_a_ref: OutputReference,
  parent_b_ref: OutputReference,
  genetic_hash: ByteString,
  owner_key_hash: ByteString,
}
```

## 🧪 Testing

```bash
# Run type checking and basic tests
aiken check

# View detailed error messages
aiken check --verbose
```

## 🚀 Deployment

### Testnet
1. Build contracts: `aiken build`
2. Generate plutus.json: ✓ (automatic)
3. Frontend reads blueprint via Mesh SDK
4. Transactions include compiled UPLC

### Mainnet
- Same process, use mainnet Blockfrost endpoints
- Test thoroughly on testnet first!

## 📚 Resources

- [Aiken Documentation](https://aiken-lang.org/)
- [CIP-0057 Plutus Blueprint](https://cips.cardano.org/cips/cip57/)
- [Cardano Developer Docs](https://docs.cardano.org/)

## 📝 Development Workflow

1. **Write validator** in `.ak` files
2. **Run checks**: `aiken check`
3. **Build**: `aiken build`
4. **Test locally** (optional)
5. **Deploy to testnet** via Mesh SDK
6. **Verify transaction** on Cardano Explorer

## 🐛 Debugging

### Common Issues

**Compilation Error: "Unknown identifier"**
- Check imports and function names
- Ensure you're using Aiken v1.0+ syntax

**Validator Returns False**
- Add `trace` statements to debug
- Check ScriptContext values in transaction

**plutus.json Not Generated**
- Run `aiken build` (not just `aiken check`)
- Ensure no compilation errors

## 🔗 Integration with Mesh SDK

The generated `plutus.json` is automatically used by:

1. **Frontend** - WalletConnect and BreedScreen components
2. **Backend** - Transaction building service
3. **Mesh SDK** - Constructs proper Redeemer structure

Example in TypeScript:
```typescript
import blueprint from '../../../contracts/plutus.json';

const tx = new MeshTxBuilder()
  .mint(1, scriptAddress, policyId, redeemer)
  .setPlutusScript(blueprint.validators[0])
  .build();
```

## 📊 Gas Estimation

Expected transaction size: ~500-600 bytes
Expected fee: ~170-200 ADA (testnet)

## ✅ Status

- [ ] Aiken project initialized
- [ ] breed.ak validator written
- [ ] Tests passing
- [ ] plutus.json generated
- [ ] Frontend integration ready
- [ ] Testnet deployment complete

---

**Last Updated**: November 27, 2025  
**Status**: Ready for MVP Implementation
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
