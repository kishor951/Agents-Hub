import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@meshsdk/react'
import { Agent } from '../types'
import AgentCard from './AgentCard'
import SelectionToast from './SelectionToast'
import ComparisonScreen from './ComparisonScreen'
import FusionProgression from './FusionProgression'
import { getUserAgents } from '../utils/walletAgents'
import { fetchAgent } from '../utils/api'

interface DashboardProps {
  walletAddress: string
  onStartBreeding: (parentA: Agent, parentB: Agent) => void
}



const Dashboard = ({ walletAddress, onStartBreeding }: DashboardProps) => {
  const navigate = useNavigate()
  const { wallet, connected } = useWallet()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [showFusionProgression, setShowFusionProgression] = useState(false)
  const [fusionAgents, setFusionAgents] = useState<[Agent, Agent] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [rotatingWord, setRotatingWord] = useState('Ideate')
  const [loading, setLoading] = useState(true)

  // Rotating words for the feature text
  const rotatingWords = ['Ideate', 'Innovate', 'Solve', 'Create', 'Discover']

  useEffect(() => {
    const loadAgents = async () => {
      if (!connected || !wallet) {
        console.log('⏳ [Dashboard] Waiting for wallet connection...')
        setLoading(false)
        setAgents([])
        setFilteredAgents([])
        return
      }

      try {
        setLoading(true)
        console.log('🔍 [Dashboard] Discovering agents from wallet...')
        
        // Step 1: Discover agents from wallet UTXOs
        const walletAgents = await getUserAgents(wallet)
        console.log(`✅ [Dashboard] Found ${walletAgents.length} agent assets in wallet`)
        
        if (walletAgents.length === 0) {
          setAgents([])
          setFilteredAgents([])
          setLoading(false)
          return
        }
        
        // Step 2: Fetch full metadata for each agent (limit to 10 for performance)
        const agentsToFetch = walletAgents.slice(0, 10)
        console.log(`📡 [Dashboard] Fetching metadata for ${agentsToFetch.length} agents...`)
        
        const agentPromises = agentsToFetch.map(async (walletAgent) => {
          try {
            const agentData = await fetchAgent(walletAgent.assetId)
            
            // Map snake_case response to Agent interface (camelCase)
            const agent: Agent = {
              id: agentData.asset_id,
              tokenId: agentData.asset_id,
              name: agentData.name || walletAgent.assetName || 'Unnamed Agent',
              purpose: agentData.purpose,  // From genetic data
              instructions: agentData.instructions,  // From genetic data
              personality: agentData.personality,  // From genetic data
              skills: agentData.skills || [],  // From genetic data
              llmModel: agentData.llm_model,  // From genetic data
              generation: agentData.generation || 0,
              xp: agentData.xp || 0,
              owner: walletAddress,
              ownerAddress: walletAddress,
              geneticHash: agentData.genetic_hash || agentData.brain_cid?.replace('genetic://', '').replace('ipfs://', ''),
              ipfsCid: agentData.brain_cid?.replace('ipfs://', '').replace('genetic://', ''),
              masumiDid: agentData.masumi_did,
              minted: true,
              txHash: agentData.mint_tx_hash,
              parents: agentData.parents as [string, string] | undefined,
              createdAt: agentData.mint_tx_hash ? 'On-chain' : undefined
            }
            
            return agent
          } catch (error: any) {
            console.error(`❌ [Dashboard] Failed to fetch agent ${walletAgent.assetId}:`, error)
            // Return a minimal agent object for failed fetches
            return {
              id: walletAgent.assetId,
              tokenId: walletAgent.assetId,
              name: walletAgent.assetName || 'Unknown Agent',
              generation: 0,
              xp: 0,
              owner: walletAddress,
              ownerAddress: walletAddress,
              skills: [],
              minted: true
            } as Agent
          }
        })
        
        const fetchedAgents = await Promise.all(agentPromises)
        const validAgents = fetchedAgents.filter(a => a !== null) as Agent[]
        
        console.log(`✅ [Dashboard] Loaded ${validAgents.length} agents for dashboard`)
        setAgents(validAgents)
        setFilteredAgents(validAgents)
      } catch (error: any) {
        console.error('❌ [Dashboard] Failed to load agents:', error)
        setAgents([])
        setFilteredAgents([])
      } finally {
        setLoading(false)
      }
    }

    loadAgents()
  }, [wallet, connected, walletAddress])

  // Filter agents based on search query
  useEffect(() => {
    if (!agents || !Array.isArray(agents)) {
      setFilteredAgents([])
      return
    }
    
    if (!searchQuery.trim()) {
      setFilteredAgents(agents)
    } else {
      const query: string = searchQuery.toLowerCase()
      const filtered = agents.filter(agent => {
        if (!agent) return false
        
        try {
          return (
            (agent.name && typeof agent.name === 'string' && agent.name.toLowerCase().includes(query)) ||
            (agent.purpose && typeof agent.purpose === 'string' && agent.purpose.toLowerCase().includes(query)) ||
            (agent.instructions && typeof agent.instructions === 'string' && agent.instructions.toLowerCase().includes(query)) ||
            (agent.skills && Array.isArray(agent.skills) && agent.skills.some(skill => skill.toLowerCase().includes(query)))
          )
        } catch (error) {
          console.error('Error filtering agent:', agent, error)
          return false
        }
      })
      setFilteredAgents(filtered)
    }
  }, [searchQuery, agents])

  // Rotate words every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingWord(prev => {
        const currentIndex = rotatingWords.indexOf(prev)
        const nextIndex = (currentIndex + 1) % rotatingWords.length
        return rotatingWords[nextIndex]
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const handleAgentCardClick = (agent: Agent) => {
    navigate(`/agent/${agent.id}`)
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
      
      {/* Plain Text */}
      <div className="plain-text">
        <span className="fixed-text">Explore • Chat • </span><span className="rotating-container"><span key={rotatingWord} className="rotating-word">{rotatingWord}</span></span>
      </div>

      {/* Search Bar */}
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
                ✕
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
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <h3>Loading Agents...</h3>
          <p>Discovering your agents from the blockchain...</p>
        </div>
      ) : agents.length === 0 ? (
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
          {filteredAgents && Array.isArray(filteredAgents) && filteredAgents.map(agent => (
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

        /* Plain Text */
        .plain-text {
          font-size: 4rem;
          font-weight: 600;
          color: #FFFFFF;
          text-align: center;
          margin-bottom: 2rem;
          font-family: var(--font-headline, 'Tomorrow', sans-serif);
          display: inline-block;
          width: 100%;
        }

        .fixed-text {
          display: inline;
        }

        .rotating-container {
          display: inline-block;
          width: 140px;
          text-align: left;
          vertical-align: top;
        }

        .rotating-word {
          color: #06b6d4;
          animation: fadeIn 0.8s ease-in-out;
          display: inline-block;
          width: 100%;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Search Container */
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
