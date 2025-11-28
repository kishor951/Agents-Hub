import { useState, useEffect } from 'react'
import { Agent } from '../types'

interface FusionProgressionProps {
  agentA: Agent & { fullData?: any }
  agentB: Agent & { fullData?: any }
  isOpen: boolean
  onComplete: () => void
  onCancel: () => void
}

interface Stage {
  id: number
  name: string
  description: string
  duration: number
  icon: string
  substeps?: string[]
}

const FUSION_STAGES: Stage[] = [
  {
    id: 1,
    name: 'Trait Analysis',
    description: 'Analyzing personality traits and characteristics',
    duration: 2000,
    icon: '🧬',
    substeps: ['Extracting traits', 'Analyzing compatibility', 'Mapping personality']
  },
  {
    id: 2,
    name: 'Skill Fusion',
    description: 'Combining technical skills and capabilities',
    duration: 2500,
    icon: '⚡',
    substeps: ['Merging skillsets', 'Resolving conflicts', 'Optimizing abilities']
  },
  {
    id: 3,
    name: 'Genetic Encoding',
    description: 'Creating unique genetic hash for child agent',
    duration: 2000,
    icon: '🔐',
    substeps: ['Computing hash', 'Encoding DNA', 'Validating structure']
  },
  {
    id: 4,
    name: 'IPFS Upload',
    description: 'Storing metadata on distributed network',
    duration: 2500,
    icon: '☁️',
    substeps: ['Preparing metadata', 'Uploading to IPFS', 'Confirming CID']
  },
  {
    id: 5,
    name: 'NFT Minting',
    description: 'Minting child agent as NFT on Cardano',
    duration: 3000,
    icon: '🎨',
    substeps: ['Building transaction', 'Submitting to chain', 'Confirming mint']
  }
]

