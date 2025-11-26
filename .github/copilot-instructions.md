# Agents Hub - Copilot Instructions

## Project Overview
Full-stack Cardano NFT agent fusion platform for hackathon MVP.

## Tech Stack
- **Frontend**: React + TypeScript + Vite, CIP-30 wallet integration
- **Backend**: Node.js + Express, IPFS pinning, Cardano tx building
- **Contracts**: Plutus validators for minting on Cardano testnet
- **Agent Runtime**: LLM integration (OpenAI/GPT)
- **Database**: Supabase/Postgres

## Key Features
- Select two parent agents and fuse them deterministically
- Pin child metadata to IPFS
- Mint child NFT on Cardano testnet
- Demonstrate combined skills via LLM
- Display fee split (95% owner, 5% platform)

## Architecture Guidelines
- Keep fusion logic deterministic and off-chain
- Validate genetic hash on-chain via Plutus
- Use Blockfrost for testnet interactions
- Minimize LLM API calls to control costs

## Development Rules
- Use testnet only for all Cardano operations
- Keep smart contract validation simple (parent ownership, hash verification)
- Mock data acceptable for demo purposes
- Focus on end-to-end demo flow completion
