# Agents Hub - Complete Technology Stack

## 📋 Project Overview
Full-stack Cardano NFT agent fusion platform with deterministic breeding, IPFS metadata storage, and on-chain minting.

---

## 💻 Programming Languages

### **Frontend**
- **TypeScript** (v5.2.2) - Primary language for type-safe React development
- **JavaScript** (ES2020+) - Runtime execution
- **CSS3** - Styling and animations
- **HTML5** - Markup (via JSX/TSX)

### **Backend**
- **TypeScript** (v5.3.3) - Server-side logic with type safety
- **Node.js** (v18+) - JavaScript runtime environment

### **Smart Contracts**
- **Haskell** - Plutus validator pseudocode (AgentBreeding.hs)
- **Plutus** - Cardano smart contract framework (planned deployment)

---

## 🎨 Frontend Technologies

### **Core Framework**
- **React** (v18.2.0) - UI component library
- **React DOM** (v18.2.0) - DOM rendering
- **Vite** (v5.0.8) - Build tool and dev server (ESBuild-powered)

### **Blockchain Integration**
- **Lucid Cardano** (v0.10.7) - Cardano transaction building library
- **@emurgo/cardano-serialization-lib-browser** (v11.5.0) - WASM library for Cardano operations
- **@cardano-foundation/cardano-connect-with-wallet** (v0.2.5) - CIP-30 wallet connector
- **CIP-30** - Cardano wallet standard (Nami/Eternl/Lace compatibility)

### **HTTP & Data**
- **Axios** (v1.6.2) - HTTP client for API calls

### **Development Tools**
- **@vitejs/plugin-react** (v4.2.1) - React Fast Refresh
- **TypeScript ESLint** (v6.14.0) - Linting
- **ESLint** (v8.55.0) - Code quality
- **eslint-plugin-react-hooks** (v4.6.0) - React hooks linting

---

## ⚙️ Backend Technologies

### **Server Framework**
- **Express.js** (v4.18.2) - Web application framework
- **Node.js** (v18+) - Runtime environment
- **tsx** (v4.7.0) - TypeScript execution and watch mode

### **Blockchain Integration**
- **@emurgo/cardano-serialization-lib-nodejs** (v11.5.0) - Cardano transaction building
- **Blockfrost API** - Cardano testnet RPC provider
- **Cardano Testnet** - Blockchain network (preprod/preview)

### **IPFS & Storage**
- **nft.storage API** - Decentralized IPFS pinning service
- **IPFS Protocol** - Content-addressed storage
- **Axios** (v1.6.2) - HTTP requests to IPFS/Blockfrost

### **AI & LLM**
- **OpenAI API** (v4.20.1) - GPT-based agent intelligence
- **GPT-3.5-turbo** / **GPT-4** - Language model for agent queries

### **Middleware & Utilities**
- **CORS** (v2.8.5) - Cross-origin resource sharing
- **dotenv** (v16.3.1) - Environment variable management
- **crypto** (Node.js built-in) - SHA-256 hashing for genetic algorithms

### **Development Tools**
- **TypeScript** (v5.3.3) - Type checking
- **@types/express** (v4.17.21) - TypeScript definitions
- **@types/node** (v20.10.5) - Node.js type definitions
- **ESLint** (v8.55.0) - Code quality

---

## 🔗 Blockchain & Web3 Technologies

### **Cardano Ecosystem**
- **Plutus** - Smart contract platform (Haskell-based)
- **CIP-30** - dApp wallet connector standard
- **CIP-25** - NFT metadata standard
- **Extended UTXO Model** - Cardano's accounting system
- **Native Tokens** - Asset minting (no gas for transfers)

### **APIs & Services**
- **Blockfrost** - Cardano API provider (testnet queries)
- **Cardano Testnet Faucet** - Free test ADA
- **IPFS Gateway** - Content retrieval (ipfs.io)

### **Wallets**
- **Nami Wallet** (now Lace) - Browser extension wallet
- **Eternl Wallet** - Multi-chain Cardano wallet
- **Lace Wallet** - Nami successor with advanced features

---

## 📦 Package Managers & Build Tools

### **Package Management**
- **npm** (Node Package Manager) - Dependency management
- **package.json** - Project manifest and scripts
- **package-lock.json** - Dependency lock file

### **Build & Compilation**
- **Vite** - Frontend bundler (Rollup-based)
- **ESBuild** - Ultra-fast JavaScript/TypeScript bundler
- **TypeScript Compiler (tsc)** - Type checking and compilation
- **Rollup** (via Vite) - Production bundling

### **Module Systems**
- **ES Modules (ESM)** - Modern JavaScript module system
- **CommonJS** - Node.js legacy support
- **TypeScript Modules** - Typed imports/exports

---

## 🗄️ Data Storage & Management

### **Current Implementation**
- **In-Memory Storage** - Mock data for demo (MOCK_AGENTS, MOCK_PARENTS)
- **localStorage** - Browser storage for wallet address persistence

### **Planned/Recommended**
- **Supabase** - PostgreSQL-based backend-as-a-service
- **PostgreSQL** - Relational database for agent metadata
- **IPFS** - Decentralized file storage for NFT metadata
- **Cardano Blockchain** - Source of truth for ownership

### **Caching Strategy**
- **Browser Cache** - Static assets
- **API Response Caching** - Future optimization

---

## 🛠️ Development Tools & Environment

