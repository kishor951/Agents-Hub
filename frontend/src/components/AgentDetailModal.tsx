import { useState } from 'react'
import { Agent } from '../types'

interface AgentDetailModalProps {
  agent: Agent & { fullData?: any }
  isOpen: boolean
  onClose: () => void
  isSelected: boolean
  onSelect: (agent: Agent) => void
}

const AgentDetailModal = ({ agent, isOpen, onClose, isSelected, onSelect }: AgentDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'chat' | 'breed'>('info')

  if (!isOpen) return null

  const fullData = agent.fullData || {}
  const personality = fullData.personality || {}
  const specialization = fullData.specialization || {}
  const capabilities = fullData.capabilities || {}
  const skills = fullData.skills || {}

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="agent-detail-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="agent-header-info">
            <div className="agent-avatar-large">{agent.imageUrl || '🤖'}</div>
            <div className="agent-header-text">
              <h2>{agent.name}</h2>
              <p className="agent-type">{specialization.primary_domain || 'General Agent'}</p>
              {personality.traits && (
                <div className="personality-badges">
                  {personality.traits.slice(0, 3).map((trait: string) => (
                    <span key={trait} className="badge-small">{trait}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            ℹ️ Information
          </button>
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`tab ${activeTab === 'breed' ? 'active' : ''}`}
            onClick={() => setActiveTab('breed')}
          >
            🧬 Breed
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {activeTab === 'info' && (
            <div className="info-tab">
              {/* Personality & Traits */}
              <section className="info-section">
                <h3>Personality & Traits</h3>
                {personality.traits && (
                  <div className="traits-grid">
                    {personality.traits.map((trait: string) => (
                      <div key={trait} className="trait-badge">{trait}</div>
                    ))}
                  </div>
                )}
                {personality.tone && (
                  <p><strong>Communication Style:</strong> {personality.tone.replace(/_/g, ' ')}</p>
                )}
              </section>

              {/* Specialization */}
              <section className="info-section">
                <h3>Specialization</h3>
                {specialization.focus_areas && (
                  <div className="focus-areas">
                    {specialization.focus_areas.map((area: string) => (
                      <div key={area} className="focus-item">
                        <span className="checkmark">✓</span>
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Skills */}
              <section className="info-section">
                <h3>Core Skills</h3>
                {skills.languages && (
                  <div className="skills-display">
                    {skills.languages.slice(0, 6).map((lang: any) => (
                      <div key={lang.name} className="skill-item">
                        <span className="skill-name">{lang.name}</span>
                        <span className="skill-level">{lang.proficiency}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Capabilities */}
              <section className="info-section">
                <h3>Key Capabilities</h3>
                {capabilities.can_do && (
                  <div className="capabilities-list">
                    {capabilities.can_do.slice(0, 8).map((cap: string) => (
                      <div key={cap} className="capability">
                        <span className="check">✓</span>
                        <span>{cap.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Description */}
              {agent.personaPrompt && (
                <section className="info-section">
                  <h3>Profile Description</h3>
                  <p className="description-text">{agent.personaPrompt}</p>
                </section>
              )}

              {/* Metadata */}
              <section className="info-section">
                <h3>Metadata</h3>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="label">Generation</span>
                    <span className="value">{agent.generation}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Token ID</span>
                    <span className="value">{agent.tokenId?.slice(0, 8)}...</span>
                  </div>
                  {fullData.metadata?.reliability_score && (
                    <div className="metadata-item">
                      <span className="label">Reliability</span>
                      <span className="value">{(fullData.metadata.reliability_score * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {fullData.metadata?.user_satisfaction && (
                    <div className="metadata-item">
                      <span className="label">User Rating</span>
                      <span className="value">{(fullData.metadata.user_satisfaction * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="chat-tab">
              <div className="chat-placeholder">
                <p className="chat-icon">💬</p>
                <h4>Chat with {agent.name}</h4>
                <p>Coming soon! You'll be able to chat with this agent and test their capabilities.</p>
                <div className="chat-example">
                  <p><strong>Example interaction:</strong></p>
                  <p>"How would you approach optimizing this React component?"</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'breed' && (
            <div className="breed-tab">
              <div className="breed-info">
                <p className="breed-icon">🧬</p>
                <h4>Ready to Breed?</h4>
                <p>Select this agent to combine it with another agent to create a new hybrid agent with combined skills.</p>
                <div className="breed-benefits">
                  <p><strong>Benefits of breeding:</strong></p>
                  <ul>
                    <li>Combine specialized skills from both parent agents</li>
                    <li>Create unique personality combinations</li>
                    <li>Expand your agent's capabilities</li>
                    <li>Mint as NFT on Cardano blockchain</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className={`btn-primary ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              onSelect(agent)
            }}
          >
            {isSelected ? '✓ Selected for Breeding' : 'Select for Breeding'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 999;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .agent-detail-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 700px;
          max-height: 85vh;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
          border: 1px solid #444;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideUp 0.3s ease;
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

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2rem;
          border-bottom: 1px solid #444;
        }

        .agent-header-info {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .agent-avatar-large {
          font-size: 4rem;
          min-width: 80px;
          text-align: center;
        }

        .agent-header-text h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
          color: #fff;
        }

        .agent-type {
          margin: 0 0 1rem 0;
          color: #aaa;
          font-size: 0.95rem;
        }

        .personality-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .badge-small {
          background: rgba(100, 200, 255, 0.2);
          color: #64c8ff;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .close-button {
          background: none;
          border: none;
          color: #aaa;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.2s;
        }

        .close-button:hover {
          color: #fff;
        }

        .modal-tabs {
          display: flex;
          border-bottom: 1px solid #444;
          background: rgba(0, 0, 0, 0.2);
        }

        .tab {
          flex: 1;
          background: none;
          border: none;
          color: #aaa;
          padding: 1rem;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }

        .tab:hover {
          color: #fff;
          background: rgba(100, 200, 255, 0.1);
        }

        .tab.active {
          color: #64c8ff;
          border-bottom-color: #64c8ff;
          background: rgba(100, 200, 255, 0.1);
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .info-tab {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-section {
          border-left: 3px solid #64c8ff;
          padding-left: 1rem;
        }

        .info-section h3 {
          margin: 0 0 0.8rem 0;
          color: #64c8ff;
          font-size: 1rem;
        }

        .traits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .trait-badge {
          background: rgba(100, 200, 255, 0.15);
          color: #64c8ff;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          text-align: center;
          border: 1px solid rgba(100, 200, 255, 0.3);
        }

        .info-section p {
          margin: 0.5rem 0;
          color: #ddd;
          line-height: 1.5;
        }

        .focus-areas {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .focus-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ddd;
        }

        .checkmark {
          color: #4ade80;
          font-weight: bold;
        }

        .skills-display {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.8rem;
        }

        .skill-item {
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.3);
          padding: 0.6rem;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .skill-name {
          color: #fff;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .skill-level {
          color: #4ade80;
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .capabilities-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .capability {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ddd;
          font-size: 0.9rem;
        }

        .check {
          color: #4ade80;
        }

        .description-text {
          background: rgba(100, 200, 255, 0.05);
          padding: 1rem;
          border-radius: 8px;
          color: #ddd;
          line-height: 1.6;
          margin: 0;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.8rem;
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.6rem;
          border-radius: 6px;
        }

        .metadata-item .label {
          color: #aaa;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .metadata-item .value {
          color: #64c8ff;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .chat-tab,
        .breed-tab {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .chat-placeholder,
        .breed-info {
          text-align: center;
        }

        .chat-icon,
        .breed-icon {
          font-size: 3rem;
          margin: 0 0 1rem 0;
        }

        .chat-placeholder h4,
        .breed-info h4 {
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .chat-placeholder p,
        .breed-info p {
          color: #aaa;
          margin: 0 0 1rem 0;
        }

        .chat-example {
          background: rgba(100, 200, 255, 0.1);
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
          max-width: 400px;
          margin: 0 auto;
        }

        .chat-example p {
          margin: 0.3rem 0;
          font-size: 0.9rem;
          color: #ddd;
        }

        .breed-benefits ul {
          text-align: left;
          display: inline-block;
          color: #ddd;
          padding-left: 1.5rem;
        }

        .breed-benefits li {
          margin: 0.3rem 0;
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #444;
          background: rgba(0, 0, 0, 0.3);
        }

        .btn-secondary,
        .btn-primary {
          flex: 1;
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ddd;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-primary.selected {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        }

        /* Scrollbar styling */
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        @media (max-width: 600px) {
          .agent-detail-modal {
            width: 95%;
            max-height: 90vh;
          }

          .agent-header-info {
            flex-direction: column;
            align-items: center;
          }

          .traits-grid,
          .metadata-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  )
}

export default AgentDetailModal
