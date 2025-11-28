import { useState, useEffect } from 'react'
import { Agent } from '../types'
import AgentCreationProgress from './AgentCreationProgress'
import axios from 'axios'

interface CreateAgentProps {
  walletAddress: string
  onAgentCreated: (agent: Agent) => void
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
}

type ProgressStep = 'validating' | 'uploading' | 'saving' | 'complete' | 'error'

const CreateAgent = ({ walletAddress, onAgentCreated, onStartBreeding }: CreateAgentProps) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedParents, setSelectedParents] = useState<[Agent | null, Agent | null]>([null, null])
  const [showProgress, setShowProgress] = useState(false)
  const [progressStep, setProgressStep] = useState<ProgressStep>('validating')
  const [errorMessage, setErrorMessage] = useState('')

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

      // Step 4: Complete
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
        onAgentCreated(response.data.agent)
      }, 1500)

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
      `}</style>
    </div>
  )
}

export default CreateAgent