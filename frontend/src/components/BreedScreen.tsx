import { useState } from 'react'
import { Agent, FusionResult } from '../types'
import axios from 'axios'
import { meshCardanoService } from '../services/meshService'
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
  const [step, setStep] = useState<'preview' | 'fusing' | 'minting' | 'signing' | 'submitting' | 'confirming'>('preview')
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null)
  const [unsignedTx, setUnsignedTx] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const predictedSkills = [...new Set([...parentA.skills.slice(0, 3), ...parentB.skills.slice(0, 3)])]

  const handleSignAndSubmit = async () => {
    if (!unsignedTx) return

    setStep('signing')
    try {
      // Check for wallet
      if (!window.cardano) {
        throw new Error('No Cardano wallet detected')
      }

      // Try Lace first, then fallback to Nami/Eternl
      let walletApi = window.cardano.lace || window.cardano.nami || window.cardano.eternl
      if (!walletApi) {
        throw new Error('No supported wallet found (Lace, Nami, or Eternl required)')
      }

      console.log('🔐 Requesting wallet signature...')
      
      // Enable wallet and get API
      const enabledApi = await walletApi.enable()
      
      // Request wallet to sign the transaction
      const signedTx = await enabledApi.signTx(unsignedTx, true)
      console.log('✅ Transaction signed by wallet')

      setStep('submitting')
      
      // Submit signed transaction to backend
      const submitResponse = await axios.post('http://localhost:5000/api/submit-breeding-tx', {
        signedTx,
        geneticHash: fusionResult?.geneticHash
      })

      const { txHash: newTxHash } = submitResponse.data
      setTxHash(newTxHash)
      console.log(`📦 Transaction submitted: ${newTxHash}`)

      setStep('confirming')
      
      // Poll for confirmation
      let confirmed = false
      let attempts = 0
      while (!confirmed && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        try {
          const statusResponse = await axios.get(`http://localhost:5000/api/tx-status/${newTxHash}`)
          if (statusResponse.data.confirmed) {
            confirmed = true
            console.log('✅ Transaction confirmed on-chain!')
            alert(`✅ NFT Minted!\n\nTX Hash: ${newTxHash}\n\nView on explorer: https://preprod.cardanoscan.io/transaction/${newTxHash}`)
          }
        } catch (err) {
          console.log(`⏳ Waiting for confirmation... (${attempts + 1}/60)`)
        }
        
        attempts++
      }

      if (confirmed) {
        const childAgent: Agent = {
          id: `child_${Date.now()}`,
          tokenId: `child_${fusionResult!.geneticHash.substring(0, 8)}`,
          ...fusionResult!.metadata,
          ipfsCid: fusionResult!.ipfsCid,
          geneticHash: fusionResult!.geneticHash,
          ownerAddress: walletAddress,
          imageUrl: '👶',
          minted: true,
          txHash: newTxHash
        }
        onFusionComplete(childAgent)
      }
    } catch (error: any) {
      console.error('Signing/submission error:', error)
      if (error.message?.includes('User cancelled')) {
        alert('Transaction signing cancelled')
      } else {
        alert(`Error: ${error.message || 'Failed to sign/submit transaction'}`)
      }
      setStep('minting')
    }
  }

  const handleFuse = async () => {
    setLoading(true)
    setStep('fusing')

    try {
      // Call backend fusion API
      const response = await axios.post<FusionResult>('http://localhost:5000/api/fuse', {
        parentA_token: parentA.tokenId,
        parentB_token: parentB.tokenId,
        seed: Date.now().toString(),
        ownerAddress: walletAddress
      })

      setFusionResult(response.data)
      setStep('minting')

      // Step 2: Query parent NFT UTXOs for breeding
      try {
        const parentUTXOs = await meshCardanoService.getWalletUTXOs(walletAddress)
        console.log(`📦 Found ${parentUTXOs.length} UTXOs for breeding`)
      } catch (err) {
        console.warn('⚠️ Could not query UTXOs:', err)
      }

      // Step 3: Build breeding transaction with Mesh SDK
      try {
        const breedingTx = await meshCardanoService.buildBreedingTransaction({
          parentA: {
            input: { txHash: (parentA.geneticHash || 'mock_hash_a').substring(0, 64), outputIndex: 0 },
            output: { address: walletAddress, amount: [] }
          },
          parentB: {
            input: { txHash: (parentB.geneticHash || 'mock_hash_b').substring(0, 64), outputIndex: 0 },
            output: { address: walletAddress, amount: [] }
          },
          breedingFeeUTXO: {
            input: { txHash: (response.data.geneticHash || 'mock_hash_fee').substring(0, 64), outputIndex: 0 },
            output: { address: walletAddress, amount: [] }
          },
          walletAddress,
          ownerAddress: walletAddress,
          platformAddress: import.meta.env.VITE_PLATFORM_ADDRESS || walletAddress,
          geneticHash: response.data.geneticHash,
          scriptAddress: import.meta.env.VITE_SCRIPT_ADDRESS || '',
          policyId: import.meta.env.VITE_POLICY_ID || ''
        })
        
        if (breedingTx.success) {
          console.log('✅ Breeding transaction built successfully')
          setUnsignedTx(breedingTx.unsignedTx)
        } else {
          console.error('❌ Transaction build failed:', breedingTx.error)
        }
      } catch (err) {
        console.warn('⚠️ Could not build transaction:', err)
      }
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
          <h3>Ready to Mint NFT</h3>
          <p>Sign with your wallet to mint the child agent as an on-chain NFT</p>
          {fusionResult && (
            <div className="fusion-details">
              <p><strong>Child Name:</strong> {fusionResult.metadata.name}</p>
              <p><strong>IPFS CID:</strong> {fusionResult.ipfsCid}</p>
              <p><strong>Genetic Hash:</strong> {fusionResult.geneticHash.substring(0, 16)}...</p>
              <p><strong>Network:</strong> Cardano Preprod Testnet</p>
            </div>
          )}
          <button 
            className="sign-button" 
            onClick={handleSignAndSubmit}
            disabled={!unsignedTx || loading}
          >
            🔐 Sign with Wallet
          </button>
        </div>
      )}

      {step === 'signing' && (
        <div className="status-section">
          <div className="spinner">🔐</div>
          <h3>Signing Transaction...</h3>
          <p>Please approve the transaction in your wallet</p>
        </div>
      )}

      {step === 'submitting' && (
        <div className="status-section">
          <div className="spinner">📤</div>
          <h3>Submitting to Blockchain...</h3>
          <p>Sending signed transaction to Cardano preprod</p>
        </div>
      )}

      {step === 'confirming' && (
        <div className="status-section">
          <div className="spinner">✨</div>
          <h3>Confirming on-chain...</h3>
          <p>Waiting for transaction confirmation (2-3 minutes)</p>
          {txHash && (
            <div className="fusion-details">
              <p><strong>TX Hash:</strong> {txHash.substring(0, 20)}...</p>
              <p>
                <a 
                  href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#667eea', textDecoration: 'underline' }}
                >
                  View on CardanoScan →
                </a>
              </p>
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

        .sign-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 1rem 3rem;
          font-size: 1.2rem;
          font-weight: bold;
          border-radius: 12px;
          cursor: pointer;
          margin-top: 2rem;
        }

        .sign-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sign-button:hover:not(:disabled) {
          transform: scale(1.05);
          transition: transform 0.2s;
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
