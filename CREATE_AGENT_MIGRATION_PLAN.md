# Create Agent API Migration Plan
## Python Backend + Lace Wallet Integration

**Status**: 📋 Planning Phase - Awaiting Execution Approval

**Goal**: Migrate Create Agent API from TypeScript to Python backend, integrate Lace wallet for transaction building, while maintaining seamless UI experience.

---

## ✅ Confirmed Requirements

1. **CIP-68 Standard**: Use CIP-68 (like Reference) - NOT CIP-25
2. **Aiken Policy**: Check Reference implementation (uses `@independenceee/cip68generator`, no Aiken policy needed for minting)
3. **Backend Port**: Python backend on port **8000** (primary, no TypeScript dependency)
4. **Personality Generation**: Gemini **always used** (even if personality provided, regenerate)
5. **Genetic Hash**: Used for deterministic child generation, asset naming, and transaction validation
6. **Masumi DID**: **Optional** (only if MASUMI_API_KEY is set)
7. **Frontend API URL**: Default to port **8000** (backend port)
8. **Error Handling**: Show error, allow retry
9. **IPFS**: Use **PINATA_JWT** only (like Reference)
10. **Agent Storage**: **NO storage** - Agents fetched from wallet (like Reference)

---

## 🎯 Architecture Overview

### Current Flow (TypeScript Backend)
```
Frontend → POST /api/agents/create
  ↓
Backend:
  1. Upload image to IPFS
  2. Upload metadata to IPFS
  3. Save agent to JSON
  4. Build mint transaction (Mesh SDK) ❌ REMOVE
  5. Return: agent, ipfsCid, imageIpfsCid, mintTx
  ↓
Frontend:
  1. Show mint modal
  2. User signs transaction
  3. POST /api/submit-tx ❌ REMOVE
  4. Update agent status
```

### Target Flow (Python Backend + Frontend Mesh SDK)
```
Frontend → POST /api/agents/create
  ↓
Backend (Python):
  1. Upload image to IPFS (PINATA_JWT)
  2. Generate personality using Gemini (always)
  3. Upload personality/metadata to IPFS
  4. Generate genetic hash (deterministic)
  5. Generate Masumi DID (optional - if API key set)
  6. Return: ipfsCid, imageIpfsCid, geneticHash, masumiDid, personality
  ↓
Frontend:
  1. Build CIP-68 transaction using Mesh SDK + @independenceee/cip68generator
  2. Sign with Lace wallet
  3. Submit directly to Cardano
  4. Agent appears in wallet (no backend storage)
  5. Frontend fetches agents from wallet (like Reference)
```

---

## 📊 Current Implementation Analysis

### Backend Endpoint: `POST /api/agents/create`

**Current Request (TypeScript):**
```typescript
multipart/form-data:
  - name: string
  - purpose: string
  - instructions: string
  - personality: string
  - skills: string (comma-separated)
  - llmModel: string
  - owner: string
  - picture: File (optional)
```

**Current Response (TypeScript - WRONG):**
```typescript
{
  success: true,
  agent: {
    id: string,
    tokenId: string,
    name: string,
    purpose: string,
    instructions: string,
    personality: string,
    skills: string[],
    llmModel: string,
    generation: number,
    owner: string,
    ipfsCid: string,
    imageIpfsCid: string | null,
    imageUrl: string | null,
    createdAt: string,
    minted: boolean,
    txHash: string
  },
  ipfsCid: string,
  imageIpfsCid: string | null,
  mintTx: {                    // ❌ REMOVE - Frontend builds this
    unsignedTx: string,
    txHash: string,
    message: string
  } | null,
  mintError: string | null     // ❌ REMOVE
}
```

**Target Response (Python - CORRECT):**
```python
{
  "success": True,
  "agent": {
    "id": str,
    "tokenId": str,
    "name": str,
    "purpose": str,
    "instructions": str,
    "personality": str,
    "skills": List[str],
    "llmModel": str,
    "generation": int,
    "owner": str,
    "ipfsCid": str,
    "imageIpfsCid": str | None,
    "imageUrl": str | None,
    "geneticHash": str,         # ✅ ADD - For frontend transaction building
    "masumiDid": str,           # ✅ ADD - From Reference
    "createdAt": str,
    "minted": False,            # Frontend will update after minting
    "txHash": ""                # Frontend will update after minting
  },
  "ipfsCid": str,
  "imageIpfsCid": str | None,
  "geneticHash": str,           # ✅ ADD - For frontend transaction building
  "masumiDid": str              # ✅ ADD - From Reference
  # ❌ NO mintTx - Frontend builds transaction using Mesh SDK
  # ❌ NO mintError - Frontend handles errors
}
```

