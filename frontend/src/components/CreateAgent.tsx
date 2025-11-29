import { useState, useEffect } from 'react'
import { Agent } from '../types'
import AgentCreationProgress from './AgentCreationProgress'
import axios from 'axios'

interface CreateAgentProps {
  walletAddress: string
  onAgentCreated: (agent: Agent) => void
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
}

type ProgressStep = 'validating' | 'uploading' | 'saving' | 'minting' | 'complete' | 'error'

interface MintTransaction {
  unsignedTx: string
  txHash: string
  message: string
}

const CreateAgent = ({ walletAddress, onAgentCreated, onStartBreeding }: CreateAgentProps) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedParents, setSelectedParents] = useState<[Agent | null, Agent | null]>([null, null])
  const [showProgress, setShowProgress] = useState(false)
  const [progressStep, setProgressStep] = useState<ProgressStep>('validating')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingMintTx, setPendingMintTx] = useState<MintTransaction | null>(null)
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null)

  // Form state for creating agent
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    instructions: '',
    personality: '',
    skills: '',
    llmModel: 'x-ai/grok-4.1-fast:free',
    picture: null as File | null
  })

  // Free LLM models from Open Router
  const freeModels = [
    { id: 'x-ai/grok-4.1-fast:free', name: 'Grok 4.1 Fast (Free)', provider: 'xAI' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct (Free)', provider: 'Meta' },
    { id: 'microsoft/wizardlm-2-8x22b:free', name: 'WizardLM-2 8x22B (Free)', provider: 'Microsoft' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', provider: 'Mistral' }
  ]

  // Load user's agents
  useEffect(() => {
    loadUserAgents()
  }, [walletAddress])

  const loadUserAgents = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/agents?owner=${walletAddress}`)
      setAgents(response.data.agents || [])
      console.log(`✅ Loaded ${response.data.agents?.length || 0} agents for ${walletAddress}`)
    } catch (error) {
      console.error('Failed to load agents:', error)
      setAgents([])
    }
  }

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleInputChange('picture', file)
  }

  const handleCreateAgent = async () => {
    if (!formData.name || !formData.purpose || !formData.instructions) {
      alert('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    setShowProgress(true)
    setProgressStep('validating')

    try {
      // Step 1: Validating (simulated delay)
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Step 2: Uploading to IPFS
      setProgressStep('uploading')
      
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('purpose', formData.purpose)
      formDataToSend.append('instructions', formData.instructions)
      formDataToSend.append('personality', formData.personality)
      formDataToSend.append('skills', formData.skills)
      formDataToSend.append('llmModel', formData.llmModel)
      formDataToSend.append('owner', walletAddress)
      if (formData.picture) {
        formDataToSend.append('picture', formData.picture)
      }

      const response = await axios.post('http://localhost:5000/api/agents/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Step 3: Saving
      setProgressStep('saving')
      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 4: Minting (building NFT transaction)
      setProgressStep('minting')
      await new Promise(resolve => setTimeout(resolve, 800))

      const createdAgent = response.data.agent
      setCreatedAgent(createdAgent)

      console.log('📦 Agent created:', createdAgent)
      console.log('💳 Mint TX data:', response.data.mintTx)

      if (response.data.mintTx) {
        console.log('🎁 Mint transaction ready:', response.data.mintTx.txHash)
        setPendingMintTx(response.data.mintTx)
        
        // Step 5: Complete
        setProgressStep('complete')
        
        // Close progress modal after a short delay to show the mint modal
        setTimeout(() => {
          setShowProgress(false)
        }, 1000)
        
        // DON'T reset form or reload agents yet - wait for minting
      } else {
        console.log('⚠️ No mint transaction returned from backend')
        
        // Step 5: Complete
        setProgressStep('complete')

        // Reset form
        setFormData({
          name: '',
          purpose: '',
          instructions: '',
          personality: '',
          skills: '',
          llmModel: 'x-ai/grok-4.1-fast:free',
          picture: null
        })

        // Reload agents after creation
        setTimeout(() => {
          loadUserAgents()
          onAgentCreated(createdAgent)
        }, 1500)
      }

    } catch (error: any) {
      console.error('Failed to create agent:', error)
      setProgressStep('error')
      setErrorMessage(error.response?.data?.error || 'Failed to create agent. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectParent = (agent: Agent) => {
    setSelectedParents(prev => {
      const [a, b] = prev
      if (!a) return [agent, b]
      if (!b) return [a, agent]
      return [agent, b] // Replace second if both selected
    })
  }

  const handleBreedSelected = () => {
    if (selectedParents[0] && selectedParents[1]) {
      onStartBreeding(selectedParents[0], selectedParents[1])
    }
  }

  return (
    <div className="create-agent-page">
      {/* Progress Modal */}
      <AgentCreationProgress
        isOpen={showProgress}
        currentStep={progressStep}
        errorMessage={errorMessage}
        onClose={() => {
          setShowProgress(false)
          setProgressStep('validating')
          setErrorMessage('')
        }}
      />

      {/* Mint Transaction Confirmation Modal */}
      {pendingMintTx && createdAgent && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content mint-modal">
            <div className="modal-header">
              <h2>🎉 Agent Created! Ready to Mint NFT</h2>
              <p>Your agent "{createdAgent.name}" has been created and is ready to become an NFT.</p>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                Debug: Modal is visible. TX: {pendingMintTx.txHash}
              </p>
            </div>

            <div className="mint-details">
              <div className="mint-info-row">
                <span className="label">Transaction Hash:</span>
                <span className="value">{pendingMintTx.txHash}</span>
              </div>
              <div className="mint-info-row">
                <span className="label">Message:</span>
                <span className="value">{pendingMintTx.message}</span>
              </div>
            </div>

            <div className="mint-actions">
              <button
                className="mint-btn primary"
                onClick={async () => {
                  try {
                    if (!pendingMintTx) {
                      alert('No transaction to sign')
                      return
                    }

                    // Check if Cardano wallet is available
                    if (!window.cardano) {
                      alert('No Cardano wallet found! Please install Lace wallet from https://www.lace.io/')
                      return
                    }

                    // Try to connect to Lace wallet first, fallback to other wallets
                    let walletApi
                    let walletName = ''

                    if (window.cardano.lace) {
                      console.log('🔐 Connecting to Lace wallet...')
                      walletApi = await window.cardano.lace.enable()
                      walletName = 'Lace'
                    } else if (window.cardano.nami) {
                      console.log('🔐 Connecting to Nami wallet...')
                      walletApi = await window.cardano.nami.enable()
                      walletName = 'Nami'
                    } else if (window.cardano.eternl) {
                      console.log('🔐 Connecting to Eternl wallet...')
                      walletApi = await window.cardano.eternl.enable()
                      walletName = 'Eternl'
                    } else {
                      alert('No supported wallet found! Please install Lace, Nami, or Eternl wallet.')
                      return
                    }

                    console.log(`✅ Connected to ${walletName} wallet`)

                    // Sign the transaction (CIP-30: partial=true returns witness set)
                    console.log('📝 Signing transaction with wallet...')
                    console.log('   Unsigned TX length:', pendingMintTx.unsignedTx.length)
                    console.log('   Unsigned TX (first 100 chars):', pendingMintTx.unsignedTx.substring(0, 100))
                    
                    // partial=true returns witness set that backend will combine
                    const witnessSet = await walletApi.signTx(pendingMintTx.unsignedTx, true)
                    console.log('✅ Transaction signed by wallet!')
                    console.log('   Witness set length:', witnessSet.length)
                    console.log('   Witness set (first 100 chars):', witnessSet.substring(0, 100))

                    // Submit to blockchain via backend
                    console.log('📤 Submitting to blockchain...')
                    const response = await axios.post('http://localhost:5000/api/submit-tx', {
                      unsignedTx: pendingMintTx.unsignedTx,
                      witnessSet: witnessSet
                    })

                    console.log('✅ Transaction submitted!', response.data)
                    
                    alert(
                      `🎉 NFT Minting Started!\n\n` +
                      `Transaction: ${response.data.txHash}\n` +
                      `Network: ${response.data.network || 'preprod'}\n\n` +
                      `Your NFT will appear in your ${walletName} wallet in 2-3 minutes.\n\n` +
                      `Check CardanoScan: https://preprod.cardanoscan.io/transaction/${response.data.txHash}`
                    )

                    // Update agent as minted
                    if (createdAgent) {
                      createdAgent.minted = true
                      createdAgent.txHash = response.data.txHash
                    }

                    setPendingMintTx(null)
                    setCreatedAgent(null)
                    
                    // Reload agents to show updated status
                    setTimeout(() => loadUserAgents(), 3000)
                  } catch (error: any) {
                    console.error('❌ Wallet signing failed:', error)
                    if (error.code === -2) {
                      alert('Transaction cancelled by user.')
                    } else if (error.message?.includes('User declined')) {
                      alert('Transaction declined by user.')
                    } else if (error.message?.includes('insufficient')) {
                      alert('Insufficient funds! You need testnet ADA.\n\nGet free ADA from: https://docs.cardano.org/cardano-testnets/tools/faucet/')
                    } else {
                      alert(`Failed to sign transaction: ${error.message || 'Unknown error'}`)
                    }
                  }
                }}
              >
                🔐 Sign with Lace Wallet
              </button>
              <button
                className="mint-btn secondary"
                onClick={() => {
                  setPendingMintTx(null)
                  setCreatedAgent(null)
                }}
              >
                ✓ Done
              </button>
            </div>

            <div className="mint-info-box">
              <p>
                <strong>ℹ️  What's happening?</strong> Your agent is being minted as an NFT on the Cardano testnet.
                This NFT will live in your Lace wallet and can be viewed on blockchain explorers.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="create-agent-container">
        {/* Header */}
        <div className="page-header">
          <h1>✨ Create Your AI Agents</h1>
          <p>Design and build custom AI agents that become NFTs on Cardano</p>
        </div>

        <div className="create-agent-content">
          {/* Create Agent Form */}
          <div className="create-form-section">
            <h2>🛠️ Agent Builder</h2>
            <div className="create-form">
              <div className="form-group">
                <label htmlFor="name">Agent Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., CodeMaster Pro"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="purpose">Purpose *</label>
                <textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  placeholder="What is this agent's main purpose?"
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructions">Instructions *</label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Detailed instructions for how the agent should behave"
                  rows={5}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="personality">Personality</label>
                <textarea
                  id="personality"
                  value={formData.personality}
                  onChange={(e) => handleInputChange('personality', e.target.value)}
                  placeholder="Describe the agent's personality and communication style"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills</label>
                <input
                  type="text"
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  placeholder="e.g., React, TypeScript, Node.js (comma separated)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="llmModel">LLM Model</label>
                <select
                  id="llmModel"
                  value={formData.llmModel}
                  onChange={(e) => handleInputChange('llmModel', e.target.value)}
                >
                  {freeModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="picture">Agent Picture</label>
                <input
                  type="file"
                  id="picture"
                  accept="image/*"
                  onChange={handlePictureUpload}
                />
                {formData.picture && (
                  <div className="picture-preview">
                    <img src={URL.createObjectURL(formData.picture)} alt="Preview" />
                  </div>
                )}
              </div>

              <button
                className="create-agent-btn"
                onClick={handleCreateAgent}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : '🚀 Create Agent'}
              </button>
            </div>
          </div>

          {/* My Agents Section */}
          <div className="my-agents-section">
            <h2>🤖 My Agents ({agents.length})</h2>
            {agents.length === 0 ? (
              <div className="empty-agents">
                <p>You haven't created any agents yet.</p>
                <p>Create your first agent above!</p>
              </div>
            ) : (
              <div className="agents-grid">
                {agents.map(agent => (
                  <div key={agent.id} className="agent-card">
                    <div className="agent-header">
                      <img src={agent.imageUrl || '/default-agent.png'} alt={agent.name} />
                      <h3>{agent.name}</h3>
                    </div>
                    <p>{agent.purpose}</p>
                    <div className="agent-actions">
                      <button
                        className={`select-btn ${selectedParents.includes(agent) ? 'selected' : ''}`}
                        onClick={() => handleSelectParent(agent)}
                      >
                        {selectedParents.includes(agent) ? 'Selected' : 'Select for Breeding'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Breeding Section */}
            {agents.length > 0 && (
              <div className="breeding-section">
                <h3>🧬 Breed Your Agents</h3>
                <div className="selected-parents">
                  <div className="parent-slot">
                    <span>Parent A:</span>
                    {selectedParents[0] ? (
                      <span>{selectedParents[0].name}</span>
                    ) : (
                      <span className="empty">Not selected</span>
                    )}
                  </div>
                  <div className="parent-slot">
                    <span>Parent B:</span>
                    {selectedParents[1] ? (
                      <span>{selectedParents[1].name}</span>
                    ) : (
                      <span className="empty">Not selected</span>
                    )}
                  </div>
                </div>
                <button
                  className="breed-btn"
                  disabled={!selectedParents[0] || !selectedParents[1]}
                  onClick={handleBreedSelected}
                >
                  🧬 Breed Selected Agents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .create-agent-page {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 2rem 2rem 2rem;
        }

        .page-header {
          text-align: center;
          margin-bottom: 2.5rem;
          margin-top: 1.5rem;
        }

        .page-header h1 {
          font-size: 2.2rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: #94a3b8;
          font-size: 1rem;
        }

        .create-agent-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }

        .create-form-section h2,
        .my-agents-section h2 {
          font-size: 1.35rem;
          margin-bottom: 1.25rem;
          color: #e2e8f0;
        }

        .create-form {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 1.75rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #cbd5e1;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 0.9rem;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        .picture-preview {
          margin-top: 1rem;
        }

        .picture-preview img {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          border: 2px solid rgba(139, 92, 246, 0.3);
        }

        .create-agent-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-agent-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .create-agent-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .my-agents-section {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 2rem;
        }

        .empty-agents {
          text-align: center;
          color: #94a3b8;
          padding: 2rem;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .agent-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .agent-card:hover {
          border-color: rgba(139, 92, 246, 0.4);
          transform: translateY(-2px);
        }

        .agent-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .agent-header img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
        }

        .agent-header h3 {
          margin: 0;
          color: #e2e8f0;
        }

        .agent-card p {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .select-btn {
          width: 100%;
          padding: 0.5rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 6px;
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s;
        }

        .select-btn:hover {
          background: rgba(139, 92, 246, 0.2);
        }

        .select-btn.selected {
          background: rgba(34, 197, 94, 0.2);
          border-color: #22c55e;
          color: #bbf7d0;
        }

        .breeding-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .breeding-section h3 {
          color: #e2e8f0;
          margin-bottom: 1rem;
        }

        .selected-parents {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .parent-slot {
          flex: 1;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .parent-slot span:first-child {
          color: #94a3b8;
          margin-right: 0.5rem;
        }

        .empty {
          color: #64748b;
          font-style: italic;
        }

        .breed-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .breed-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .breed-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .create-agent-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .page-header h1 {
            font-size: 2rem;
          }
        }

        /* Mint Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .mint-modal {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .modal-header h2 {
          color: #e2e8f0;
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .modal-header p {
          color: #cbd5e1;
          margin: 0;
          font-size: 0.95rem;
        }

        .mint-details {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .mint-info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }

        .mint-info-row:last-child {
          margin-bottom: 0;
          border-bottom: none;
        }

        .mint-info-row .label {
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        .mint-info-row .value {
          color: #cbd5e1;
          font-size: 0.85rem;
          font-family: 'Courier New', monospace;
          word-break: break-all;
          text-align: right;
          flex: 1;
        }

        .mint-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .mint-btn {
          flex: 1;
          padding: 0.875rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mint-btn.primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          color: white;
        }

        .mint-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .mint-btn.secondary {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #cbd5e1;
        }

        .mint-btn.secondary:hover {
          background: rgba(139, 92, 246, 0.15);
        }

        .mint-info-box {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          padding: 0.875rem;
          font-size: 0.85rem;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .mint-info-box p {
          margin: 0;
        }

        .mint-info-box strong {
          color: #bfdbfe;
        }
      `}</style>
    </div>
  )
}

export default CreateAgent