### **IDE & Extensions**
- **VS Code** - Primary development environment
- **VS Code Tasks** - Automated build/run scripts
- **.vscode/tasks.json** - Project task definitions

### **Version Control**
- **Git** - Source control
- **.gitignore** - Exclusion patterns

### **Terminal & Shell**
- **zsh** - macOS default shell
- **npm scripts** - Task automation

### **Environment Management**
- **.env** - Environment variables (backend)
- **dotenv** - Environment loader

---

## 🔐 Security & Standards

### **Cryptography**
- **SHA-256** - Genetic hash generation
- **WASM** - Cardano serialization (secure execution)
- **Ed25519** - Cardano signature scheme (via wallet)

### **Web Standards**
- **CORS** - Cross-origin security
- **CIP-30** - Cardano wallet standard
- **CIP-25** - NFT metadata standard
- **JSON** - Data interchange format

### **API Security**
- **API Keys** - Service authentication
- **Environment Variables** - Secret management
- **HTTPS** - Encrypted communication (production)

---

## 🌐 APIs & External Services

### **Blockchain APIs**
- **Blockfrost API** - Cardano testnet queries
  - Endpoints: `/addresses`, `/assets`, `/tx/submit`
  - Rate limits: 10 req/sec (free tier)

### **IPFS Services**
- **nft.storage API** - Free IPFS pinning (100GB)
- **IPFS HTTP Gateway** - Content retrieval

### **AI Services**
- **OpenAI API** - GPT model access
  - Models: gpt-3.5-turbo, gpt-4
  - Rate limits: Based on subscription

### **Wallet APIs**
- **CIP-30 Standard Methods**:
  - `enable()` - Connect wallet
  - `getUsedAddresses()` - Fetch addresses
  - `signTx()` - Sign transactions
  - `submitTx()` - Submit to chain

---

## 📊 Project Structure Technologies

### **Monorepo Structure**
```
Agents Hub/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── contracts/         # Plutus + Haskell
└── .vscode/          # VS Code configuration
```

### **Configuration Files**
- **tsconfig.json** - TypeScript compiler options (frontend & backend)
- **vite.config.ts** - Vite build configuration
- **package.json** - Dependencies and scripts
- **.env** - Environment variables
- **.gitignore** - Git exclusions
- **tasks.json** - VS Code task automation

---

## 🚀 Deployment Technologies (Future)

### **Frontend Hosting**
- **Vercel** - Recommended (automatic Vite builds)
- **Netlify** - Alternative
- **IPFS** - Fully decentralized option

### **Backend Hosting**
- **Railway** - Recommended for Node.js
- **Render** - Alternative
- **AWS/GCP** - Enterprise scale

### **Database**
- **Supabase** - Managed PostgreSQL
- **Self-hosted PostgreSQL** - Full control

### **Domain & DNS**
- **Cloudflare** - DNS + CDN
- **ENS** - Ethereum Name Service (cross-chain)

---

## 📈 Monitoring & Analytics (Future)

### **Application Monitoring**
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Mixpanel** - User analytics

### **Blockchain Monitoring**
- **Cardano Explorer** - Transaction tracking
- **Blockfrost Dashboard** - API usage metrics

---

## 🧪 Testing Technologies (Future Enhancement)

### **Recommended Stack**
- **Vitest** - Vite-native test runner
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **Jest** - Alternative test framework
- **Plutus Emulator** - Smart contract testing

---

## 🎯 Key Technology Decisions

### **Why React?**
✅ Industry standard for Web3 dApps  
✅ Large ecosystem of wallet connectors  
✅ Component reusability  

### **Why TypeScript?**
✅ Type safety reduces bugs  
✅ Better IDE support  
✅ Self-documenting code  

### **Why Vite?**
✅ 10-100x faster than Webpack  
✅ Instant HMR (Hot Module Replacement)  
✅ Modern ESM-first approach  

### **Why Express?**
✅ Minimalist and flexible  
✅ Huge middleware ecosystem  
✅ Industry standard for Node.js APIs  

### **Why Lucid Cardano?**
✅ Modern, TypeScript-native  
✅ Simpler than cardano-serialization-lib  
✅ Active maintenance  

### **Why Blockfrost?**
✅ Managed infrastructure (no node setup)  
✅ Free testnet tier  
✅ Well-documented API  

---

## 📚 Learning Resources

### **Cardano Development**
- [Cardano Docs](https://docs.cardano.org/)
- [Lucid Documentation](https://lucid.spacebudz.io/)
- [Plutus Pioneer Program](https://plutus-pioneer-program.readthedocs.io/)

### **React & TypeScript**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

### **Web3 Development**
- [CIP Standards](https://cips.cardano.org/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [nft.storage Guide](https://nft.storage/docs/)

---

## 🔄 Version History

- **v0.1.0** - Initial MVP with mock data
- **Current** - Hackathon demo with testnet integration
- **Planned** - Supabase integration, mainnet deployment

---

## 📝 Notes

- All Cardano operations use **testnet** for safety
- API keys optional (demo mode fallback available)
- Smart contracts are pseudocode (deployment pending)
- Frontend runs on port **3000**, backend on **5000**
- Project uses **ES Modules** throughout (`.js` imports in TypeScript)

---

**Last Updated**: November 25, 2025  
**Project Status**: MVP Complete, Ready for Hackathon Demo
