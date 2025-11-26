import { useState, useEffect } from 'react'
import { Agent } from '../types'
import AgentCard from './AgentCard'

interface DashboardProps {
  walletAddress: string
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
}

// Mock data for demo - in production, fetch from backend
const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    tokenId: 'agent001',
    name: 'CodeMaster Alpha',
    skills: ['Python', 'JavaScript', 'Debugging', 'Code Review'],
    personaPrompt: 'Expert software engineer with focus on code quality',
    generation: 0,
    geneticHash: 'hash_alpha_001',
    ownerAddress: '',
    imageUrl: '🤖'
  },
  {
    id: '2',
    tokenId: 'agent002',
    name: 'DataWizard Beta',
    skills: ['Data Analysis', 'SQL', 'Statistics', 'Visualization'],
    personaPrompt: 'Data scientist specializing in insights and analytics',
    generation: 0,
    geneticHash: 'hash_beta_002',
    ownerAddress: '',
    imageUrl: '📊'
  },
  {
    id: '3',
    tokenId: 'agent003',
    name: 'DesignGuru Gamma',
    skills: ['UI Design', 'UX Research', 'Prototyping', 'Figma'],
    personaPrompt: 'Creative designer focused on user experience',
    generation: 0,
    geneticHash: 'hash_gamma_003',
    ownerAddress: '',
    imageUrl: '🎨'
  },
  {
    id: '4',
    tokenId: 'agent004',
    name: 'BlockchainSage Delta',
    skills: ['Solidity', 'Smart Contracts', 'DeFi', 'Security Audits'],
    personaPrompt: 'Blockchain expert specializing in secure smart contracts',
    generation: 0,
    geneticHash: 'hash_delta_004',
    ownerAddress: '',
    imageUrl: '⛓️'
  }
]

const Dashboard = ({ walletAddress, onStartBreeding }: DashboardProps) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedA, setSelectedA] = useState<Agent | null>(null)
  const [selectedB, setSelectedB] = useState<Agent | null>(null)

  useEffect(() => {
    // In production, fetch from API: /api/agents?owner=${walletAddress}
    const agentsWithOwner = MOCK_AGENTS.map(a => ({ ...a, ownerAddress: walletAddress }))
    setAgents(agentsWithOwner)
  }, [walletAddress])

  const handleSelectAgent = (agent: Agent) => {
    if (!selectedA) {
      setSelectedA(agent)
    } else if (!selectedB && agent.id !== selectedA.id) {
      setSelectedB(agent)
    } else if (agent.id === selectedA.id) {
      setSelectedA(null)
    } else if (agent.id === selectedB?.id) {
      setSelectedB(null)
    }
  }

  const handleFuse = () => {
    if (selectedA && selectedB) {
      onStartBreeding(selectedA, selectedB)
    }
  }

  const isSelected = (agent: Agent) => {
    return agent.id === selectedA?.id || agent.id === selectedB?.id
  }

  return (
    <div className="dashboard">
      <h2>My Agents</h2>
      <p className="subtitle">Select two agents to fuse</p>

      <div className="selection-status">
        {selectedA && <div className="selected-badge">Parent A: {selectedA.name}</div>}
        {selectedB && <div className="selected-badge">Parent B: {selectedB.name}</div>}
      </div>

      <div className="agents-grid">
        {agents.map(agent => (
          <AgentCard 
            key={agent.id}
            agent={agent}
            selected={isSelected(agent)}
            onClick={() => handleSelectAgent(agent)}
          />
        ))}
      </div>

      {selectedA && selectedB && (
        <div className="fuse-action">
          <button className="fuse-button" onClick={handleFuse}>
            🧬 Fuse Agents
          </button>
        </div>
      )}

      <style>{`
        .dashboard {
          padding: 2rem;
        }

        .subtitle {
          color: #888;
          margin-bottom: 2rem;
        }

        .selection-status {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .selected-badge {
          background: #4ade80;
          color: #000;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: bold;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .fuse-action {
          text-align: center;
        }

        .fuse-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 1rem 3rem;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          border-radius: 12px;
          transition: transform 0.2s;
        }

        .fuse-button:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  )
}

export default Dashboard