### Frontend Component: `CreateAgent.tsx`

**Current Flow (lines 136-250):**
1. Call `POST /api/agents/create`
2. Receive `mintTx` from backend
3. Show mint modal with "Sign with Lace Wallet" button
4. User signs transaction
5. Call `POST /api/submit-tx` to submit
6. Call `POST /api/agents/:id/mint-complete` to update status

**Target Flow:**
1. Call `POST /api/agents/create` (Python backend on port 8000)
2. Receive metadata (ipfs_hash, personality_text, masumi_did, genetic_hash, image_ipfs_cid)
3. Build CIP-68 transaction using Mesh SDK + @independenceee/cip68generator (like Reference)
4. Show mint modal with "Sign with Lace Wallet" button
5. User signs transaction
6. Submit directly to Cardano (wallet.submitTx)
7. Agent appears in wallet (no backend storage needed)
8. Frontend fetches agents from wallet (like Reference `getUserAgents`)

---

## 🔧 Implementation Plan

### Phase 1: Python Backend Implementation

#### 1.1 Create Python Backend Structure
**Location**: `Agents-Hub/new-backend/`

**Files to Create:**
```
new-backend/
├── main.py                 # FastAPI app (port 8000)
├── requirements.txt        # Dependencies
├── .env.example           # Environment variables
├── services/
│   ├── __init__.py
│   ├── gemini_service.py  # From Reference (personality generation - always used)
│   ├── ipfs_service.py    # From Reference (PINATA_JWT, enhance for file uploads)
│   └── masumi_service.py  # From Reference (DID generation - optional)
├── routes/
│   ├── __init__.py
│   └── agent.py           # Agent endpoints
└── models/
    ├── __init__.py
    └── schemas.py         # Pydantic models
```

**Note**: NO `data/agents.json` - Agents fetched from wallet, not stored in backend.

#### 1.2 Implement Create Agent Endpoint

**File**: `new-backend/routes/agent.py`

**Endpoint**: `POST /api/agents/create` (matches Reference `/create`)

**Implementation Notes:**
- Use `@independenceee/cip68generator` in frontend (like Reference)
- No Aiken policy needed for minting (CIP-68 generator handles it)
- Backend only generates metadata/hashes
- Frontend builds CIP-68 transaction

**Steps:**
1. **Receive multipart/form-data** (name, purpose, instructions, personality, skills, llmModel, owner, picture)
2. **Validate required fields** (name, purpose, instructions, owner)
3. **Upload image to IPFS** (if provided)
   - Use `ipfs_service.py` from Reference
   - Enhance to support file uploads (PINATA_JWT only)
   - Returns `image_ipfs_cid`
4. **Generate personality** (ALWAYS - even if provided, regenerate with Gemini)
   - Use `gemini_service.py` from Reference
   - Always call Gemini (if GEMINI_API_KEY is set)
   - Use provided `name` and `purpose` as context
   - Instruction: `f"Create a unique AI agent personality named {name} with purpose: {purpose}"`
5. **Upload personality to IPFS**
   - Upload personality text (not full metadata JSON)
   - Use `ipfs_service.py` from Reference
   - Returns IPFS hash (brain_cid / ipfs_hash)
6. **Generate genetic hash**
   - Hash of: name, purpose, instructions, personality (generated), skills, llmModel, timestamp
   - Use SHA-256, take first 16 characters
   - Same algorithm as TypeScript: `hashlib.sha256(json.dumps(genetic_data, sort_keys=True).encode()).hexdigest()[:16]`
   - **Purpose**: 
     - Deterministic child generation (breeding/fusion)
     - Asset naming (used in asset name generation)
     - Transaction validation (can be verified on-chain)
7. **Generate Masumi DID** (OPTIONAL - only if MASUMI_API_KEY is set)
   - Use `masumi_service.py` from Reference
   - Format: `did:masumi:testnet:agent-{uuid}`
   - Return `None` if API key not set
