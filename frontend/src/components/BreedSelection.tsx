import { useState, useEffect } from 'react'
import { Agent } from '../types'
import axios from 'axios'

interface BreedSelectionProps {
  walletAddress: string
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
}

const BreedSelection = ({ walletAddress, onStartBreeding }: BreedSelectionProps) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedParents, setSelectedParents] = useState<[Agent | null, Agent | null]>([null, null])

  // Load user's agents
  useEffect(() => {
    loadUserAgents()
  }, [walletAddress])

  const loadUserAgents = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/agents?owner=${walletAddress}`)
      setAgents(response.data.agents || [])
      console.log(`✅ Loaded ${response.data.agents?.length || 0} agents for breeding`)
    } catch (error) {
      console.error('Failed to load agents:', error)
      setAgents([])
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
    <div className="breed-selection-page">
      <div className="page-header">
        <h1>🧬 Breed Your Agents</h1>
        <div className="catchy-line">
          Why should Humans have all the Fun?
        </div>
      </div>

      {/* My Agents Section */}
      <div className="my-agents-section">
        <h2>🤖 My Agents ({agents.length})</h2>
        {agents.length === 0 ? (
          <div className="empty-agents">
            <p>You haven't created any agents yet.</p>
            <p>Create your first agent in the DIY Agent section!</p>
          </div>
        ) : agents.length < 2 ? (
          <div className="empty-agents">
            <p>You need at least 2 agents to breed.</p>
            <p>Create more agents in the DIY Agent section!</p>
          </div>
        ) : (
          <>
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
                      {selectedParents.includes(agent) ? '✓ Selected' : 'Select for Breeding'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Breeding Section */}
            <div className="breeding-section">
              <h3>🧬 Selected Parents</h3>
              <div className="selected-parents">
                <div className="parent-slot">
                  <span>Parent A:</span>
                  {selectedParents[0] ? (
                    <span className="selected-name">{selectedParents[0].name}</span>
                  ) : (
                    <span className="empty">Not selected</span>
                  )}
                </div>
                <div className="parent-slot">
                  <span>Parent B:</span>
                  {selectedParents[1] ? (
                    <span className="selected-name">{selectedParents[1].name}</span>
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
                🧬 Start Breeding
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .breed-selection-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2.5rem var(--content-padding, 0.09375rem);
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, #00F0FF 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .catchy-line {
          font-size: 4rem;
          font-weight: 600;
          font-family: var(--font-headline, 'Tomorrow', sans-serif);
          color: #FFFFFF;
          text-align: center;
          margin-bottom: 1rem;
        }

        .page-header p {
          color: var(--color-text-secondary, #8F90A6);
          font-size: 1.125rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
        }

        .my-agents-section {
          margin-top: 2rem;
        }

        .my-agents-section h2 {
          font-size: 1.75rem;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-primary, #FFFFFF);
          margin-bottom: 2rem;
        }

        .empty-agents {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px dashed rgba(0, 240, 255, 0.3);
          border-radius: 16px;
          color: var(--color-text-secondary, #8F90A6);
        }

        .empty-agents p {
          font-size: 1.125rem;
          margin: 0.5rem 0;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .agent-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .agent-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 240, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
        }

        .agent-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        }

        .agent-header img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin-bottom: 1rem;
          border: 2px solid rgba(0, 240, 255, 0.3);
        }

        .agent-header h3 {
          font-size: 1.25rem;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-primary, #FFFFFF);
          margin: 0;
        }

        .agent-card p {
          color: var(--color-text-secondary, #8F90A6);
          font-size: 0.875rem;
          margin: 1rem 0;
          text-align: center;
        }

        .agent-actions {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }

        .select-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          color: var(--color-text-secondary, #8F90A6);
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .select-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.4);
          color: var(--color-primary, #00F0FF);
          transform: translateY(-2px);
        }

        .select-btn.selected {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(0, 240, 255, 0.1));
          border-color: var(--color-primary, #00F0FF);
          color: var(--color-primary, #00F0FF);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }

        /* Breeding Section */
        .breeding-section {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid rgba(0, 240, 255, 0.3);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
        }

        .breeding-section h3 {
          font-size: 1.5rem;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-primary, #00F0FF);
          margin-bottom: 1.5rem;
        }

        .selected-parents {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-bottom: 2rem;
        }

        .parent-slot {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }

        .parent-slot > span:first-child {
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #8F90A6);
        }

        .parent-slot .selected-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-primary, #00F0FF);
          font-family: var(--font-headline, 'Orbitron', sans-serif);
        }

        .parent-slot .empty {
          font-size: 1rem;
          color: var(--color-text-disabled, #6B7280);
          font-style: italic;
        }

        .breed-btn {
          padding: 1rem 3rem;
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(255, 255, 255, 0.15));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 240, 255, 0.5);
          border-radius: 100px;
          color: var(--color-text-primary, #FFFFFF);
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
        }

        .breed-btn:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 0 40px rgba(0, 240, 255, 0.8);
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.5), rgba(255, 255, 255, 0.25));
        }

        .breed-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .agents-grid {
            grid-template-columns: 1fr;
          }

          .selected-parents {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default BreedSelection
