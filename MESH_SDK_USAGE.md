# Mesh SDK Usage Analysis

## ⚠️ ARCHITECTURE UPDATE

**Important:** Following the Reference architecture, the backend should **NOT** use Mesh SDK. The backend only generates metadata/hashes, and the frontend handles all wallet and transaction logic using Mesh SDK directly.

## APIs Currently Using Mesh SDK (TO BE REMOVED)

### 1. `POST /api/agents/create`
**File**: `backend/src/routes/agent.ts` (line 261)
**Service**: `cardanoService.buildMintTransaction()`
**Mesh SDK Components Used**:
- `BlockfrostProvider` - Fetches UTXOs from Blockfrost
- `MeshTxBuilder` - Builds Cardano transaction
- `mConStr0` - Plutus redeemer value

**Purpose**: Builds mint transaction when creating a new agent
**Impact**: **HIGH** - Core agent creation feature

**Code Flow**:
```typescript
// In agent.ts route
mintTxData = await buildMintTransaction(
  owner,
  ipfsCid,
  geneticHash,
  [tokenId, tokenId]
)

// In cardanoService.ts
const blockfrostProvider = new BlockfrostProvider(BLOCKFROST_PROJECT_ID)
const txBuilder = new MeshTxBuilder({
  fetcher: blockfrostProvider,
  submitter: blockfrostProvider,
})
// ... builds transaction with Plutus V3 script
```

---

### 2. `POST /api/build-mint-tx`
**File**: `backend/src/routes/mint.ts` (line 39)
**Service**: `cardanoService.buildMintTransaction()`
**Mesh SDK Components Used**:
- `BlockfrostProvider` - Fetches UTXOs from Blockfrost
- `MeshTxBuilder` - Builds Cardano transaction
- `mConStr0` - Plutus redeemer value

**Purpose**: Builds unsigned mint transaction for child agents (breeding)
**Impact**: **HIGH** - Core breeding/minting feature

**Code Flow**:
```typescript
// In mint.ts route
const txData = await buildMintTransaction(
  ownerAddress,
  ipfsCid,
  geneticHash,
  parents
)

// Same service as above
```

---

## APIs NOT Using Mesh SDK

### 3. `GET /api/agent/:tokenId`
**File**: `backend/src/routes/agent.ts` (line 73)
**Service**: `cardanoService.getTokenInfo()`
**Implementation**: Uses Blockfrost API directly via `axios`
**Status**: ✅ **Can migrate directly** - No Mesh SDK dependency

---

### 4. `POST /api/submit-tx`
**File**: `backend/src/routes/mint.ts` (line 63)
**Implementation**: Uses CBOR manipulation and Blockfrost API directly
**Status**: ✅ **Can migrate directly** - No Mesh SDK dependency
**Note**: Uses `cbor` npm package for CBOR encoding/decoding

---

### 5. `POST /api/wallet/convert-address`
**File**: `backend/src/routes/wallet.ts` (line 9)
**Library Used**: `@emurgo/cardano-serialization-lib-nodejs` (CSL)
**Status**: ⚠️ **Uses TypeScript-only library** (not Mesh SDK)
**Impact**: Low - Utility function
**Solution**: Can use Python alternative (`pycardano` or Python CSL bindings)

---

## Summary

| API Endpoint | Mesh SDK? | Action | Migration Strategy |
|-------------|-----------|--------|-------------------|
| `POST /api/agents/create` | ✅ Yes (REMOVE) | **Remove transaction building** | Return metadata only, frontend builds transaction |
| `POST /api/build-mint-tx` | ✅ Yes (REMOVE) | **Remove endpoint** | Frontend handles transaction building |
| `POST /api/submit-tx` | ❌ No (REMOVE) | **Remove endpoint** | Frontend submits directly |
| `POST /api/wallet/convert-address` | ❌ No (REMOVE) | **Remove endpoint** | Frontend handles address conversion |
| `GET /api/agent/:tokenId` | ❌ No | Keep | Direct migration (Blockfrost API) |

**Total APIs requiring Mesh SDK: 0** (Backend will NOT use Mesh SDK)
**Total APIs to remove: 3** (transaction/wallet endpoints)
**Total APIs to migrate: 1+** (metadata/query endpoints)

---

## ✅ Recommended Approach: Reference Architecture

### Backend (Python)
- **Generate metadata only**: IPFS hash, genetic hash, Masumi DID
- **Return metadata to frontend**: Frontend uses Mesh SDK to build transactions
- **No wallet interaction**: All wallet logic stays in frontend
- **No transaction building**: Frontend handles all Cardano transaction logic

### Frontend (React)
- **Use Mesh SDK directly**: Same as Reference implementation
- **Build transactions**: Using Mesh SDK transaction builder
- **Sign transactions**: Using connected wallet (Lace, Nami, etc.)
- **Submit transactions**: Directly to Cardano network

### Example Flow (Create Agent)

**Backend Response:**
```python
{
  "success": True,
  "agent": { ... },
  "ipfsCid": "QmHash...",
  "imageIpfsCid": "QmImageHash...",
  "geneticHash": "abc123...",
  "masumiDid": "did:masumi:testnet:agent-uuid"
}
```

**Frontend (uses Mesh SDK):**
```typescript
// 1. Call backend to get metadata
const response = await createAgent(formData);

// 2. Build transaction using Mesh SDK
const unsignedTx = await buildMintTransaction(
  wallet,
  response.ipfsCid,
  response.geneticHash,
  response.masumiDid
);

// 3. Sign and submit
const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);
```

---

**Last Updated**: [Current Date]
**Status**: Analysis Complete