8. **Return response** (metadata only, NO agent storage, NO transaction)
   - Format matches Reference `/create` endpoint

**Response Format (matches Reference):**
```python
{
  "ipfs_hash": "QmHash...",           # IPFS CID of personality (brain_cid)
  "personality_text": "You are...",   # Generated personality text
  "masumi_did": "did:masumi:...",      # Optional - None if API key not set
  "image_ipfs_cid": "QmImageHash...",  # Optional - None if no image
  "genetic_hash": "abc123def456"       # For frontend transaction building
}
```

**Note**: Response matches Reference `/create` endpoint format for consistency.

#### 1.3 Dependencies

**requirements.txt:**
```python
# Core Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6  # For file uploads

# Services (from Reference)
google-generativeai==0.4.1
requests==2.31.0
python-dotenv==1.0.0

# No storage needed - agents fetched from wallet
```

**Environment Variables (.env):**
```env
# Server
PORT=8000
CARDANO_NETWORK=testnet

# IPFS (Pinata) - JWT only
PINATA_JWT=your_jwt_here

# Gemini (required - always used for personality generation)
GEMINI_API_KEY=your_key_here

# Masumi (optional - only if API key set)
MASUMI_API_KEY=your_key_here  # Optional
```

---

### Phase 2: Frontend Integration

#### 2.1 Update CreateAgent Component

**File**: `Agents-Hub/frontend/src/components/CreateAgent.tsx`

**Changes Needed:**

1. **Update API URL** (line 166)
   - Change from `http://localhost:5000` to `http://localhost:8000`
   - Or use environment variable: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`

2. **Update response handling** (lines 180-241)
   - Remove `agent` object from response (backend doesn't return it)
   - Handle Reference format: `ipfs_hash`, `personality_text`, `masumi_did`, `genetic_hash`
   - Remove `mintTx` and `mintError` handling

3. **Add Mesh SDK transaction building** (after receiving backend response)
   - Import `@independenceee/cip68generator` (CIP-68 support)
   - Build CIP-68 transaction using metadata from backend
   - Use Reference `mintGenesisAgent` function as template

4. **Update mint modal flow** (lines 267-417)
   - Keep UI the same
   - Change transaction source: from backend `mintTx` to frontend-built CIP-68 transaction
   - Keep Lace wallet signing (already implemented)
   - Remove `POST /api/submit-tx` call
   - Submit directly using `wallet.submitTx()`
   - Remove `POST /api/agents/:id/mint-complete` call (no backend storage)

5. **Add transaction building utility**
   - Create `frontend/src/utils/mintAgent.ts` (copy from Reference)
   - Use `@independenceee/cip68generator` for CIP-68 minting
   - Include genetic hash, Masumi DID in metadata

#### 2.2 Transaction Building Function

**File**: `Agents-Hub/frontend/src/utils/mintAgent.ts` (NEW - Copy from Reference)

**Function**: `mintGenesisAgent(wallet, metadata)`

**Implementation (from Reference):**
```typescript
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";
import { Cip68Contract } from "@independenceee/cip68generator";

const blockfrostKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID || "";
const blockfrostProvider = new BlockfrostProvider(blockfrostKey);
const meshTxBuilder = new MeshTxBuilder({
  fetcher: blockfrostProvider,
  evaluator: blockfrostProvider,
  submitter: blockfrostProvider,
});

