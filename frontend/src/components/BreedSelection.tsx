import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@meshsdk/react'
import { Agent } from '../types'
import { getUserAgents } from '../utils/walletAgents'
import { fetchAgent } from '../utils/api'

interface BreedSelectionProps {
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
}

const BreedSelection = ({ onStartBreeding }: BreedSelectionProps) => {
  const { wallet, connected } = useWallet()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedParents, setSelectedParents] = useState<[Agent | null, Agent | null]>([null, null])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredAgents, setFilteredAgents] = useState<Agent[] | null>(null)
  const [currentSentence, setCurrentSentence] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(false)
  const breedingSectionRef = useRef<HTMLDivElement>(null)

  // Get generation color (same as AgentCard)
  const getGenerationColor = (generation: number) => {
    switch (generation) {
      case 1:
        return { hex: '#FF6B35', rgb: '255, 107, 53' }; // Orange
      case 2:
        return { hex: '#4ECDC4', rgb: '78, 205, 196' }; // Teal
      case 3:
        return { hex: '#45B7D1', rgb: '69, 183, 209' }; // Blue
      case 4:
        return { hex: '#96CEB4', rgb: '150, 206, 180' }; // Green
      default:
        return { hex: '#FECA57', rgb: '254, 202, 87' }; // Yellow for generation 5+
    }
  }

  // Truncate description text
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
  }

  // Load user's agents
  const loadUserAgents = useCallback(async () => {
    if (!connected || !wallet) {
      console.log('⏳ [BreedSelection] Waiting for wallet connection...')
      setLoading(false)
      setAgents([])
      return
    }

    try {
      setLoading(true)
      console.log('🔍 [BreedSelection] Discovering agents from wallet...')
      
      // Step 1: Discover agents from wallet UTXOs
      const walletAgents = await getUserAgents(wallet)
      console.log(`✅ [BreedSelection] Found ${walletAgents.length} agent assets in wallet`)
      
      if (walletAgents.length === 0) {
        setAgents([])
        setLoading(false)
        return
      }
      
      // Step 2: Fetch full metadata for each agent
      console.log(`📡 [BreedSelection] Fetching metadata for ${walletAgents.length} agents...`)
      
      const agentPromises = walletAgents.map(async (walletAgent) => {
        try {
          const agentData = await fetchAgent(walletAgent.assetId)
          
          // Map snake_case response to Agent interface (camelCase)
          const agent: Agent = {
            id: agentData.asset_id,
            tokenId: agentData.asset_id,
            name: agentData.name || walletAgent.assetName || 'Unnamed Agent',
            purpose: agentData.purpose,
            instructions: agentData.instructions,
            personality: agentData.personality,
            skills: agentData.skills || [],
            llmModel: agentData.llm_model,
            generation: agentData.generation || 0,
            xp: agentData.xp || 0,
            breedCount: agentData.breed_count || 0,
            owner: '',
            ownerAddress: '',
            geneticHash: agentData.genetic_hash || agentData.brain_cid?.replace('genetic://', '').replace('ipfs://', ''),
            ipfsCid: agentData.brain_cid?.replace('ipfs://', '').replace('genetic://', ''),
            masumiDid: agentData.masumi_did,
            minted: true,
            txHash: agentData.mint_tx_hash,
            parents: agentData.parents as [string, string] | undefined,
            createdAt: agentData.mint_tx_hash ? 'On-chain' : undefined,
            imageUrl: agentData.image_ipfs_cid 
              ? `ipfs://${agentData.image_ipfs_cid}` 
              : undefined
          }
          
          return agent
        } catch (error: any) {
          console.error(`❌ [BreedSelection] Failed to fetch agent ${walletAgent.assetId}:`, error)
          // Return minimal agent object for failed fetches
          return {
            id: walletAgent.assetId,
            tokenId: walletAgent.assetId,
            name: walletAgent.assetName || 'Unknown Agent',
            generation: 0,
            xp: 0,
            skills: [],
            minted: true
          } as Agent
        }
      })
      
      const fetchedAgents = await Promise.all(agentPromises)
      const validAgents = fetchedAgents.filter(a => a !== null) as Agent[]
      
      console.log(`✅ [BreedSelection] Loaded ${validAgents.length} agents for breeding`)
      setAgents(validAgents)
    } catch (error: any) {
      console.error('❌ [BreedSelection] Failed to load agents:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [wallet, connected])

  useEffect(() => {
    loadUserAgents()
  }, [loadUserAgents])

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


  const handleSelectParent = (agent: Agent) => {
    setSelectedParents(prev => {
      const [a, b] = prev
      
      // Toggle deselection: if clicking on an already selected agent, deselect it
      if (a?.id === agent.id) {
        return [null, b] // Deselect Parent A
      }
      if (b?.id === agent.id) {
        return [a, null] // Deselect Parent B
      }
      
      // Select logic: fill empty slots first
      if (!a) {
        return [agent, b]
      }
      if (!b) {
        return [a, agent]
      }
      
      // If both are selected and clicking a new agent, replace Parent A
      return [agent, b]
    })
  }

  // Auto-scroll to breeding section when both parents are selected
  useEffect(() => {
    if (selectedParents[0] && selectedParents[1] && breedingSectionRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        breedingSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    }
  }, [selectedParents])

  const handleBreedSelected = () => {
    if (selectedParents[0] && selectedParents[1]) {
      onStartBreeding(selectedParents[0], selectedParents[1])
    }
  }

  const sentences = [
    { text: "Should Humans have all the Fun?", highlight: "all the Fun?" },
    { text: "Now AI agents can date,", highlight: "date," },
    { text: "and also Breed!", highlight: "Breed!" }
  ]

  // Animate text change every 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentSentence(prev => (prev + 1) % sentences.length)
        setIsAnimating(false)
      }, 500) // Half of animation duration
    }, 5000)

    return () => clearTimeout(timer)
  }, [currentSentence])

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
        {loading ? (
          <div className="empty-agents loading-state">
            <div className="loading-spinner">🧬</div>
            <p>Loading your agents...</p>
            <p>Discovering agents from your wallet...</p>
          </div>
        ) : agents.length === 0 ? (
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
              {(filteredAgents || agents).map(agent => {
                const genColor = getGenerationColor(agent.generation || 0)
                return (
                  <div 
                    key={agent.id} 
                    className="agent-card"
                    style={{ '--card-bg-color': genColor.rgb } as React.CSSProperties}
                  >
                    {/* Generation Badge - Top Right */}
                    <div className="generation-badge" style={{ backgroundColor: genColor.hex }}>
                      <svg className="gen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                        <path d="M12 6v12"/>
                        <path d="M8 10h8"/>
                        <path d="M8 14h8"/>
                        <path d="M10 8h4"/>
                        <path d="M10 16h4"/>
                      </svg>
                      <span className="gen-text">Gen {agent.generation || 0}</span>
                    </div>

                    <div className="agent-header">
                      <div className="agent-image-wrapper">
                        {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                          <img src={agent.imageUrl} alt={agent.name} />
                        ) : (
                          <div className="agent-emoji">{agent.imageUrl || agent.name.charAt(0)}</div>
                        )}
                      </div>
                      <h3>{agent.name}</h3>
                    </div>
                    <p className="agent-description" title={agent.purpose}>
                      {truncateDescription(agent.purpose || '', 100)}
                    </p>
                    <div className="agent-actions">
                      <button
                        className={`select-btn ${selectedParents.includes(agent) ? 'selected' : ''}`}
                        onClick={() => handleSelectParent(agent)}
                      >
                        {selectedParents.includes(agent) ? 'Selected' : 'Select for Breeding'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Breeding Section - Only show when both parents are selected */}
            {selectedParents[0] && selectedParents[1] && (
              <div className="breeding-section" ref={breedingSectionRef}>
                <h3>Selected Parents</h3>
                <div className="selected-parents">
                  <div className="parent-slot">
                    <span>Parent A:</span>
                    <span className="selected-name">{selectedParents[0].name}</span>
                  </div>
                  <div className="parent-slot">
                    <span>Parent B:</span>
                    <span className="selected-name">{selectedParents[1].name}</span>
                  </div>
                </div>
                <button
                  className="breed-btn"
                  onClick={handleBreedSelected}
                >
                  Get a Date
                </button>
              </div>
            )}
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
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px dashed rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          color: var(--color-text-secondary, #8F90A6);
        }

        .empty-agents p {
          font-size: 1.125rem;
          margin: 0.5rem 0;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .loading-spinner {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          animation: spin 2s linear infinite;
          filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .agent-card {
          background: linear-gradient(135deg, rgba(var(--card-bg-color, 139, 92, 246), 0.08) 0%, rgba(var(--card-bg-color, 99, 102, 241), 0.08) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(var(--card-bg-color, 139, 92, 246), 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.1);
          position: relative;
        }

        .agent-card:hover {
          transform: translateY(-4px);
          border-color: rgba(var(--card-bg-color, 139, 92, 246), 0.4);
          box-shadow: 0 0 30px rgba(var(--card-bg-color, 139, 92, 246), 0.3);
          background: linear-gradient(135deg, rgba(var(--card-bg-color, 139, 92, 246), 0.15) 0%, rgba(var(--card-bg-color, 99, 102, 241), 0.15) 100%);
        }

        .agent-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        }

        .agent-image-wrapper {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin-bottom: 1rem;
          border: 2px solid rgba(139, 92, 246, 0.3);
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
          overflow: hidden;
        }

        .agent-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .agent-emoji {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          border-radius: 50%;
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

        .agent-description {
          color: var(--color-text-secondary, #8F90A6);
          font-size: 0.875rem;
          margin: 1rem 0;
          text-align: center;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 3.9375rem; /* 3 lines * 1.5 line-height * 0.875rem */
        }

        /* Generation Badge - Top Right */
        .generation-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #0A0B10;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: var(--font-mono, 'Space Mono', monospace);
          letter-spacing: 0.05em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 3;
        }

        .gen-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .gen-text {
          font-weight: 800;
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
          border: 1px solid rgba(139, 92, 246, 0.2);
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
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.4);
          color: #8b5cf6;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
        }

        .select-btn.selected {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%);
          border-color: #8b5cf6;
          color: #FFFFFF;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        /* Breeding Section */
        .breeding-section {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.2);
        }

        .breeding-section h3 {
          font-size: 1.5rem;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
        }

        .parent-slot .empty {
          font-size: 1rem;
          color: var(--color-text-disabled, #6B7280);
          font-style: italic;
        }

        .breed-btn {
          padding: 1rem 3rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          border-radius: 100px;
          color: var(--color-text-primary, #FFFFFF);
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4), 0 0 30px rgba(139, 92, 246, 0.3);
        }

        .breed-btn:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.4);
          background: linear-gradient(135deg, #9d6aff 0%, #7475ff 100%);
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