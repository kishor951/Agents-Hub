import { useState, useEffect } from 'react'
import { Agent } from '../types'

interface MyAgentsProps {
  walletAddress: string | null
}

const MyAgents = ({ walletAddress }: MyAgentsProps) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch agents from backend
  useEffect(() => {
    const fetchAgents = async () => {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/agents?owner=${walletAddress}`)
        if (!response.ok) {
          throw new Error('Failed to fetch agents')
        }
        const data = await response.json()
        setAgents(data.agents || [])
      } catch (err) {
        console.error('Error fetching agents:', err)
        setError('Failed to load agents')
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [walletAddress])

  const handleSelectAgent = (agentId: string) => {
    const newSelected = new Set(selectedAgents)
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId)
    } else {
      newSelected.add(agentId)
    }
    setSelectedAgents(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedAgents.size === agents.length) {
      setSelectedAgents(new Set())
    } else {
      setSelectedAgents(new Set(agents.map(a => a.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedAgents.size === 0) return

    if (!confirm(`Delete ${selectedAgents.size} agent(s)? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete each selected agent
      const deletePromises = Array.from(selectedAgents).map(agentId =>
        fetch(`/api/agents/${agentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: walletAddress })
        })
      )

      await Promise.all(deletePromises)

      // Remove from local state
      setAgents(prev => prev.filter(a => !selectedAgents.has(a.id)))
      setSelectedAgents(new Set())
    } catch (err) {
      alert('Failed to delete agents')
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Delete this agent? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: walletAddress })
      })

      if (!response.ok) {
        throw new Error('Failed to delete agent')
      }

      // Remove from local state
      setAgents(prev => prev.filter(a => a.id !== agentId))
      setSelectedAgents(prev => {
        const newSet = new Set(prev)
        newSet.delete(agentId)
        return newSet
      })
    } catch (err) {
      alert('Failed to delete agent')
    }
  }

  if (loading) {
    return (
      <div className="my-agents-page">
        <div className="loading">Loading your agents...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-agents-page">
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="my-agents-page">
      <div className="page-header">
        <h1>My Agents</h1>
        <div className="actions">
          <button
            className="action-btn select-all"
            onClick={handleSelectAll}
          >
            {selectedAgents.size === agents.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            className="action-btn delete-selected"
            onClick={handleDeleteSelected}
            disabled={selectedAgents.size === 0}
          >
            Delete Selected ({selectedAgents.size})
          </button>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="no-agents">
          <p>You haven't created any agents yet.</p>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map(agent => (
            <div key={agent.id} className="agent-item">
              <input
                type="checkbox"
                checked={selectedAgents.has(agent.id)}
                onChange={() => handleSelectAgent(agent.id)}
                className="agent-checkbox"
              />
              <div className="agent-card">
                <div className="agent-icon">
                  {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                    <img src={agent.imageUrl} alt={agent.name} className="agent-image" />
                  ) : (
                    agent.imageUrl || '🤖'
                  )}
                </div>
                <h3>{agent.name}</h3>
                <div className="agent-meta">
                  <span className="generation">Gen {agent.generation}</span>
                  {agent.tokenId && <span className="token-id">{agent.tokenId.slice(0, 12)}...</span>}
                </div>
                <div className="skills">
                  {agent.skills.slice(0, 2).map((skill, idx) => (
                    <span key={idx} className="skill-badge">{skill}</span>
                  ))}
                  {agent.skills.length > 2 && <span className="skill-badge">+{agent.skills.length - 2}</span>}
                </div>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDeleteAgent(agent.id)}
                title="Delete agent"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .my-agents-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          font-family: 'Orbitron', sans-serif;
          color: var(--color-text-primary, #FFFFFF);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .actions {
          display: flex;
          gap: 1rem;
        }

        .action-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.875rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s;
        }

        .select-all {
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.3);
          color: var(--color-primary, #00F0FF);
        }

        .select-all:hover {
          background: rgba(0, 240, 255, 0.2);
        }

        .delete-selected {
          background: rgba(255, 82, 82, 0.1);
          border: 1px solid rgba(255, 82, 82, 0.3);
          color: #FF5252;
        }

        .delete-selected:hover:not(:disabled) {
          background: rgba(255, 82, 82, 0.2);
        }

        .delete-selected:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .agent-item {
          position: relative;
          background: rgba(0, 240, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.3s;
        }

        .agent-item:hover {
          border-color: rgba(0, 240, 255, 0.4);
          transform: translateY(-4px);
        }

        .agent-checkbox {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 20px;
          height: 20px;
          accent-color: var(--color-primary, #00F0FF);
        }

        .agent-card {
          text-align: center;
        }

        .agent-icon {
          font-size: 4.5rem;
          margin-bottom: 1.5rem;
          height: 120px;
          width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .agent-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid rgba(0, 240, 255, 0.15);
        }

        .agent-card h3 {
          font-size: 1.5rem;
          margin: 1rem 0;
          color: var(--color-text-primary, #FFFFFF);
          font-weight: 700;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: capitalize;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .agent-meta {
          display: flex;
          gap: 0.625rem;
          justify-content: center;
          margin-bottom: 1.25rem;
          font-size: 0.75rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
        }

        .generation {
          background: rgba(0, 240, 255, 0.08);
          color: var(--color-primary, #00F0FF);
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          border: 1px solid rgba(0, 240, 255, 0.18);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .token-id {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: var(--font-mono, 'Space Mono', monospace);
          color: var(--color-text-secondary, #8F90A6);
          letter-spacing: 0.02em;
        }

        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .skill-badge {
          background: rgba(255, 255, 255, 0.06);
          color: var(--color-text-primary, #FFFFFF);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          font-size: 0.6875rem;
          font-weight: 600;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .delete-btn {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          background: rgba(255, 82, 82, 0.1);
          border: 1px solid rgba(255, 82, 82, 0.3);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 1.2rem;
        }

        .delete-btn:hover {
          background: rgba(255, 82, 82, 0.2);
          transform: scale(1.1);
        }

        .no-agents {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-secondary, #8F90A6);
        }

        .loading, .error {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-primary, #FFFFFF);
        }

        @media (max-width: 768px) {
          .my-agents-page {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .actions {
            justify-content: center;
          }

          .agents-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .agent-item {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default MyAgents