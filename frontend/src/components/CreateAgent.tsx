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

const CreateAgent = ({ walletAddress, onAgentCreated }: CreateAgentProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progressStep, setProgressStep] = useState<ProgressStep>('validating')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingMintTx, setPendingMintTx] = useState<MintTransaction | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null)

  // Track completion status
  const [coreCompleted, setCoreCompleted] = useState(false)
  const [advancedCompleted, setAdvancedCompleted] = useState(false)
  const [section2Active, setSection2Active] = useState(false)

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false)

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

  // Check core completion
  useEffect(() => {
    const isCoreComplete = formData.name.trim() !== '' && 
                          formData.purpose.trim() !== '' && 
                          formData.instructions.trim() !== '';
    setCoreCompleted(isCoreComplete);
  }, [formData.name, formData.purpose, formData.instructions]);

  // Check advanced completion
  useEffect(() => {
    const isAdvancedComplete = formData.personality.trim() !== '' && 
                              formData.skills.trim() !== '' && 
                              formData.picture !== null;
    setAdvancedCompleted(isAdvancedComplete);
  }, [formData.personality, formData.skills, formData.picture]);

  // Free LLM models from Open Router
  const freeModels = [
    { id: 'x-ai/grok-4.1-fast:free', name: 'Grok 4.1 Fast (Free)', provider: 'xAI' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct (Free)', provider: 'Meta' },
    { id: 'microsoft/wizardlm-2-8x22b:free', name: 'WizardLM-2 8x22B (Free)', provider: 'Microsoft' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', provider: 'Mistral' }
  ]

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle skills input with comma separation
  const handleSkillsChange = (value: string) => {
    // Allow typing but don't add to formData yet - wait for comma
    setFormData(prev => ({ ...prev, skills: value }))
  }

  const handleSkillsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      const currentValue = formData.skills.trim()
      if (currentValue && !getSkillsArray().includes(currentValue.replace(',', ''))) {
        // Add the skill without the comma
        const newSkill = currentValue.replace(',', '').trim()
        const currentSkills = getSkillsArray()
        const updatedSkills = [...currentSkills, newSkill].join(', ')
        setFormData(prev => ({ ...prev, skills: updatedSkills + ', ' }))
      } else {
        // Just clean up the input
        setFormData(prev => ({ ...prev, skills: getSkillsArray().join(', ') + (getSkillsArray().length > 0 ? ', ' : '') }))
      }
    }
  }

  const getSkillsArray = (): string[] => {
    return formData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
  }

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = getSkillsArray()
    const updatedSkills = currentSkills.filter(skill => skill !== skillToRemove)
    setFormData(prev => ({ ...prev, skills: updatedSkills.join(', ') + (updatedSkills.length > 0 ? ', ' : '') }))
  }

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleInputChange('picture', file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleInputChange('picture', file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
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

      const agent = response.data.agent
      setCreatedAgent(agent)

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
      } else if (response.data.mintError) {
        // Minting failed - show error but agent was still created
        console.error('⚠️ Mint transaction failed:', response.data.mintError)
        
        setProgressStep('error')
        
        // Check if it's a funding issue
        if (response.data.mintError.includes('No UTXOs') || response.data.mintError.includes('no funds')) {
          setErrorMessage(
            '⚠️ Agent created but minting failed: Your wallet has no testnet ADA.\n\n' +
            '🎯 Get free testnet ADA from:\nhttps://docs.cardano.org/cardano-testnets/tools/faucet/\n\n' +
            'Your agent is saved and you can mint it later once you have funds!'
          )
        } else {
          setErrorMessage(`Agent created but minting failed: ${response.data.mintError}`)
        }
        
        // Still reload agents - agent was created successfully
        setTimeout(() => {
          onAgentCreated(agent)
        }, 5000) // Give user time to read the error
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
          onAgentCreated(agent)
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
                    
                    // Update agent status in backend
                    if (createdAgent?.id) {
                      try {
                        await axios.post(`http://localhost:5000/api/agents/${createdAgent.id}/mint-complete`, {
                          txHash: response.data.txHash
                        })
                        console.log('✅ Agent marked as minted in backend')
                      } catch (updateError) {
                        console.error('⚠️ Failed to update agent mint status:', updateError)
                        // Continue anyway - transaction succeeded
                      }
                    }
                    
                    alert(
                      `🎉 NFT Minting Started!\n\n` +
                      `Transaction: ${response.data.txHash}\n` +
                      `Network: ${response.data.network || 'preprod'}\n\n` +
                      `Your NFT will appear in your ${walletName} wallet in 2-3 minutes.\n\n` +
                      `Check CardanoScan: https://preprod.cardanoscan.io/transaction/${response.data.txHash}`
                    )

                    // Update local state
                    if (createdAgent) {
                      createdAgent.minted = true
                      createdAgent.txHash = response.data.txHash
                    }

                    setPendingMintTx(null)
                    setCreatedAgent(null)
                    
                    // Reload agents to show updated status
                    setTimeout(() => {
                      onAgentCreated(createdAgent)
                    }, 3000)
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
                Sign with Lace Wallet
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

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="template-modal">
            <div className="modal-header">
              <h2>📋 Marketing Agent Template</h2>
              <p>Use this template to quickly create a marketing-focused AI agent</p>
              <button
                className="close-btn"
                onClick={() => setShowTemplateModal(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="template-content">
              {/* Template Form Preview */}
              <div className="template-form-section">
                <h3 className="section-header">
                  <span className="section-number">1</span>
                  Core Agent Details
                </h3>

                <div className="template-form">
                  <div className="form-group">
                    <label>Agent Name <span className="required-star">*</span></label>
                    <div className="template-value">MarketingPro AI</div>
                  </div>

                  <div className="form-group">
                    <label>Purpose <span className="required-star">*</span></label>
                    <div className="template-value">
                      A specialized AI agent for creating compelling marketing content, analyzing market trends, and developing comprehensive marketing strategies for businesses.
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Instructions <span className="required-star">*</span></label>
                    <div className="template-value">
                      You are MarketingPro AI, an expert marketing strategist and content creator. Your role is to help businesses create effective marketing campaigns, analyze market data, and develop strategies that drive growth. Always provide actionable insights, creative ideas, and data-driven recommendations. Focus on ROI, audience targeting, and measurable results. Use modern marketing techniques including social media, content marketing, SEO, and conversion optimization.
                    </div>
                  </div>
                </div>
              </div>

              <div className="template-form-section">
                <h3 className="section-header">
                  <span className="section-number">2</span>
                  Advanced Configuration
                </h3>

                <div className="template-form">
                  <div className="form-group">
                    <label>Personality</label>
                    <div className="template-value">
                      Professional yet approachable, data-driven with creative flair, confident in recommendations, focused on results and ROI, enthusiastic about marketing innovation.
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Skills</label>
                    <div className="template-skills">
                      <span className="skill-tag">Content Marketing</span>
                      <span className="skill-tag">SEO Optimization</span>
                      <span className="skill-tag">Social Media Strategy</span>
                      <span className="skill-tag">Market Research</span>
                      <span className="skill-tag">Brand Development</span>
                      <span className="skill-tag">Analytics</span>
                      <span className="skill-tag">Copywriting</span>
                      <span className="skill-tag">Campaign Management</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>LLM Model</label>
                    <div className="template-value">Grok 4.1 Fast (Free)</div>
                  </div>

                  <div className="form-group">
                    <label>Agent Picture</label>
                    <div className="template-value">Upload a professional marketing-themed image</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="template-actions">
              <button
                className="template-apply-btn"
                onClick={() => {
                  // Apply template data to main form
                  setFormData({
                    name: 'MarketingPro AI',
                    purpose: 'A specialized AI agent for creating compelling marketing content, analyzing market trends, and developing comprehensive marketing strategies for businesses.',
                    instructions: 'You are MarketingPro AI, an expert marketing strategist and content creator. Your role is to help businesses create effective marketing campaigns, analyze market data, and develop strategies that drive growth. Always provide actionable insights, creative ideas, and data-driven recommendations. Focus on ROI, audience targeting, and measurable results. Use modern marketing techniques including social media, content marketing, SEO, and conversion optimization.',
                    personality: 'Professional yet approachable, data-driven with creative flair, confident in recommendations, focused on results and ROI, enthusiastic about marketing innovation.',
                    skills: 'Content Marketing, SEO Optimization, Social Media Strategy, Market Research, Brand Development, Analytics, Copywriting, Campaign Management',
                    llmModel: 'x-ai/grok-4.1-fast:free',
                    picture: null
                  })
                  setShowTemplateModal(false)
                }}
              >
                Use This Template
              </button>
              <button
                className="template-cancel-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="create-agent-container">
        {/* Header */}
        <div className="header-section">
          <div className="plain-text">
            Create your <span className="super-word">super</span> agent!
          </div>
          <button
            className="template-btn"
            onClick={() => setShowTemplateModal(true)}
            title="Use Marketing Agent Template"
          >
            Template
          </button>
        </div>

        <div className="create-agent-content">
          {/* Create Agent Form */}
          <div className={`create-form-section ${coreCompleted ? 'section-completed' : ''} ${coreCompleted && section2Active ? 'section-dimmed' : ''}`}>
            <h2 className="section-header">
              <span className="section-number">1</span>
              Core Agent Details
              {coreCompleted && <span className="section-check">✓</span>}
            </h2>

            <div className="create-form">
              <div className="form-group">
                <label htmlFor="name">Agent Name <span className="required-star">*</span></label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => setSection2Active(false)}
                  placeholder="e.g., CodeMaster Pro"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="purpose">Purpose <span className="required-star">*</span></label>
                <textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  onFocus={() => setSection2Active(false)}
                  placeholder="What is this agent's main purpose?"
                  rows={6}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructions">Instructions <span className="required-star">*</span></label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  onFocus={() => setSection2Active(false)}
                  placeholder="Detailed instructions for how the agent should behave"
                  rows={20}
                  required
                />
              </div>
            </div>
          </div>

          <div className={`create-form-section ${!coreCompleted ? 'section-disabled' : ''} ${advancedCompleted ? 'section-completed' : ''}`}>
            <h2 className="section-header">
              <span className="section-number">2</span>
              Advanced Configuration
              {advancedCompleted && <span className="section-check">✓</span>}
            </h2>

            <div className="create-form">
              <div className="form-group">
                <label htmlFor="personality">Personality</label>
                <textarea
                  id="personality"
                  value={formData.personality}
                  onChange={(e) => handleInputChange('personality', e.target.value)}
                  onFocus={() => coreCompleted && setSection2Active(true)}
                  placeholder="Describe the agent's personality and communication style"
                  rows={3}
                  disabled={!coreCompleted}
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills</label>
                <div className="skills-container">
                  <div className="skills-tags">
                    {getSkillsArray().map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                        <button
                          type="button"
                          className="skill-tag-remove"
                          onClick={() => removeSkill(skill)}
                          title={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                    onKeyDown={handleSkillsKeyDown}
                    placeholder={getSkillsArray().length === 0 ? "e.g., React, TypeScript, Node.js" : "Add another skill..."}
                    disabled={!coreCompleted}
                    className="skills-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="llmModel">LLM Model</label>
                <select
                  id="llmModel"
                  value={formData.llmModel}
                  onChange={(e) => handleInputChange('llmModel', e.target.value)}
                  onFocus={() => coreCompleted && setSection2Active(true)}
                  disabled={!coreCompleted}
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
                <div
                  className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${!coreCompleted ? 'disabled' : ''}`}
                  onDrop={coreCompleted ? handleDrop : undefined}
                  onDragOver={coreCompleted ? handleDragOver : undefined}
                  onDragLeave={coreCompleted ? handleDragLeave : undefined}
                  onClick={coreCompleted ? () => document.getElementById('picture')?.click() : undefined}
                  style={{ cursor: coreCompleted ? 'pointer' : 'not-allowed' }}
                >
                  <input
                    type="file"
                    id="picture"
                    accept="image/*"
                    onChange={handlePictureUpload}
                    style={{ display: 'none' }}
                    disabled={!coreCompleted}
                  />
                  {formData.picture ? (
                    <div className="picture-preview">
                      <img src={URL.createObjectURL(formData.picture)} alt="Preview" />
                      <button
                        className="delete-image-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInputChange('picture', null);
                        }}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="drop-zone-content">
                      <div className="drop-icon">+</div>
                      <p>{coreCompleted ? 'Drop an image here or click to browse' : 'Complete Section 1 first'}</p>
                      <small>{coreCompleted ? 'PNG, JPG, GIF up to 10MB' : 'Section 1 must be completed'}</small>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="create-agent-btn"
                onClick={handleCreateAgent}
                disabled={isCreating || !coreCompleted}
              >
                {isCreating ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .header-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .template-btn {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 2px solid #8b5cf6;
          border-radius: 8px;
          color: #8b5cf6;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .page-header {
          text-align: center;
          margin-bottom: 2.5rem;
          margin-top: 1.5rem;
        }

        .page-header p {
          color: #94a3b8;
          font-size: 1rem;
        }

        /* Plain Text */
        .plain-text {
          font-size: 4rem;
          font-weight: 600;
          color: #FFFFFF;
          text-align: center;
          margin-top: 2.5rem;
          margin-bottom: 2rem;
          font-family: var(--font-headline, 'Tomorrow', sans-serif);
        }

        .super-word {
          color: #8b5cf6;
          text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from {
            text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
          }
          to {
            text-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 30px rgba(139, 92, 246, 0.6);
          }
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

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.35rem;
          margin-bottom: 1.25rem;
          color: #e2e8f0;
        }

        .section-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .section-check {
          color: #22c55e;
          font-size: 1.2rem;
          font-weight: bold;
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

        .required-star {
          color: #8b5cf6;
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

        #purpose {
          min-height: 120px;
        }

        #instructions {
          min-height: 300px;
        }

        .picture-preview {
          margin-top: 1rem;
          position: relative;
          display: inline-block;
        }

        .picture-preview img {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          border: 2px solid rgba(139, 92, 246, 0.3);
        }

        .delete-image-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }

        .delete-image-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .drop-zone {
          border: 2px dashed rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.02);
        }

        .drop-zone:hover {
          border-color: rgba(139, 92, 246, 0.6);
          background: rgba(139, 92, 246, 0.05);
        }

        .drop-zone.drag-over {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
          transform: scale(1.02);
        }

        .drop-zone-content {
          color: #cbd5e1;
        }

        .drop-icon {
          font-size: 4rem;
          font-weight: 300;
          margin-bottom: 1rem;
          opacity: 0.7;
          color: #8b5cf6;
          line-height: 1;
        }

        .drop-zone-content p {
          margin: 0.5rem 0;
          font-weight: 500;
        }

        .drop-zone-content small {
          color: #94a3b8;
          font-size: 0.8rem;
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

        .section-disabled {
          opacity: 0.4;
          pointer-events: none;
        }

        .section-disabled .section-header {
          color: #64748b;
        }

        .section-disabled .section-number {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }

        .section-disabled .create-form {
          background: rgba(15, 23, 42, 0.3);
          border-color: rgba(100, 116, 139, 0.2);
        }

        .section-disabled .form-group label {
          color: #64748b;
        }

        .section-disabled .form-group input,
        .section-disabled .form-group textarea,
        .section-disabled .form-group select {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(100, 116, 139, 0.3);
          color: #64748b;
        }

        .section-completed .section-header {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
        }

        .section-dimmed {
          opacity: 0.6;
        }

        .section-dimmed .section-header {
          color: #94a3b8;
        }

        .section-dimmed .section-number {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          opacity: 0.7;
        }

        .section-dimmed .create-form {
          background: rgba(15, 23, 42, 0.4);
          border-color: rgba(139, 92, 246, 0.15);
        }

        .section-dimmed .form-group label {
          color: #94a3b8;
        }

        .section-dimmed .form-group input,
        .section-dimmed .form-group textarea,
        .section-dimmed .form-group select {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(139, 92, 246, 0.2);
          color: #94a3b8;
        }

        .drop-zone.disabled {
          border-color: rgba(100, 116, 139, 0.3);
          background: rgba(255, 255, 255, 0.01);
        }

        .drop-zone.disabled:hover {
          border-color: rgba(100, 116, 139, 0.3);
          background: rgba(255, 255, 255, 0.01);
        }

        .drop-zone.disabled .drop-zone-content {
          color: #64748b;
        }

        .drop-zone.disabled .drop-icon {
          opacity: 0.4;
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

          .plain-text {
            font-size: 3rem;
          }

          .header-section {
            flex-direction: column;
            gap: 1rem;
          }

          .template-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .template-modal .modal-header {
            padding: 1rem 1.5rem;
          }

          .template-content {
            padding: 1.5rem;
          }

          .template-actions {
            padding: 1rem 1.5rem;
            flex-direction: column;
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
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          /* push modal lower so header isn't hidden behind fixed navbar */
          align-items: flex-start;
          justify-content: center;
          padding-top: 80px;
          z-index: 1000;
          overflow-y: auto;
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

        /* Template Modal Styles */
        .template-modal {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 0;
          max-width: 1200px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
        }

        .template-modal .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          margin-bottom: 0;
        }

        .template-modal .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #e2e8f0;
        }

        .template-modal .modal-header p {
          margin: 0.25rem 0 0 0;
          color: #cbd5e1;
          font-size: 0.9rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          color: #e2e8f0;
        }

        .template-content {
          padding: 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .template-form-section h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #e2e8f0;
        }

        .template-form {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 1.25rem;
        }

        .template-value {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 6px;
          padding: 0.75rem;
          color: #e2e8f0;
          font-size: 0.85rem;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .template-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .template-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(139, 92, 246, 0.2);
          background: rgba(15, 23, 42, 0.3);
        }

        .template-apply-btn {
          flex: 1;
          padding: 0.875rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-apply-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .template-cancel-btn {
          flex: 1;
          padding: 0.875rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          color: #cbd5e1;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-cancel-btn:hover {
          background: rgba(139, 92, 246, 0.15);
        }
        .skills-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skills-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .skill-tag {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .skill-tag-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          margin-left: 6px;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .skill-tag-remove:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .skills-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 0.9rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .skills-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        .skills-input:disabled {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(100, 116, 139, 0.3);
          color: #64748b;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default CreateAgent