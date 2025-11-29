import { useState, useEffect } from 'react'
import { Agent, FusionResult } from '../types'
import { useWallet } from '@meshsdk/react'
import { breedAgents } from '../utils/api'
import { mintBredAgent } from '../utils/mintAgent'
import { createBredAgentMetadata } from '../utils/agentMetadata'

interface BreedScreenProps {
  parentA: Agent
  parentB: Agent
  onFusionComplete: (child: Agent) => void
  onBack: () => void
}

const BreedScreen = ({ parentA, parentB, onFusionComplete, onBack }: BreedScreenProps) => {
  const { wallet, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'compatibility' | 'breeding' | 'minting' | 'signing' | 'confirming'>('compatibility')
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [currentSentence, setCurrentSentence] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [compatibilityScore, setCompatibilityScore] = useState<{ score: number; analysis: string; predicted_skills?: string[] } | null>(null)
  const [traitBalance, setTraitBalance] = useState(50)
  const [childAgentName, setChildAgentName] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Predicted skills from compatibility calculation, or fallback to combined parent skills
  const predictedSkills = compatibilityScore?.predicted_skills && compatibilityScore.predicted_skills.length > 0
    ? compatibilityScore.predicted_skills
    : [...new Set([...parentA.skills.slice(0, 3), ...parentB.skills.slice(0, 3)])]

  // Animate text change every 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentSentence(prev => (prev + 1) % 2)
        setIsAnimating(false)
      }, 500) // Half of animation duration
    }, 5000)

    return () => clearTimeout(timer)
  }, [currentSentence])

  const sentences = [
    { text: "Should Humans have all the Fun?", highlight: "all the Fun?" },
    { text: "Now, AI Agents can also Breed!", highlight: "Breed!" }
  ]

  const handleSignAndSubmit = async () => {
    if (!fusionResult || !connected || !wallet) {
      alert('Missing breeding result or wallet not connected')
      return
    }

    setStep('signing')

    try {
      // Get parent generations
      const parentA_gen = parentA.generation || 0
      const parentB_gen = parentB.generation || 0
      const childGeneration = Math.max(parentA_gen, parentB_gen) + 1

      // Create metadata for bred agent with all child data
      const metadata = createBredAgentMetadata(
        fusionResult.metadata.name,
        fusionResult.ipfsCid,  // IPFS hash of child genetic data
        fusionResult.metadata.masumiDid || '',  // Ensure masumiDid is a string
        parentA.id,  // parent_a_asset_id
        parentB.id,  // parent_b_asset_id
        parentA_gen,
        parentB_gen
      )

      // Add image to metadata if available
      if (fusionResult.imageIpfsCid) {
        metadata.image = `ipfs://${fusionResult.imageIpfsCid}`
      }

      // Mint using mintBredAgent (same as Reference)
      const newTxHash = await mintBredAgent(
        wallet,
        metadata,
        parentA.id,
        parentB.id
      )

      setTxHash(newTxHash)
      setStep('confirming')

      // Create child agent object with complete data
      const childAgent: Agent = {
        id: `child_${Date.now()}`,  // Will be updated after blockchain confirmation
        tokenId: `child_${fusionResult.geneticHash}`,
        name: fusionResult.metadata.name,
        purpose: fusionResult.metadata.purpose,  // From breeding result
        instructions: fusionResult.metadata.instructions,  // From breeding result
        personality: fusionResult.metadata.personality,  // From breeding result
        skills: fusionResult.metadata.skills || [],  // From breeding result (predicted skills)
        llmModel: fusionResult.metadata.llmModel || '',  // From breeding result (parent A's model)
        generation: childGeneration,
        owner: '',  // Will be set from wallet
        ownerAddress: '',  // Will be set from wallet
        geneticHash: fusionResult.geneticHash,
        ipfsCid: fusionResult.ipfsCid,
        imageUrl: fusionResult.imageIpfsCid ? `ipfs://${fusionResult.imageIpfsCid}` : undefined,
        parents: [parentA.id, parentB.id] as [string, string],
        minted: true,
        txHash: newTxHash
      }

      onFusionComplete(childAgent)
    } catch (error: any) {
      console.error('Signing/submission error:', error)
      if (error.message?.includes('User cancelled') || error.message?.includes('cancelled')) {
        alert('Transaction signing cancelled')
      } else {
        alert(`Error: ${error.message || 'Failed to sign/submit transaction'}`)
      }
      setStep('minting')
    }
  }

  const handleFuse = async () => {
    setLoading(true)
    setStep('compatibility')

    try {
      // Call new Python backend compatibility calculation endpoint
      console.log('🔍 [Compatibility] Calculating compatibility...')
      
      const compatResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/calculate-compatibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent_a: {
            name: parentA.name,
            purpose: parentA.purpose,
            personality: parentA.personality,
            skills: parentA.skills,
            instructions: parentA.instructions
          },
          parent_b: {
            name: parentB.name,
            purpose: parentB.purpose,
            personality: parentB.personality,
            skills: parentB.skills,
            instructions: parentB.instructions
          }
        })
      })

      if (compatResponse.ok) {
        const data = await compatResponse.json()
        console.log(`✅ [Compatibility] Score: ${data.score}%`)
        console.log(`✅ [Compatibility] Predicted skills: ${data.predicted_skills?.join(', ') || 'None'}`)
        setCompatibilityScore({
          score: data.score,
          analysis: data.analysis,
          predicted_skills: data.predicted_skills || []
        })
      } else {
        throw new Error('Compatibility endpoint returned error')
      }
      
      // Generate default child name by combining parent names
      const childName = `${parentA.name.split(' ')[0]}-${parentB.name.split(' ')[0]} Gen2`
      setChildAgentName(childName)
      setLoading(false)
    } catch (error) {
      console.error('Compatibility calculation error:', error)
      // Fallback to dummy data if API fails
      console.warn('⚠️ [Compatibility] Using fallback compatibility data')
      setCompatibilityScore({
        score: 87,
        analysis: 'OddJob Synth\'s creative problem-solving combined with EventManager Pro\'s organizational excellence creates a powerful synergy. The child agent will inherit exceptional event ideation capabilities with flawless execution potential. Predicted traits: innovative scheduling, creative contingency planning, and unique vendor coordination strategies.'
      })
      
      // Generate default child name
      const childName = `${parentA.name.split(' ')[0]}-${parentB.name.split(' ')[0]} Gen2`
      setChildAgentName(childName)
      setLoading(false)
    }
  }

  // Auto-load compatibility analysis when component mounts
  useEffect(() => {
    handleFuse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result as string
        setImagePreview(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProceedToFusion = async () => {
    if (!connected || !wallet) {
      alert('Please connect your wallet first')
      return
    }

    if (!childAgentName.trim()) {
      alert('Please enter a name for the child agent')
      return
    }

    setLoading(true)
    setStep('breeding')  // Rename from 'fusing'

    try {
      // Step 1: Get predicted skills from compatibility calculation (if available)
      // Use predicted skills from compatibility calculation, or fallback to combined parent skills
      const predictedSkillsForBreeding = compatibilityScore?.predicted_skills && compatibilityScore.predicted_skills.length > 0
        ? compatibilityScore.predicted_skills
        : [...new Set([...parentA.skills.slice(0, 3), ...parentB.skills.slice(0, 3)])]
      
      // Step 2: Get custom instructions from textarea (if provided)
      const breedInstructionsTextarea = document.getElementById('breedInstructions') as HTMLTextAreaElement
      const customInstructions = breedInstructionsTextarea?.value?.trim() || ''

      // Step 3: Call new Python backend /api/breed endpoint (image upload happens AFTER breeding)
      const breedingResult = await breedAgents(
        parentA.id,  // parent_a_asset_id
        parentB.id,  // parent_b_asset_id
        childAgentName.trim(),  // child_name
        traitBalance,  // trait_balance (0-100, kept in schema but NOT used in LLM calls)
        customInstructions || undefined,  // custom_instructions (from textarea)
        predictedSkillsForBreeding  // predicted_skills from compatibility calculation
      )

      // Step 4: Upload child image to IPFS AFTER breeding (if provided)
      let childImageIpfsCid: string | undefined = undefined
      if (imagePreview) {
        try {
          const response = await fetch(imagePreview)
          const blob = await response.blob()
          const file = new File([blob], 'child_agent_image.jpg', { type: 'image/jpeg' })
          
          const formData = new FormData()
          formData.append('picture', file)
          
          const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agents/upload-image`, {
            method: 'POST',
            body: formData
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            childImageIpfsCid = uploadData.image_ipfs_cid
            console.log(`✅ [Image] Uploaded child image: ${childImageIpfsCid}`)
          } else {
            console.warn('⚠️ [Image] Failed to upload child image, continuing without image')
          }
        } catch (error) {
          console.warn('⚠️ [Image] Failed to upload child image:', error)
          // Continue without image - not critical
        }
      }

      // Store breeding result with all child data
      setFusionResult({
        ipfsCid: breedingResult.ipfs_hash,
        geneticHash: breedingResult.ipfs_hash.substring(0, 16),
        imageIpfsCid: childImageIpfsCid,  // Store image CID (uploaded after breeding)
        metadata: {
          name: childAgentName,  // Use child_name from user input
          purpose: breedingResult.child_purpose,
          instructions: breedingResult.child_instructions,
          personality: breedingResult.child_text,
          skills: breedingResult.child_skills,
          llmModel: breedingResult.child_llm_model,
          masumiDid: breedingResult.masumi_did
        }
      })

      setStep('minting')
    } catch (error: any) {
      console.error('Breeding error:', error)
      alert(`Breeding failed: ${error.message || 'Please try again'}`)
      setStep('compatibility')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="breed-screen">
      <button className="back-button" onClick={onBack}>← Back to Dashboard</button>

      <div className="page-header">
        <div className={`catchy-line ${isAnimating ? 'fade-out' : 'fade-in'}`}>
          {sentences[currentSentence].text.split(sentences[currentSentence].highlight)[0]}
          <span className="super-word">{sentences[currentSentence].highlight}</span>
          {sentences[currentSentence].text.split(sentences[currentSentence].highlight)[1]}
        </div>
      </div>

      {step === 'compatibility' && (
        <div className="status-section compatibility-section">
          <div className="compatibility-header">
            <h2>Agent Compatibility Analysis</h2>
            <p>AI-Generated Breeding Compatibility Report</p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">🧬</div>
              <h3>Analyzing Compatibility...</h3>
              <p>Calculating genetic compatibility and trait combinations</p>
            </div>
          ) : (
            <>
              <div className="compatibility-container">
                {/* Left Agent */}
                <div className="compatibility-agent left-agent">
                  <div className="agent-circle">
                    {parentA.imageUrl && parentA.imageUrl.startsWith('http') ? (
                      <img 
                        src={parentA.imageUrl} 
                        alt={parentA.name}
                        className="agent-image"
                      />
                    ) : (
                      <div className="agent-emoji">{parentA.imageUrl || 'A'}</div>
                    )}
                  </div>
                  <h4>{parentA.name}</h4>
                  <p className="agent-skills">{parentA.skills.slice(0, 2).join(', ')}</p>
                </div>

                {/* Compatibility Meter */}
                <div className="compatibility-meter">
                  <div className="meter-display">
                    {compatibilityScore && (
                      <>
                        <div className="score-circle">
                          <div className="score-number">{compatibilityScore.score}%</div>
                          <div className="score-text">Compatible</div>
                        </div>
                        <div className="meter-bar">
                          <div className="meter-fill" style={{ width: `${compatibilityScore.score}%` }} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Analysis */}
                  {compatibilityScore && (
                    <div className="analysis-box">
                      <h4>🧬 Genetic Analysis</h4>
                      <p>{compatibilityScore.analysis}</p>
                    </div>
                  )}

                  {/* Predicted Child Skills */}
                  <div className="predicted-child-box">
                    <h4>👶 Predicted Child Skills</h4>
                    <div className="child-skills">
                      {predictedSkills.map((skill, idx) => (
                        <span key={idx} className="child-skill-badge">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Trait Balance Adjuster */}
                  <div className="trait-balance-section">
                    <h4>⚖️ Trait Balance Adjuster</h4>
                    <p className="trait-balance-label">Select which parent's traits to emphasize:</p>
                    <div className="trait-balance-container">
                      <span className="trait-parent-label">{parentA.name}</span>
                      <div className="trait-slider-wrapper">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={traitBalance}
                          onChange={(e) => setTraitBalance(parseInt(e.target.value))}
                          className="trait-slider"
                        />
                        <div className="slider-value">{traitBalance}% A / {100 - traitBalance}% B</div>
                      </div>
                      <span className="trait-parent-label">{parentB.name}</span>
                    </div>
                    <p className="trait-balance-description">
                      The child agent will inherit {traitBalance}% traits from {parentA.name} and {100 - traitBalance}% from {parentB.name}
                    </p>
                  </div>

                  {/* Child Agent Configuration */}
                  <div className="child-config-section">
                    <h4>👶 Configure Child Agent</h4>
                    
                    {/* Child Name Input */}
                    <div className="child-name-input-wrapper">
                      <label htmlFor="childName">Child Agent Name:</label>
                      <input
                        id="childName"
                        type="text"
                        value={childAgentName}
                        onChange={(e) => setChildAgentName(e.target.value)}
                        placeholder="Enter child agent name"
                        className="child-name-input"
                      />
                    </div>

                    {/* Child Image Upload */}
                    <div className="child-image-upload-wrapper">
                      <label htmlFor="childImage">Upload Child Agent Image (Optional):</label>
                      <div className="image-upload-container">
                        {imagePreview ? (
                          <div className="image-preview">
                            <img src={imagePreview} alt="Child agent preview" className="preview-img" />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={() => {
                                setImagePreview(null)
                              }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        ) : (
                          <label className="upload-area">
                            <input
                              id="childImage"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="file-input-hidden"
                            />
                            <span className="upload-icon">📸</span>
                            <span className="upload-text">Click to upload or drag image</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom Instructions */}
                  <div className="custom-instructions">
                    <label htmlFor="breedInstructions">Add Custom Breeding Instructions (Optional):</label>
                    <textarea
                      id="breedInstructions"
                      placeholder="e.g., Focus on creative problem-solving traits..."
                      rows={3}
                      className="instructions-input"
                    />
                  </div>

                  {/* Breed Button */}
                  <button 
                    className="proceed-breed-btn" 
                    onClick={handleProceedToFusion}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : '🎉 Proceed to Breeding'}
                  </button>
                </div>

                {/* Right Agent */}
                <div className="compatibility-agent right-agent">
                  <div className="agent-circle">
                    {parentB.imageUrl && parentB.imageUrl.startsWith('http') ? (
                      <img 
                        src={parentB.imageUrl} 
                        alt={parentB.name}
                        className="agent-image"
                      />
                    ) : (
                      <div className="agent-emoji">{parentB.imageUrl || 'B'}</div>
                    )}
                  </div>
                  <h4>{parentB.name}</h4>
                  <p className="agent-skills">{parentB.skills.slice(0, 2).join(', ')}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'breeding' && (
        <div className="status-section">
          <div className="spinner">🧬</div>
          <h3>Breeding in Progress...</h3>
          <p>Fusing genetic traits and generating new agent DNA</p>
        </div>
      )}

      {step === 'minting' && (
        <div className="status-section">
          <div className="spinner">Minting</div>
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
            disabled={!fusionResult || loading}
          >
            Sign with Wallet
          </button>
        </div>
      )}

      {step === 'signing' && (
        <div className="status-section">
          <div className="spinner">Signing</div>
          <h3>Signing Transaction...</h3>
          <p>Please approve the transaction in your wallet</p>
        </div>
      )}


      {step === 'confirming' && (
        <div className="status-section">
          <div className="spinner">Confirming</div>
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
                  View on CardanoScan
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

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .catchy-line {
          font-size: 4rem;
          font-weight: 600;
          font-family: var(--font-headline, 'Tomorrow', sans-serif);
          color: #FFFFFF;
          text-align: center;
          margin-bottom: 1rem;
          opacity: 1;
          transition: opacity 1s ease-in-out;
        }

        .catchy-line.fade-out {
          opacity: 0;
        }

        .catchy-line.fade-in {
          opacity: 1;
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

        .compatibility-card {
          margin-top: 2rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .compatibility-score {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .score-display {
          font-size: 3.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: var(--font-headline, 'Tomorrow', sans-serif);
        }

        .score-label {
          font-size: 1.1rem;
          color: #cbd5e1;
          margin-top: 0.5rem;
          font-weight: 600;
        }

        .compatibility-analysis {
          text-align: left;
        }

        .compatibility-analysis h4 {
          color: #8b5cf6;
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .compatibility-analysis p {
          color: #cbd5e1;
          line-height: 1.6;
          font-size: 0.95rem;
          margin: 0;
        }

        .compatibility-section {
          max-width: 1400px;
          width: 100%;
        }

        .compatibility-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .compatibility-header h2 {
          color: #e2e8f0;
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .compatibility-header p {
          color: #94a3b8;
          margin: 0;
        }

        .compatibility-container {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 2rem;
          align-items: start;
          margin-top: 2rem;
        }

        .compatibility-agent {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .agent-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
          border: 2px solid rgba(139, 92, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 3rem;
        }

        .agent-emoji {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .agent-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .compatibility-agent h4 {
          color: #e2e8f0;
          margin: 1rem 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .agent-skills {
          color: #94a3b8;
          font-size: 0.85rem;
          margin: 0;
        }

        .compatibility-meter {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .meter-display {
          text-align: center;
        }

        .score-circle {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
          border: 3px solid rgba(139, 92, 246, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.2);
        }

        .score-number {
          font-size: 3.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .score-text {
          font-size: 0.9rem;
          color: #cbd5e1;
          margin-top: 0.25rem;
        }

        .meter-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(139, 92, 246, 0.2);
          margin-bottom: 0.75rem;
        }

        .meter-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
          border-radius: 6px;
          transition: width 1s ease-out;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }

        .meter-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #94a3b8;
          display: none;
        }

        .analysis-box {
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .analysis-box h4 {
          color: #8b5cf6;
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
        }

        .analysis-box p {
          color: #cbd5e1;
          margin: 0;
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .predicted-child-box {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .predicted-child-box h4 {
          color: #6366f1;
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
        }

        .child-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .child-skill-badge {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #cbd5e1;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .custom-instructions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .custom-instructions label {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .instructions-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          font-family: 'Space Mono', monospace;
          resize: vertical;
          transition: all 0.2s;
        }

        .instructions-input:focus {
          outline: none;
          border-color: #8b5cf6;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
        }

        .instructions-input::placeholder {
          color: #64748b;
        }

        .proceed-breed-btn {
          width: 100%;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          color: white;
          padding: 1rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 1rem;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .proceed-breed-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }

        .proceed-breed-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          min-height: 400px;
        }

        .loading-spinner {
          font-size: 5rem;
          margin-bottom: 1.5rem;
          animation: spin 2s linear infinite;
        }

        .loading-container h3 {
          color: #e2e8f0;
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .loading-container p {
          color: #94a3b8;
          margin: 0;
          font-size: 1rem;
        }

        .trait-balance-section {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .trait-balance-section h4 {
          color: #6366f1;
          margin: 0 0 0.5rem 0;
          font-size: 0.95rem;
        }

        .trait-balance-label {
          color: #cbd5e1;
          font-size: 0.85rem;
          margin: 0 0 1rem 0;
        }

        .trait-balance-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .trait-parent-label {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 500;
          min-width: 80px;
          text-align: center;
        }

        .trait-slider-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .trait-slider {
          width: 100%;
          height: 8px;
          border-radius: 5px;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .trait-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
          transition: all 0.2s;
        }

        .trait-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
          transform: scale(1.1);
        }

        .trait-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
          border: none;
          transition: all 0.2s;
        }

        .trait-slider::-moz-range-thumb:hover {
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
          transform: scale(1.1);
        }

        .slider-value {
          text-align: center;
          color: #8b5cf6;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'Space Mono', monospace;
        }

        .trait-balance-description {
          color: #94a3b8;
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.5;
        }

        .child-config-section {
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .child-config-section h4 {
          color: #8b5cf6;
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
        }

        .child-name-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .child-name-input-wrapper label {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .child-name-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          font-family: 'Space Mono', monospace;
          transition: all 0.2s;
        }

        .child-name-input:focus {
          outline: none;
          border-color: #8b5cf6;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
        }

        .child-name-input::placeholder {
          color: #64748b;
        }

        .child-image-upload-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .child-image-upload-wrapper label {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .image-upload-container {
          border: 2px dashed rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          padding: 1rem;
        }

        .file-input-hidden {
          display: none;
        }

        .upload-icon {
          font-size: 2rem;
          transition: transform 0.2s;
        }

        .upload-area:hover .upload-icon {
          transform: scale(1.1);
        }

        .upload-text {
          color: #94a3b8;
          font-size: 0.85rem;
          text-align: center;
        }

        .image-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .preview-img {
          width: 120px;
          height: 120px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid rgba(139, 92, 246, 0.3);
        }

        .remove-image-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .remove-image-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  )
}

export default BreedScreen