export async function mintGenesisAgent(wallet: any, metadata: any) {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  // Initialize CIP-68 Generator Helper
  const cip68Contract = new Cip68Contract({
    wallet: wallet,
    fetcher: blockfrostProvider,
    meshTxBuilder: meshTxBuilder,
  });

  // Generate unique asset name
  const uniqueHandle = generateAssetName("Agent");

  // Build CIP-68 transaction
  const unsignedTx = await cip68Contract.mint({
    assetName: uniqueHandle, 
    quantity: "1",
    metadata: metadata
  });

  return unsignedTx;
}
```

**Metadata Structure (matches Reference):**
```typescript
{
  name: agentName,
  image: "ipfs://QmImageHash...",  // Optional
  mediaType: "image/jpg",
  description: `AI Agent - Linked to ${masumiDid}`,
  properties: {
    generation: 0,
    xp: 0,
    breed_count: 0,
    brain_cid: `ipfs://${ipfsHash}`,  // Personality IPFS hash
    masumi_did: masumiDid,             // Optional
    genetic_hash: geneticHash           // For breeding/validation
  }
}
```

#### 2.3 Update CreateAgent Flow

**Current Code (lines 136-250):**
```typescript
const handleCreateAgent = async () => {
  // ... validation ...
  
  const response = await axios.post('http://localhost:5000/api/agents/create', formDataToSend);
  
  const agent = response.data.agent;
  
  if (response.data.mintTx) {
    setPendingMintTx(response.data.mintTx);  // ❌ REMOVE
    // ...
  }
}
```

**Updated Code:**
```typescript
const handleCreateAgent = async () => {
  // ... validation ...
  
  // Step 1: Call Python backend (port 8000)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const response = await axios.post(`${API_URL}/api/agents/create`, formDataToSend);
  
  // Response format: { ipfs_hash, personality_text, masumi_did, image_ipfs_cid, genetic_hash }
  
  // Step 2: Build CIP-68 metadata (like Reference)
  setProgressStep('minting');
  
  try {
    // Get connected wallet (Lace)
    const wallet = await getConnectedWallet();
    
    // Create CIP-68 metadata (like Reference)
    const metadata = createAgentMetadata(
      formData.name,                    // Agent name
      response.data.ipfs_hash,          // Brain CID (personality IPFS hash)
      response.data.masumi_did || '',  // Masumi DID (optional)
      {
        generation: 0,
        xp: 0,
        breed_count: 0
      }
    );
    
    // Add genetic hash to metadata properties
    if (metadata.properties) {
      metadata.properties.genetic_hash = response.data.genetic_hash;
    }
    
    // Add image if provided
    if (response.data.image_ipfs_cid) {
      metadata.image = `ipfs://${response.data.image_ipfs_cid}`;
    }
    
    // Build CIP-68 transaction
    const unsignedTx = await mintGenesisAgent(wallet, metadata);
    
    // Store for signing
    setPendingMintTx({
      unsignedTx: unsignedTx,
      txHash: `tx_${response.data.genetic_hash}_${Date.now()}`,
      message: 'Sign this transaction to mint your agent as an NFT'
    });
    
    setProgressStep('complete');
    setTimeout(() => setShowProgress(false), 1000);
  } catch (error) {
    // Handle transaction building error - show error, allow retry
    setProgressStep('error');
    setErrorMessage('Failed to build transaction: ' + (error.message || 'Unknown error'));
    // User can retry by clicking "Create Agent" again
  }
}
```

#### 2.4 Update Mint Modal Signing

**Current Code (lines 290-394):**
```typescript
onClick={async () => {
  // ... wallet connection ...
  
  const witnessSet = await walletApi.signTx(pendingMintTx.unsignedTx, true);
  
  // Submit via backend ❌ REMOVE
  const response = await axios.post('http://localhost:5000/api/submit-tx', {
    unsignedTx: pendingMintTx.unsignedTx,
    witnessSet: witnessSet
  });
  
  // ...
}}
```

**Updated Code:**
```typescript
onClick={async () => {
  // ... wallet connection ...
  
  try {
    // Sign transaction
    const signedTx = await walletApi.signTx(pendingMintTx.unsignedTx, true);
    
    // Submit directly to Cardano ✅ NEW
    const txHash = await walletApi.submitTx(signedTx);
    
    // Show success message
    alert(
      `🎉 NFT Minted!\n\n` +
      `Transaction: ${txHash}\n` +
      `Your agent will appear in your ${walletName} wallet in 2-3 minutes.\n\n` +
      `Check CardanoScan: https://preprod.cardanoscan.io/transaction/${txHash}`
    );
    
    // Close modal
    setPendingMintTx(null);
    setCreatedAgent(null);
    
    // Reload agents from wallet (like Reference)
    // Frontend will fetch agents from wallet, not backend
    onAgentCreated(null); // Trigger wallet refresh
    
  } catch (error: any) {
    // Error handling - show error, allow retry
    if (error.code === -2) {
      alert('Transaction cancelled by user.');
    } else if (error.message?.includes('User declined')) {
      alert('Transaction declined by user.');
    } else if (error.message?.includes('insufficient')) {
      alert('Insufficient funds! You need testnet ADA.\n\nGet free ADA from: https://docs.cardano.org/cardano-testnets/tools/faucet/');
    } else {
      alert(`Failed to sign/submit transaction: ${error.message || 'Unknown error'}\n\nYou can try again.`);
    }
  }
}}
```

#### 2.5 Wallet Connection Helper

**File**: `Agents-Hub/frontend/src/utils/wallet.ts` (NEW or update existing)

**Function**: `getConnectedWallet()`

**Implementation:**
```typescript
export async function getConnectedWallet() {
  if (!window.cardano) {
    throw new Error('No Cardano wallet found! Please install Lace wallet from https://www.lace.io/');
  }

  // Prefer Lace wallet (primary)
  if (window.cardano.lace) {
    console.log('🔐 Connecting to Lace wallet...');
    return await window.cardano.lace.enable();
  }
  
  // Fallback to other wallets
  if (window.cardano.nami) {
    console.log('🔐 Connecting to Nami wallet...');
    return await window.cardano.nami.enable();
  }
  
  if (window.cardano.eternl) {
    console.log('🔐 Connecting to Eternl wallet...');
    return await window.cardano.eternl.enable();
  }
  
  throw new Error('No supported wallet found! Please install Lace, Nami, or Eternl wallet.');
}
```

#### 2.6 Wallet Agent Fetching (Like Reference)

**File**: `Agents-Hub/frontend/src/utils/walletAgents.ts` (NEW - Copy from Reference)

**Function**: `getUserAgents(wallet)`

**Purpose**: Fetch agents from connected wallet (CIP-68 User Tokens, label 222)

**Implementation**: Copy from `Reference/agent-hub/src/utils/walletAgents.ts`

**Usage**: Update Dashboard/MyAgents components to fetch from wallet instead of backend.

---

### Phase 3: Backend Endpoint Updates

#### 3.1 Keep Existing Endpoints (Adapted for Python)

- `GET /api/agent/:tokenId` - Get agent metadata from blockchain (via Blockfrost)
  - Fetch from blockchain, not storage
  - Use `blockchain_service.py` from Reference
  
- `POST /api/agent/query` - Query agent using LLM
  - Keep as-is, but fetch agent from blockchain first

#### 3.2 Remove Endpoints (Not Needed)

- `POST /api/agents/:id/mint-complete` - No backend storage
- `GET /api/agents` - Frontend fetches from wallet
- `POST /api/build-mint-tx` - Frontend builds transactions
- `POST /api/submit-tx` - Frontend submits directly
- `POST /api/wallet/convert-address` - Frontend handles this
- All agent storage endpoints - No backend storage

---

## 🔄 Migration Steps

### Step 1: Python Backend Setup
1. Create `new-backend/` directory structure
2. Copy services from Reference (Gemini, IPFS, Masumi)
3. Create agent storage service
4. Implement `POST /api/agents/create` endpoint
5. Test endpoint with Postman/curl

### Step 2: Frontend Transaction Building
1. Create `mintAgent.ts` utility
2. Add Mesh SDK transaction building
3. Update `CreateAgent.tsx` to use new flow
4. Test transaction building (without signing)

### Step 3: Lace Wallet Integration
1. Update wallet connection helper
2. Update mint modal signing flow
3. Test full flow: create → build → sign → submit

### Step 4: Testing & Validation
1. Test with Python backend
2. Test with Lace wallet
3. Test with other wallets (Nami, Eternl)
4. Verify agent creation and minting
5. Verify UI remains unchanged

---

## 📋 Detailed File Changes

### Backend Files

#### `new-backend/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import agent

