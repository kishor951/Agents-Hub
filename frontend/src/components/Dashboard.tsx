import { useState, useEffect } from 'react'
import { Agent } from '../types'
import AgentCard from './AgentCard'
import AgentDetailModal from './AgentDetailModal'
import SelectionToast from './SelectionToast'
import ComparisonScreen from './ComparisonScreen'
import FusionProgression from './FusionProgression'
import AgentChat from './AgentChat'

interface DashboardProps {
  walletAddress: string
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
}

// Agent configuration loader
const loadAgentConfigs = async (): Promise<{ [key: string]: any }> => {
  try {
    // In production, this would fetch from an API or load from public assets
    // For now, we'll load from a centralized config or API endpoint
    const response = await fetch('/api/agents/configs')
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to load agent configs from API, using fallback')
  }

  // Fallback: return empty object - agents will be loaded differently
  return {}
}

// Generate mock agents from configs (for demo purposes)
const generateMockAgents = (configs: { [key: string]: any }, walletAddress: string): (Agent & { fullData?: any })[] => {
  return Object.entries(configs).map(([key, config], index) => ({
    id: (index + 1).toString(),
    tokenId: `${key}-001`,
    name: config.name,
    skills: [
      ...config.skills?.languages?.map((lang: any) => lang.name) || [],
      ...config.specialization?.focus_areas?.slice(0, 3) || []
    ],
    personaPrompt: config.description || `${config.name} - ${config.specialization?.primary_domain}`,
    generation: config.metadata?.generation || 0,
    geneticHash: `hash_${key}_001`,
    ownerAddress: walletAddress,
    imageUrl: '🤖',
    fullData: config
  }))
}

const Dashboard = ({ walletAddress, onStartBreeding }: DashboardProps) => {
  const [agents, setAgents] = useState<(Agent & { fullData?: any })[]>([])
  const [selectedAgents, setSelectedAgents] = useState<(Agent & { fullData?: any })[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedAgentForDetail, setSelectedAgentForDetail] = useState<(Agent & { fullData?: any }) | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [showFusionProgression, setShowFusionProgression] = useState(false)
  const [fusionAgents, setFusionAgents] = useState<[(Agent & { fullData?: any }), (Agent & { fullData?: any })] | null>(null)
  const [chatAgent, setChatAgent] = useState<(Agent & { fullData?: any }) | null>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Try to load configs dynamically
        const configs = await loadAgentConfigs()
        
        if (Object.keys(configs).length > 0) {
          // Generate agents from loaded configs
          const agentsWithOwner = generateMockAgents(configs, walletAddress)
          setAgents(agentsWithOwner)
        } else {
          // No predefined agents - users create their own
          setAgents([])
        }
      } catch (error) {
        console.error('Failed to load agents:', error)
        // No agents available
        setAgents([])
      }
    }

    loadAgents()
  }, [walletAddress])

  const handleAgentCardClick = (agent: Agent & { fullData?: any }) => {
    setSelectedAgentForDetail(agent)
    setDetailModalOpen(true)
  }

  const handleSelectAgent = (agent: Agent & { fullData?: any }) => {
    setSelectedAgents(prev => {
      const isAlreadySelected = prev.some(a => a.id === agent.id)
      if (isAlreadySelected) {
        return prev.filter(a => a.id !== agent.id)
      } else if (prev.length < 2) {
        return [...prev, agent]
      }
      return prev
    })
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

  const handleChatAgent = (agent: Agent & { fullData?: any }) => {
    setChatAgent(agent)
    setShowChat(true)
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
          <button className="create-agent-btn">
            🧬 Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map(agent => (
            <AgentCard 
              key={agent.id}
              agent={agent}
              selected={isAgentSelected(agent.id)}
              onClick={() => handleAgentCardClick(agent)}
              onSelect={() => handleSelectAgent(agent)}
              onChat={() => handleChatAgent(agent)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAgentForDetail && (
        <AgentDetailModal
          agent={selectedAgentForDetail}
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedAgentForDetail(null)
          }}
          isSelected={isAgentSelected(selectedAgentForDetail.id)}
          onSelect={handleSelectAgent}
        />
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

      {/* Agent Chat */}
      <AgentChat
        agent={chatAgent}
        isOpen={showChat}
        onClose={() => {
          setShowChat(false)
          setChatAgent(null)
        }}
      />

      <style>{`
        .dashboard {
          padding: 2rem;
        }

        .subtitle {
          color: #888;
          margin-bottom: 2rem;
          font-size: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 2px dashed rgba(139, 92, 246, 0.3);
          margin: 2rem 0;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .empty-state h3 {
          color: #fff;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }

        .empty-state p {
          color: #888;
          margin-bottom: 2rem;
          font-size: 1.1rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .create-agent-btn {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-agent-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .agents-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }

        @media (max-width: 600px) {
          .agents-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
