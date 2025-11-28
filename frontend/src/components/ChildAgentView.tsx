import { useState } from 'react'
import { Agent } from '../types'
import AgentCard from './AgentCard'
import axios from 'axios'

interface ChildAgentViewProps {
  agent: Agent
  onBack: () => void
}

const ChildAgentView = ({ agent, onBack }: ChildAgentViewProps) => {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTestAgent = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      // Call backend to query LLM with child agent's persona
      const result = await axios.post('/api/agent/query', {
        tokenId: agent.tokenId,
        query: query,
        personaPrompt: agent.personaPrompt,
        skills: agent.skills
      })

      setResponse(result.data.response)
    } catch (error) {
      console.error('Query error:', error)
      setResponse('Error: Unable to query agent. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="child-agent-view">
      <button className="back-button" onClick={onBack}>← Back to Dashboard</button>

      <div className="success-banner">
        <h2>🎉 Fusion Successful!</h2>
        <p>Your new agent has been minted on Cardano testnet</p>
      </div>

      <div className="agent-display">
        <AgentCard agent={agent} />
      </div>

      <div className="metadata-section">
        <h3>Agent Metadata</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <strong>Token ID:</strong> {agent.tokenId}
          </div>
          <div className="metadata-item">
            <strong>Generation:</strong> {agent.generation}
          </div>
          <div className="metadata-item">
            <strong>Genetic Hash:</strong> {(agent.geneticHash || 'N/A').substring(0, 32)}...
          </div>
          <div className="metadata-item">
            <strong>IPFS CID:</strong> 
            <a href={`https://ipfs.io/ipfs/${agent.ipfsCid}`} target="_blank" rel="noopener noreferrer">
              {agent.ipfsCid}
            </a>
          </div>
          <div className="metadata-item">
            <strong>Parents:</strong> {agent.parents?.join(' × ') || 'N/A'}
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>Test Your Agent</h3>
        <p>Ask your new agent a question to see its combined skills in action</p>
        
        <div className="query-box">
          <input
            type="text"
            placeholder="Ask your agent something..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTestAgent()}
          />
          <button onClick={handleTestAgent} disabled={loading || !query.trim()}>
            {loading ? '...' : '▶️ Ask'}
          </button>
        </div>

        {response && (
          <div className="response-box">
            <strong>Agent Response:</strong>
            <p>{response}</p>
          </div>
        )}

        {!response && (
          <div className="sample-queries">
            <p><em>Sample questions:</em></p>
            <button onClick={() => setQuery('What are your skills?')}>What are your skills?</button>
            <button onClick={() => setQuery('How can you help me?')}>How can you help me?</button>
          </div>
        )}
      </div>

      <div className="earnings-section">
        <h3>💰 Earnings Split</h3>
        <div className="earnings-display">
          <div className="earning-item">
            <span className="percentage">95%</span>
            <span className="label">Agent Owner</span>
          </div>
          <div className="earning-item">
            <span className="percentage">5%</span>
            <span className="label">Platform Fee</span>
          </div>
        </div>
        <p className="earnings-note">
          When others use your agent, you earn 95% of the usage fees
        </p>
      </div>

      <style>{`
        .child-agent-view {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .back-button {
          background: #333;
          margin-bottom: 2rem;
        }

        .success-banner {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: #000;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 2rem;
        }

        .success-banner h2 {
          margin-bottom: 0.5rem;
        }

        .agent-display {
          display: flex;
          justify-content: center;
          margin: 2rem 0;
        }

        .metadata-section {
          background: #1a1a1a;
          padding: 2rem;
          border-radius: 12px;
          margin: 2rem 0;
        }

        .metadata-section h3 {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .metadata-grid {
          display: grid;
          gap: 1rem;
        }

        .metadata-item {
          padding: 1rem;
          background: #2a2a2a;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .metadata-item a {
          color: #646cff;
          text-decoration: none;
          word-break: break-all;
        }

        .metadata-item a:hover {
          text-decoration: underline;
        }

        .demo-section {
          background: #1a1a1a;
          padding: 2rem;
          border-radius: 12px;
          margin: 2rem 0;
        }

        .demo-section h3 {
          margin-bottom: 0.5rem;
        }

        .demo-section > p {
          color: #888;
          margin-bottom: 1.5rem;
        }

        .query-box {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .query-box input {
          flex: 1;
          padding: 0.8rem;
          border: 2px solid #333;
          background: #2a2a2a;
          color: white;
          border-radius: 8px;
          font-size: 1rem;
        }

        .query-box input:focus {
          outline: none;
          border-color: #646cff;
        }

        .query-box button {
          padding: 0.8rem 2rem;
          background: #646cff;
          border: none;
          color: white;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
        }

        .query-box button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .response-box {
          background: #2a2a2a;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #4ade80;
        }

        .response-box p {
          margin-top: 0.5rem;
          line-height: 1.6;
        }

        .sample-queries {
          text-align: center;
          color: #888;
        }

        .sample-queries button {
          background: #333;
          margin: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        .earnings-section {
          background: #1a1a1a;
          padding: 2rem;
          border-radius: 12px;
          margin: 2rem 0;
          text-align: center;
        }

        .earnings-display {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin: 2rem 0;
        }

        .earning-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .percentage {
          font-size: 3rem;
          font-weight: bold;
          color: #4ade80;
        }

        .label {
          color: #888;
          margin-top: 0.5rem;
        }

        .earnings-note {
          color: #888;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  )
}

export default ChildAgentView