app = FastAPI(title="Agents Hub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "message": "Agents Hub API is running"}
```

#### `new-backend/routes/agent.py`
```python
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from services.ipfs_service import upload_to_ipfs
from services.gemini_service import generate_personality
from services.masumi_service import generate_masumi_did
import hashlib
import json
from datetime import datetime
import os

router = APIRouter()

@router.post("/agents/create")
async def create_agent(
    name: str = Form(...),
    purpose: str = Form(...),
    instructions: str = Form(...),
    personality: str = Form(""),  # Ignored - always regenerate
    skills: str = Form(""),
    llmModel: str = Form("x-ai/grok-4.1-fast:free"),
    owner: str = Form(...),
    picture: UploadFile = File(None)
):
    # 1. Validate
    if not name or not purpose or not instructions or not owner:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # 2. Upload image to IPFS (if provided)
    image_ipfs_cid = None
    if picture:
        # Read file content
        image_content = await picture.read()
        # Upload to IPFS (enhance ipfs_service.py for file uploads)
        image_ipfs_cid = await upload_image_to_ipfs(image_content, picture.filename)
    
    # 3. Generate personality (ALWAYS - even if provided)
    try:
        personality_text = generate_personality(
            f"Create a unique AI agent personality named {name} with purpose: {purpose}",
            {}
        )
    except Exception as e:
        # Fallback if Gemini fails
        personality_text = f"A helpful AI agent named {name} with purpose: {purpose}"
    
    # 4. Upload personality to IPFS (brain_cid)
    ipfs_hash = upload_to_ipfs(personality_text)
    
    # 5. Generate genetic hash
    skills_list = [s.strip() for s in skills.split(",") if s.strip()]
    timestamp = datetime.utcnow().isoformat() + "Z"
    genetic_data = {
        "name": name,
        "purpose": purpose,
        "instructions": instructions,
        "personality": personality_text,  # Use generated personality
        "skills": sorted(skills_list),  # Sort for consistency
        "llmModel": llmModel,
        "timestamp": timestamp
    }
    genetic_hash = hashlib.sha256(
        json.dumps(genetic_data, sort_keys=True).encode()
    ).hexdigest()[:16]
    
    # 6. Generate Masumi DID (OPTIONAL - only if API key set)
    masumi_did = None
    if os.getenv("MASUMI_API_KEY"):
        try:
            masumi_did = generate_masumi_did()
        except:
            masumi_did = None
    
    # 7. Return response (matches Reference format)
    return {
        "ipfs_hash": ipfs_hash,
        "personality_text": personality_text,
        "masumi_did": masumi_did,  # None if API key not set
        "image_ipfs_cid": image_ipfs_cid,  # None if no image
        "genetic_hash": genetic_hash
    }
```

### Frontend Files

#### `frontend/src/utils/mintAgent.ts` (NEW - Copy from Reference)

**Copy from**: `Reference/agent-hub/src/utils/mintAgent.ts`

**Dependencies to Install:**
```bash
npm install @independenceee/cip68generator
```

**Implementation** (matches Reference exactly):
```typescript
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";
import { Cip68Contract } from "@independenceee/cip68generator";

const blockfrostKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID || "";
const blockfrostProvider = new BlockfrostProvider(blockfrostKey);
const meshTxBuilder = new MeshTxBuilder({
  fetcher: blockfrostProvider,
  evaluator: blockfrostProvider,
  submitter: blockfrostProvider,
});

function generateAssetName(prefix: string = "Agent"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}

export async function mintGenesisAgent(wallet: any, metadata: any) {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  const cip68Contract = new Cip68Contract({
    wallet: wallet,
    fetcher: blockfrostProvider,
    meshTxBuilder: meshTxBuilder,
  });

  console.log("Tx: Building CIP-68 Mint Transaction for Genesis Agent...");
  const uniqueHandle = generateAssetName("Agent");
  
  const unsignedTx = await cip68Contract.mint({
    assetName: uniqueHandle, 
    quantity: "1",
    metadata: metadata
  });

  return unsignedTx;
}
```

**Note**: No Aiken policy needed - CIP-68 generator handles minting policy.

#### `frontend/src/components/CreateAgent.tsx` (UPDATES)

**Key Changes:**
1. Import `mintGenesisAgent` from utils
2. Remove `mintTx` from response handling
3. Build transaction after receiving backend response
4. Update mint modal to submit directly

---

## ✅ Success Criteria

1. ✅ Python backend returns metadata only (no transactions, no storage)
2. ✅ Frontend builds CIP-68 transactions using @independenceee/cip68generator
3. ✅ Lace wallet integration works seamlessly
4. ✅ UI remains unchanged (user experience preserved)
5. ✅ Agent creation and minting flow works end-to-end
6. ✅ Genetic hash matches TypeScript algorithm
7. ✅ Masumi DID generated correctly (optional)
8. ✅ IPFS uploads work (personality text and image)
9. ✅ Agents fetched from wallet (not backend storage)
10. ✅ Gemini personality generation always used
11. ✅ Response format matches Reference

---

## ⚠️ Important Notes

### UI Preservation
- **No visual changes** - Keep all modals, progress indicators, buttons
- **Same user flow** - Create → Progress → Mint Modal → Sign → Success
- **Only backend change** - API response format changes, frontend adapts

### Backward Compatibility
- Python backend must match TypeScript response format (except removing mintTx)
- Frontend must handle both old and new response formats during transition
- Consider feature flag for gradual rollout

### Error Handling
- Backend errors: Return clear error messages
- Transaction building errors: Show in UI, allow retry
- Wallet errors: Handle user cancellation, insufficient funds, etc.

---

## 📝 Testing Checklist

### Backend Testing
- [ ] Test `POST /api/agents/create` with all fields
- [ ] Test with image upload (PINATA_JWT)
- [ ] Test without image
- [ ] Test personality generation (Gemini - always used)
- [ ] Test genetic hash generation (matches TypeScript algorithm)
- [ ] Test Masumi DID generation (optional - only if API key set)
- [ ] Test IPFS uploads (personality text and image)
- [ ] Test response format (matches Reference)
- [ ] Verify no agent storage (agents fetched from wallet)

### Frontend Testing
- [ ] Test CIP-68 transaction building with @independenceee/cip68generator
- [ ] Test Lace wallet connection (primary)
- [ ] Test transaction signing
- [ ] Test transaction submission (direct to Cardano)
- [ ] Test error handling (show error, allow retry)
- [ ] Test UI flow (no visual changes)
- [ ] Test with other wallets (Nami, Eternl)
- [ ] Test wallet agent fetching (like Reference)
- [ ] Test API URL configuration (default port 8000)

### Integration Testing
- [ ] Full flow: Create → Build → Sign → Submit
- [ ] Verify agent appears in wallet (CIP-68 User Token)
- [ ] Verify agent metadata on blockchain (CIP-68 properties)
- [ ] Verify agent fetched from wallet (not backend storage)
- [ ] Verify genetic hash in metadata
- [ ] Verify Masumi DID in metadata (if generated)

---

## 🚀 Deployment Steps

1. **Deploy Python Backend**
   - Start on port 5000 (or configure)
   - Update frontend API URL if needed
   - Test health endpoint

2. **Update Frontend**
   - Add transaction building utility
   - Update CreateAgent component
   - Test with Python backend

3. **Gradual Rollout**
   - Feature flag for new flow
   - Monitor errors
   - Rollback plan if issues

---

---

## ❓ Clarifications Needed

### Question 1: Frontend API URL Port
You mentioned "It should be 3000 as default" - Did you mean:
- **Option A**: Frontend runs on port 3000, backend on port 8000 (API calls to 8000)
- **Option B**: Frontend API URL defaults to port 3000 (but backend is on 8000)

**Recommendation**: Frontend on port 3000 (or current Vite port), backend on port 8000, API calls to `http://localhost:8000`

### Question 2: Genetic Hash Purpose
**Why genetic hash is used:**
- **Deterministic child generation**: When breeding two agents, the genetic hash ensures the same parents + seed always produce the same child
- **Asset naming**: Used to generate unique asset names (e.g., `Agent{geneticHash.substring(0, 8)}`)
- **Transaction validation**: Can be verified on-chain in smart contracts
- **Lineage tracking**: Helps track agent ancestry and prevent duplicate breeding

**Should we keep it?** ✅ Yes - It's essential for breeding/fusion logic.

### Question 3: Aiken Policy (from Reference)
**Reference uses**: `@independenceee/cip68generator` - No Aiken policy needed for minting
**Current TypeScript uses**: Aiken policy with specific policy ID

**Confirmation needed**: Should we use CIP-68 generator (like Reference) or keep Aiken policy?

**Recommendation**: Use CIP-68 generator (like Reference) - simpler, no Aiken policy needed.

---

**Last Updated**: [Current Date]
**Status**: Planning Complete - Awaiting Final Confirmation
**Estimated Effort**: 8-12 hours

