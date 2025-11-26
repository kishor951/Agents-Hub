import { useState } from 'react'
import { Agent, FusionResult } from '../types'
import axios from 'axios'
import AgentCard from './AgentCard'

interface BreedScreenProps {
  parentA: Agent
  parentB: Agent
  walletAddress: string
  onFusionComplete: (child: Agent) => void
  onBack: () => void
}

const BreedScreen = ({ parentA, parentB, walletAddress, onFusionComplete, onBack }: BreedScreenProps) => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'preview' | 'fusing' | 'minting'>('preview')
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null)

  const predictedSkills = [...new Set([...parentA.skills.slice(0, 3), ...parentB.skills.slice(0, 3)])]

  const handleFuse = async () => {
    setLoading(true)
    setStep('fusing')

    try {
      // Call backend fusion API
      const response = await axios.post<FusionResult>('/api/fuse', {
        parentA_token: parentA.tokenId,
        parentB_token: parentB.tokenId,
        seed: Date.now().toString()
      })

      setFusionResult(response.data)
      setStep('minting')

      // Call backend to build mint transaction
      await axios.post('/api/build-mint-tx', {
        ipfsCid: response.data.ipfsCid,
        geneticHash: response.data.geneticHash,
        parents: [parentA.tokenId, parentB.tokenId],
        ownerAddress: walletAddress
      })

      // In production, sign and submit transaction via wallet
      // For demo, simulate successful mint
      await new Promise(resolve => setTimeout(resolve, 2000))

      const childAgent: Agent = {
        id: `child_${Date.now()}`,
        tokenId: `child_${response.data.geneticHash.substring(0, 8)}`,
        ...response.data.metadata,
        ipfsCid: response.data.ipfsCid,
        geneticHash: response.data.geneticHash,
        ownerAddress: walletAddress,
        imageUrl: '👶'
      }

      onFusionComplete(childAgent)
    } catch (error) {
      console.error('Fusion error:', error)
      alert('Fusion failed. Please try again.')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="breed-screen">
      <button className="back-button" onClick={onBack}>← Back to Dashboard</button>

      <h2>Agent Fusion</h2>

      <div className="parents-display">
        <div className="parent">
          <h3>Parent A</h3>
          <AgentCard agent={parentA} />
        </div>

        <div className="fusion-arrow">
          {step === 'preview' && '🧬'}
          {step === 'fusing' && '⚡'}
          {step === 'minting' && '⛏️'}
        </div>

        <div className="parent">
          <h3>Parent B</h3>
          <AgentCard agent={parentB} />
        </div>
      </div>

      {step === 'preview' && (
        <div className="preview-section">
          <h3>Predicted Child Traits</h3>
          <div className="predicted-skills">
            {predictedSkills.map((skill, idx) => (
              <span key={idx} className="skill-badge">{skill}</span>
            ))}
          </div>
          <p className="fusion-info">
            Generation: {Math.max(parentA.generation, parentB.generation) + 1}<br />
            Breeding Fee: 10 ADA (9.5 to you, 0.5 platform)
          </p>
          <button className="fuse-action-button" onClick={handleFuse} disabled={loading}>
            🧬 Execute Fusion
          </button>
        </div>
      )}

      {step === 'fusing' && (
        <div className="status-section">
          <div className="spinner">⚡</div>
          <h3>Fusing agents...</h3>
          <p>Generating genetic hash and pinning to IPFS</p>
        </div>
      )}

      {step === 'minting' && (
        <div className="status-section">
          <div className="spinner">⛏️</div>
          <h3>Minting NFT...</h3>
          <p>Creating on-chain transaction on Cardano testnet</p>
          {fusionResult && (
            <div className="fusion-details">
              <p><strong>IPFS CID:</strong> {fusionResult.ipfsCid}</p>
              <p><strong>Genetic Hash:</strong> {fusionResult.geneticHash.substring(0, 16)}...</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .breed-screen {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-button {
          background: #333;
          margin-bottom: 2rem;
        }

        .parents-display {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          align-items: center;
          margin: 2rem 0;
        }

        .parent h3 {
          text-align: center;
          margin-bottom: 1rem;
          color: #888;
        }

        .fusion-arrow {
          font-size: 4rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .preview-section {
          text-align: center;
          margin-top: 3rem;
        }

        .predicted-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin: 1.5rem 0;
        }

        .skill-badge {
          background: #646cff;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .fusion-info {
          color: #888;
          margin: 1.5rem 0;
          line-height: 1.8;
        }

        .fuse-action-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 1rem 3rem;
          font-size: 1.2rem;
          font-weight: bold;
          border-radius: 12px;
          cursor: pointer;
          margin-top: 1rem;
        }

        .fuse-action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-section {
          text-align: center;
          padding: 3rem;
        }

        .spinner {
          font-size: 4rem;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .fusion-details {
          margin-top: 2rem;
          background: #1a1a1a;
          padding: 1.5rem;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.85rem;
          text-align: left;
        }

        .fusion-details p {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

export default BreedScreen
