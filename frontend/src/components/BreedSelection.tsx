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
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredAgents, setFilteredAgents] = useState<Agent[] | null>(null)
  const [currentSentence, setCurrentSentence] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Load user's agents
  useEffect(() => {
    loadUserAgents()
  }, [walletAddress])

  // Update filtered agents when agents or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAgents(agents)
      return
    }

    const q = searchQuery.toLowerCase()
    const results = agents.filter(a => {
      const skills = (a.skills || '').toString().toLowerCase()
      const name = (a.name || '').toLowerCase()
      const purpose = (a.purpose || '').toLowerCase()
      const personality = (a.personality || '').toLowerCase()
      return (
        name.includes(q) ||
        purpose.includes(q) ||
        skills.includes(q) ||
        personality.includes(q)
      )
    })
    setFilteredAgents(results)
  }, [searchQuery, agents])

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
    { text: "Now AI Agents can also Breed!", highlight: "Breed!" }
  ]

  return (
    <div className="breed-selection-page">
      <div className="page-header">
        <div className={`catchy-line ${isAnimating ? 'fade-out' : 'fade-in'}`}>
          {sentences[currentSentence].text.split(sentences[currentSentence].highlight)[0]}
          <span className="super-word">{sentences[currentSentence].highlight}</span>
          {sentences[currentSentence].text.split(sentences[currentSentence].highlight)[1]}
        </div>
      </div>

      {/* My Agents Section */}
      <div className="my-agents-section">
        <h2 className="section-header">
          <span className="section-number">{`\u00A0`}</span>
          Agents available <span className="section-count">({agents.length})</span>
        </h2>

        {/* Search Bar (same style as Explore/Dashboard) */}
        {agents.length > 0 && (
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search agents by name, description, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="clear-search"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="search-results">
                {(!filteredAgents || filteredAgents.length === 0) ? (
                  <span className="no-results">No agents found matching "{searchQuery}"</span>
                ) : (
                  <span className="results-count">
                    {filteredAgents.length} of {agents.length} agents
                  </span>
                )}
              </div>
            )}
          </div>
        )}
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
              {(filteredAgents || agents).map(agent => (
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

            {/* Breeding Section */}
            <div className="breeding-section">
              <h3>Selected Parents</h3>
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
                Get a Date
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

        .page-header p {
          color: var(--color-text-secondary, #8F90A6);
          font-size: 1.125rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
        }

        /* Search Container (copied from Dashboard for parity) */
        .search-container {
          margin-bottom: 2rem;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          padding: 0.75rem 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
          outline: none;
        }

        .search-input-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.4);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
          outline: none;
        }

        .search-icon {
          color: var(--color-text-secondary, #8F90A6);
          margin-right: 0.75rem;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--color-text-primary, #FFFFFF);
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          outline: none;
          padding: 0;
        }

        .search-input:focus,
        .search-input:focus-visible,
        .search-input-wrapper:focus,
        .search-input-wrapper:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }

        .clear-search {
          background: none;
          border: none;
          color: var(--color-text-secondary, #8F90A6);
          font-size: 1rem;
          cursor: pointer;
          padding: 0.25rem;
          margin-left: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .clear-search:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text-primary, #FFFFFF);
        }

        .search-results {
          margin-top: 0.75rem;
          text-align: center;
        }

        .results-count {
          font-size: 0.75rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #8F90A6);
        }

        .no-results {
          font-size: 0.875rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-danger, #FF5252);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.15rem; /* Match Core Agent Details font size */
          margin-bottom: 0.75rem;
          color: #e2e8f0;
          text-transform: none !important; /* keep normal casing */
          font-weight: 500;
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

        .section-count {
          color: #94a3b8;
          font-size: 1rem;
          font-weight: 600;
          margin-left: 6px;
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
