import { useState, useEffect } from 'react'
import { Agent } from '../types'
import AgentCard from './AgentCard'
import SelectionToast from './SelectionToast'
import ComparisonScreen from './ComparisonScreen'
import FusionProgression from './FusionProgression'
import axios from 'axios'

interface DashboardProps {
  walletAddress: string
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
  onViewAgent: (agent: Agent) => void
}



const Dashboard = ({ walletAddress, onStartBreeding, onViewAgent }: DashboardProps) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [showFusionProgression, setShowFusionProgression] = useState(false)
  const [fusionAgents, setFusionAgents] = useState<[Agent, Agent] | null>(null)

  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Fetch user-created agents from backend
        const response = await axios.get(`http://localhost:5000/api/agents?owner=${walletAddress}`)
        const userAgents = response.data.agents || []
        
        console.log(`📋 Loaded ${userAgents.length} agents for dashboard`)
        setAgents(userAgents)
      } catch (error) {
        console.error('Failed to load agents:', error)
        setAgents([])
      }
    }

    loadAgents()
  }, [walletAddress])

  const handleAgentCardClick = (agent: Agent) => {
    onViewAgent(agent)
  }

  const handleRemoveAgent = (agentId: string) => {
    setSelectedAgents(prev => prev.filter(a => a.id !== agentId))
  }

  const handleClearSelection = () => {
    setSelectedAgents([])
  }

  const handleViewComparison = () => {
    if (selectedAgents.length === 2) {
      setShowComparison(true)
    }
  }

  const handleConfirmBreeding = (agentA: Agent, agentB: Agent) => {
    setFusionAgents([
      agentA as Agent & { fullData?: any },
      agentB as Agent & { fullData?: any }
    ])
    setShowFusionProgression(true)
    setShowComparison(false)
  }

  const handleFusionComplete = () => {
    // Reset all UI states and go back to main dashboard
    setShowFusionProgression(false)
    setFusionAgents(null)
    setSelectedAgents([])
    setShowComparison(false)
    
    // Call the parent callback
    if (onStartBreeding && fusionAgents) {
      setTimeout(() => {
        onStartBreeding(fusionAgents[0], fusionAgents[1])
      }, 500)
    }
  }

  const isAgentSelected = (agentId: string) => {
    return selectedAgents.some(a => a.id === agentId)
  }

  return (
    <div className="dashboard">
      <h2>My Agents</h2>
      <p className="subtitle">
        {agents.length === 0 
          ? "Create your first AI agent to get started with breeding and NFT minting"
          : "Click an agent to view details, then select two to breed"
        }
      </p>

      {agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <h3>No Agents Yet</h3>
          <p>Start building your AI agent collection by creating your first agent.</p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '1rem' }}>
            💡 Tip: Go to the "✨ Create Agents" tab to build your first one!
          </p>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map(agent => (
            <AgentCard 
              key={agent.id}
              agent={agent}
              selected={isAgentSelected(agent.id)}
              onClick={() => handleAgentCardClick(agent)}
            />
          ))}
        </div>
      )}

      {/* Selection Toast */}
      <SelectionToast
        selectedAgents={selectedAgents}
        onViewComparison={handleViewComparison}
        onClear={handleClearSelection}
        onRemoveAgent={handleRemoveAgent}
      />

      {/* Comparison Screen */}
      {showComparison && selectedAgents.length === 2 && (
        <ComparisonScreen
          agentA={selectedAgents[0]}
          agentB={selectedAgents[1]}
          onConfirm={handleConfirmBreeding}
          onCancel={() => setShowComparison(false)}
        />
      )}

      {/* Fusion Progression */}
      {fusionAgents && (
        <FusionProgression
          agentA={fusionAgents[0]}
          agentB={fusionAgents[1]}
          isOpen={showFusionProgression}
          onComplete={handleFusionComplete}
          onCancel={() => {
            setShowFusionProgression(false)
            setFusionAgents(null)
          }}
        />
      )}

      <style>{`
        /* ========== GLASSMORPHIC DASHBOARD ========== */
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2.5rem var(--content-padding, 0.09375rem);
          position: relative;
          z-index: 10;
        }

        .subtitle {
          color: var(--color-text-secondary, #8F90A6);
          margin: 0 0 2rem 0;
          font-size: 1rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 500;
        }

        /* Empty State - Holographic Style */
        .empty-state {
          text-align: center;
          padding: 5rem 3rem;
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.05) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 2px dashed rgba(0, 240, 255, 0.3);
          margin: 0;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }

        .empty-state::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 70%
          );
          animation: holographic-shine 5s ease-in-out infinite;
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 1.5rem;
          opacity: 0.7;
          filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.6));
          position: relative;
          z-index: 2;
        }

        .empty-state h3 {
          color: var(--color-text-primary, #FFFFFF);
          margin-bottom: 1rem;
          font-size: 2rem;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, #00F0FF 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
          z-index: 2;
        }

        .empty-state p {
          color: var(--color-text-secondary, #8F90A6);
          margin-bottom: 2rem;
          font-size: 1rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
          position: relative;
          z-index: 2;
        }

        /* Create Agent Button - Glassmorphic */
        .create-agent-btn {
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.3), 
            rgba(255, 255, 255, 0.15));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: var(--color-text-primary, #FFFFFF);
          border: 1px solid rgba(0, 240, 255, 0.5);
          padding: 1rem 2.5rem;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 700;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
          position: relative;
          z-index: 2;
        }

        .create-agent-btn:hover {
          transform: translateY(-4px) scale(1.05);
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.5), 
            rgba(255, 255, 255, 0.25));
          box-shadow: 
            0 0 40px rgba(0, 240, 255, 0.8),
            0 0 80px rgba(255, 255, 255, 0.3);
          border-color: var(--color-primary, #00F0FF);
        }

        .create-agent-btn:active {
          transform: translateY(-2px) scale(1.02);
        }

        /* Agents Grid - Responsive */
        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          margin: 0;
          position: relative;
          z-index: 10;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .dashboard {
            padding: 2.5rem 0.0625rem;
          }

          .agents-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 2rem 0.046875rem;
          }

          .agents-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.25rem;
          }

          .empty-state {
            padding: 4rem 2rem;
          }

          .empty-state h3 {
            font-size: 1.5rem;
          }

          .create-agent-btn {
            padding: 0.875rem 2rem;
            font-size: 0.8125rem;
          }
        }

        @media (max-width: 600px) {
          .dashboard {
            padding: 1.5rem 0.03125rem;
          }

          .agents-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .empty-state {
            padding: 3rem 1.5rem;
          }

          .empty-icon {
            font-size: 4rem;
          }

          .empty-state h3 {
            font-size: 1.25rem;
          }

          .empty-state p {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
