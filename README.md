# Agents Hub 🧬

**Fuse AI agents, mint NFTs, unleash combined capabilities on Cardano.**

A hackathon MVP demonstrating deterministic agent fusion with on-chain NFT minting on Cardano testnet.

---

## 🎯 Project Summary

Select two parent AI agents → Execute deterministic fusion → Pin metadata to IPFS → Mint child NFT on Cardano → Demonstrate combined skills via LLM.

**Key Features:**
- ✅ Deterministic fusion algorithm
- ✅ IPFS metadata pinning
- ✅ Cardano testnet NFT minting
- ✅ LLM-powered agent capabilities demo
- ✅ 95/5 earnings split (owner/platform)

---

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Frontend  │ ───▶ │   Backend   │ ───▶ │   Cardano    │
│ React+Vite  │      │  Express.js │      │   Testnet    │
│             │      │             │      │  (Blockfrost)│
└─────────────┘      └─────────────┘      └──────────────┘
       │                    │                      
       │                    ▼                      
       │             ┌─────────────┐              
       │             │    IPFS     │              
       │             │ (nft.storage)│              
       │             └─────────────┘              
       │                                          
       └───▶ Wallet Connect (CIP-30) ────────────┘
```

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, Lucid Cardano
- **Backend:** Node.js, Express, TypeScript
- **Smart Contracts:** Plutus (simplified for MVP)
- **IPFS:** nft.storage / Pinata
- **Blockchain:** Cardano Testnet (Blockfrost API)
- **AI:** OpenAI GPT (agent runtime)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Cardano wallet (Nami or Eternl) with testnet ADA
- (Optional) API keys for nft.storage, Blockfrost, OpenAI

### Installation

```bash
# Clone the repository
cd "Agents Hub"

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Configuration

```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with your API keys (or leave defaults for demo mode)
```

### Running the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open browser to `http://localhost:3000`

---

## 📖 Usage Flow

1. **Connect Wallet** - Click "Connect Wallet" and approve connection
2. **Select Parents** - Choose two different parent agents from the dashboard
3. **Fuse Agents** - Click "Fuse Agents" to start the breeding process
4. **View Fusion Result** - Backend generates genetic hash and pins to IPFS
5. **Mint NFT** - Sign transaction in wallet to mint child NFT on Cardano
6. **Test Agent** - Query the new agent to see combined skills in action
7. **View Earnings** - See 95/5 split visualization

---

## 🧬 Fusion Algorithm

The fusion engine is **deterministic** and **verifiable**:

```typescript
// Merge skills (top 3 from each parent, deduplicated)
const skills = [...new Set([
  ...parentA.skills.slice(0, 3),
  ...parentB.skills.slice(0, 3)
])]

// Compose persona
const persona = `${roleFromA} ${styleFromB} with ${skills}`

// Compute genetic hash (SHA-256)
const hash = sha256({
  skills: skills.sort(),
  persona,
  seed,
  parents: [parentA.id, parentB.id].sort()
})
```

**Properties:**
- Same parents + same seed = same child (reproducible)
- Hash serves as on-chain validation proof
- Off-chain computation, on-chain verification

---

## 🔐 Smart Contract Logic

Plutus validator checks:

```haskell
✓ Signer owns both parent NFTs
✓ Parents are different tokens
✓ Breeding fee paid (10 ADA)
✓ Genetic hash is valid (32 bytes)
✓ Breed count < MAX_BREEDS (optional)
```

See `contracts/AgentBreeding.hs` for validator pseudocode.

---

## 📁 Project Structure

```
Agents Hub/
├── frontend/              # React + TypeScript UI
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── package.json
├── backend/               # Express.js API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Server entry
│   └── package.json
├── contracts/             # Plutus smart contracts
│   ├── AgentBreeding.hs   # Breeding validator
│   └── README.md
└── README.md              # This file
```

---

## 🛠️ API Endpoints

### POST `/api/fuse`
Fuse two parent agents
```json
{
  "parentA_token": "agent001",
  "parentB_token": "agent002",
  "seed": "1234567890"
}
```

### POST `/api/build-mint-tx`
Build unsigned mint transaction
```json
{
  "ipfsCid": "Qm...",
  "geneticHash": "abc123...",
  "parents": ["agent001", "agent002"],
  "ownerAddress": "addr_test1..."
}
```

### POST `/api/agent/query`
Query agent using LLM
```json
{
  "tokenId": "child_abc123",
  "query": "What are your skills?",
  "personaPrompt": "...",
  "skills": ["Python", "Data Analysis"]
}
```

---

## 💰 Economics

| Party | Share | Description |
|-------|-------|-------------|
| Agent Owner | 95% | Receives when others use their agent |
| Platform | 5% | Platform maintenance and development |

**Breeding Fee:** 10 ADA per fusion

---

## 🎯 Hackathon Scope (MVP)

**✅ Implemented:**
- Parent agent selection UI
- Deterministic fusion engine
- IPFS metadata pinning
- Cardano testnet integration
- NFT minting flow
- LLM agent demo
- Fee split visualization

**🚧 Future Enhancements:**
- Full Plutus smart contract deployment
- Model weight merging (actual AI fusion)
- Agent marketplace
- Breeding auctions
- Reputation system
- Mainnet deployment

---

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run build  # Check for TypeScript errors

# Backend
cd backend
npm run build
npm run dev    # Start dev server

# Manual testing
1. Connect testnet wallet
2. Select two parent agents
3. Click "Fuse Agents"
4. Sign transaction in wallet
5. Verify child agent creation
6. Test agent query functionality
```

---

## 🔑 Environment Variables

### Backend (.env)
```bash
PORT=5000
CARDANO_NETWORK=testnet
BLOCKFROST_PROJECT_ID=your_blockfrost_key
NFT_STORAGE_API_KEY=your_nft_storage_key
OPENAI_API_KEY=your_openai_key
PLATFORM_FEE_PERCENTAGE=5
BREEDING_FEE_ADA=10
```

**Note:** App works in demo mode without API keys (uses mock data)

---

## 🐛 Troubleshooting

**Wallet won't connect:**
- Install Nami or Eternl browser extension
- Switch wallet to testnet mode
- Refresh page and try again

**Transaction fails:**
- Ensure wallet has testnet ADA (get from faucet)
- Check Blockfrost project ID is correct
- Verify network is set to testnet

**IPFS pinning fails:**
- App falls back to mock CID for demo
- Add real nft.storage API key for production

---

## 📚 Resources

- [Cardano Testnet Faucet](https://testnets.cardano.org/en/testnets/cardano/tools/faucet/)
- [Nami Wallet](https://namiwallet.io/)
- [Blockfrost API](https://blockfrost.io/)
- [nft.storage](https://nft.storage/)
- [Lucid Cardano Docs](https://lucid.spacebudz.io/)

---

## 👥 Team

Built for Cardano Hackathon 2025

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Cardano Foundation
- IOHK / Input Output
- Emurgo
- Blockfrost team
- Open source community

---

**Ready to fuse some agents? Let's go! 🚀🧬**