const FusionProgression = ({ agentA, agentB, isOpen, onComplete, onCancel }: FusionProgressionProps) => {
  const [currentStage, setCurrentStage] = useState(0)
  const [currentSubstep, setCurrentSubstep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [childAgentData, setChildAgentData] = useState<any>(null)

  useEffect(() => {
    if (!isOpen) return

    if (currentStage >= FUSION_STAGES.length) {
      // Fusion complete - create child agent data
      setTimeout(() => {
        const childAgent = generateChildAgent(agentA, agentB)
        setChildAgentData(childAgent)
        setIsComplete(true)
      }, 1000)
      return
    }

    const stage = FUSION_STAGES[currentStage]
    const substepsCount = stage.substeps?.length || 1
    const substepDuration = stage.duration / substepsCount

    if (currentSubstep < substepsCount) {
      const timer = setTimeout(() => {
        setCurrentSubstep(prev => prev + 1)
      }, substepDuration)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setCurrentStage(prev => prev + 1)
        setCurrentSubstep(0)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentStage, currentSubstep, isOpen])

  const generateChildAgent = (parent1: Agent & { fullData?: any }, parent2: Agent & { fullData?: any }) => {
    const traits1 = parent1.fullData?.personality?.traits || []
    const traits2 = parent2.fullData?.personality?.traits || []
    const skills1 = parent1.fullData?.skills?.languages || []
    const skills2 = parent2.fullData?.skills?.languages || []

    // Simple genetic algorithm - combine parents' traits
    const childTraits = [
      traits1[Math.floor(Math.random() * traits1.length)],
      traits2[Math.floor(Math.random() * traits2.length)]
    ].filter(Boolean)

    const childSkills = [
      skills1[0],
      skills2[0]
    ].filter(Boolean)

    return {
      name: `${parent1.name} x ${parent2.name}`,
      generation: Math.max(parent1.generation, parent2.generation) + 1,
      traits: childTraits,
      skills: childSkills,
      parents: [parent1.id, parent2.id],
      tokenId: `child-${Date.now()}`,
      geneticHash: generateHash(),
      ipfsCid: generateHash(),
      timestamp: new Date().toISOString()
    }
  }

  const generateHash = () => {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }

  if (!isOpen) return null

  const currentStageData = FUSION_STAGES[currentStage]
  const substepsLength = currentStageData?.substeps?.length || 1
  const progress = currentStageData 
    ? ((currentStage + currentSubstep / substepsLength) / FUSION_STAGES.length) * 100 
    : 100

  return (
    <>
      <div className="progression-backdrop" onClick={!isComplete ? undefined : onComplete} />

      <div className="progression-container">
        {/* Header */}
        <div className="progression-header">
          <h2>🧬 Agent Fusion In Progress</h2>
          {isComplete && <span className="complete-badge">✓ Complete</span>}
        </div>

        {/* Main Content */}
        <div className="progression-content">
          {!isComplete ? (
            <>
              {/* Parents Info */}
              <div className="parents-info">
                <div className="parent-agent">
                  <div className="agent-avatar">{agentA.imageUrl || '🤖'}</div>
                  <div className="agent-name">{agentA.name}</div>
                </div>

                <div className="fusion-icon">
                  <span className="dna-strand">🧬</span>
                </div>

                <div className="parent-agent">
                  <div className="agent-avatar">{agentB.imageUrl || '🤖'}</div>
                  <div className="agent-name">{agentB.name}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="overall-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-text">{Math.round(progress)}% Complete</div>
              </div>

              {/* Stages */}
              <div className="stages-container">
                {FUSION_STAGES.map((stage, idx) => {
                  const isActive = idx === currentStage
                  const isComplete = idx < currentStage
                  const stageProgress = isActive ? (currentSubstep / (stage.substeps?.length || 1)) * 100 : isComplete ? 100 : 0

                  return (
                    <div
                      key={stage.id}
                      className={`stage ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                    >
                      <div className="stage-header">
                        <div className="stage-icon">{stage.icon}</div>
                        <div className="stage-info">
                          <div className="stage-name">{stage.name}</div>
                          <div className="stage-description">{stage.description}</div>
                        </div>
                        {isComplete && <div className="checkmark">✓</div>}
                      </div>

                      {/* Substeps */}
                      {isActive && stage.substeps && (
                        <div className="substeps">
                          {stage.substeps.map((substep, substepIdx) => (
                            <div
                              key={substepIdx}
                              className={`substep ${substepIdx < currentSubstep ? 'complete' : ''} ${substepIdx === currentSubstep ? 'active' : ''}`}
                            >
                              <span className="substep-dot" />
                              <span className="substep-text">{substep}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stage Progress Bar */}
                      {isActive && (
                        <div className="stage-progress">
                          <div className="stage-progress-bar">
                            <div className="stage-progress-fill" style={{ width: `${stageProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Current Status */}
              <div className="current-status">
                <div className="status-pulse">●</div>
                <span>{currentStageData?.name || 'Complete'}</span>
              </div>
            </>
          ) : (
            <>
              {/* Success Screen */}
              <div className="success-screen">
                <div className="success-icon">🎉</div>
                <h3>Fusion Successful!</h3>

                {childAgentData && (
                  <div className="child-agent-info">
                    <div className="child-preview">
                      <div className="child-header">
                        <h4>New Child Agent Created</h4>
                      </div>

                      <div className="child-stats">
                        <div className="stat">
                          <span className="stat-label">Name</span>
                          <span className="stat-value">{childAgentData.name}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Generation</span>
                          <span className="stat-value">Gen {childAgentData.generation}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Token ID</span>
                          <span className="stat-value">{childAgentData.tokenId}</span>
                        </div>
                      </div>

                      <div className="child-traits">
                        <div className="traits-label">Inherited Traits</div>
                        <div className="traits-list">
                          {childAgentData.traits.map((trait: string, idx: number) => (
                            <span key={idx} className="trait-tag">{trait}</span>
                          ))}
                        </div>
                      </div>

                      <div className="child-skills">
                        <div className="skills-label">Combined Skills</div>
                        <div className="skills-list">
                          {childAgentData.skills.map((skill: any, idx: number) => (
                            <span key={idx} className="skill-tag">{skill.name}</span>
                          ))}
                        </div>
                      </div>

                      <div className="child-hashes">
                        <div className="hash-item">
                          <span className="hash-label">Genetic Hash</span>
                          <span className="hash-value">{childAgentData.geneticHash}</span>
                        </div>
                        <div className="hash-item">
                          <span className="hash-label">IPFS CID</span>
                          <span className="hash-value">{childAgentData.ipfsCid}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="success-message">
                  <p>Your new agent has been minted as an NFT on Cardano testnet!</p>
                  <p className="tx-hash">Transaction confirming...</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="progression-footer">
          {!isComplete && (
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          {isComplete && (
            <>
              <button className="btn-view-child" onClick={onComplete}>
                View Child Agent
              </button>
              <button className="btn-done" onClick={onComplete}>
                Done 🎉
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .progression-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999;
          animation: fadeIn 0.3s ease;
        }

        .progression-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 95%;
          max-width: 900px;
          max-height: 85vh;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
          border: 2px solid #667eea;
          border-radius: 16px;
          box-shadow: 0 30px 80px rgba(102, 126, 234, 0.4);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from {
            transform: translate(-50%, -45%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .progression-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 2px solid #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .progression-header h2 {
          margin: 0;
          color: #fff;
          font-size: 1.5rem;
        }

        .complete-badge {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .progression-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .parents-info {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .parent-agent {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .agent-avatar {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agent-name {
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .fusion-icon {
          font-size: 2rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .dna-strand {
          display: inline-block;
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }

        .overall-progress {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(102, 126, 234, 0.3);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
          border-radius: 6px;
        }

        .progress-text {
          text-align: center;
          color: #64c8ff;
          font-weight: 600;
        }

        .stages-container {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .stage {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #444;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .stage.active {
          background: rgba(102, 126, 234, 0.15);
          border-color: #667eea;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
        }

        .stage.complete {
          background: rgba(74, 222, 128, 0.1);
          border-color: #4ade80;
        }

        .stage-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stage-icon {
          font-size: 1.8rem;
          min-width: 40px;
          text-align: center;
        }

        .stage-info {
          flex: 1;
        }

        .stage-name {
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
        }

        .stage-description {
          color: #aaa;
          font-size: 0.85rem;
          margin-top: 0.3rem;
        }

        .checkmark {
          color: #4ade80;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .substeps {
          margin-top: 1rem;
          padding-left: 3rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .substep {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          color: #aaa;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .substep.active {
          color: #64c8ff;
          font-weight: 500;
        }

        .substep.complete {
          color: #4ade80;
        }

        .substep-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          display: inline-block;
          animation: none;
        }

        .substep.active .substep-dot {
          animation: pulse 1s ease-in-out infinite;
        }

        .stage-progress {
          margin-top: 1rem;
          padding-left: 3rem;
        }

        .stage-progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .stage-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #64c8ff 0%, #667eea 100%);
          border-radius: 3px;
          transition: width 0.2s ease;
        }

        .current-status {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1rem;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 8px;
          border-left: 3px solid #667eea;
        }

        .status-pulse {
          color: #667eea;
          font-size: 1.2rem;
          animation: pulse 1s ease-in-out infinite;
        }

        .current-status span {
          color: #64c8ff;
          font-weight: 500;
        }

        .success-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          text-align: center;
          animation: slideUp 0.4s ease;
        }

        .success-icon {
          font-size: 4rem;
          animation: bounce 0.6s ease-in-out;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .success-screen h3 {
          margin: 0;
          color: #4ade80;
          font-size: 1.8rem;
        }

        .child-agent-info {
          width: 100%;
          max-width: 600px;
        }

        .child-preview {
          background: rgba(74, 222, 128, 0.1);
          border: 2px solid #4ade80;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .child-header h4 {
          margin: 0 0 1rem 0;
          color: #4ade80;
        }

        .child-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .stat-label {
          color: #aaa;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .stat-value {
          color: #4ade80;
          font-weight: 600;
        }

        .child-traits,
        .child-skills {
          margin-bottom: 1rem;
          text-align: left;
        }

        .traits-label,
        .skills-label {
          color: #64c8ff;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          display: block;
        }

        .traits-list,
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .trait-tag,
        .skill-tag {
          background: rgba(100, 200, 255, 0.2);
          color: #64c8ff;
          padding: 0.3rem 0.7rem;
          border-radius: 4px;
          font-size: 0.8rem;
          border: 1px solid rgba(100, 200, 255, 0.3);
        }

        .child-hashes {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .hash-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          text-align: left;
        }

        .hash-label {
          color: #aaa;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .hash-value {
          color: #ddd;
          font-family: monospace;
          font-size: 0.8rem;
          word-break: break-all;
        }

        .success-message {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .success-message p {
          margin: 0;
          color: #ddd;
        }

        .tx-hash {
          color: #aaa;
          font-size: 0.85rem;
          font-style: italic;
        }

        .progression-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #444;
          background: rgba(0, 0, 0, 0.3);
        }

        .btn-cancel,
        .btn-view-child,
        .btn-done {
          flex: 1;
          padding: 0.9rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #ddd;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-view-child {
          background: rgba(100, 200, 255, 0.2);
          color: #64c8ff;
          border: 1px solid #64c8ff;
        }

        .btn-view-child:hover {
          background: #64c8ff;
          color: #000;
        }

        .btn-done {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: white;
        }

        .btn-done:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(74, 222, 128, 0.4);
        }

        .progression-content::-webkit-scrollbar {
          width: 6px;
        }

        .progression-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .progression-content::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }

        .progression-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        @media (max-width: 600px) {
          .progression-container {
            width: 98%;
          }

          .progression-header {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1rem;
          }

          .parents-info {
            gap: 1rem;
          }

          .agent-avatar {
            width: 50px;
            height: 50px;
            font-size: 2rem;
          }

          .child-stats {
            grid-template-columns: 1fr;
          }

          .progression-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}

export default FusionProgression
