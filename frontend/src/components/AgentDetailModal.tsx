import { useState } from 'react'
import { Agent } from '../types'
import axios from 'axios'

interface ChatMessage {
  id: string
  sender: 'user' | 'agent'
  text: string
  timestamp: Date
}

interface AgentDetailModalProps {
  agent: Agent & { fullData?: any }
  isOpen: boolean
  onClose: () => void
  isSelected: boolean
  onSelect: (agent: Agent) => void
}

const AgentDetailModal = ({ agent, isOpen, onClose, isSelected, onSelect }: AgentDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'chat' | 'breed'>('info')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const fullData = agent.fullData || {}
  const personality = fullData.personality || {}
  const specialization = fullData.specialization || {}
  const capabilities = fullData.capabilities || {}
  const skills = fullData.skills || {}

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      // Send to backend
      const response = await axios.post('http://localhost:8000/api/agent/query', {
        tokenId: agent.id,
        agentName: agent.name,
        query: inputValue,
        personaPrompt: agent.instructions || personality.tone || '',
        skills: agent.skills || []
      })

      // Add agent response
      const agentMessage: ChatMessage = {
        id: `msg_${Date.now()}_response`,
        sender: 'agent',
        text: response.data.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        sender: 'agent',
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="agent-detail-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="agent-header-info">
            <div className="agent-avatar-large">
              {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                <img src={agent.imageUrl} alt={agent.name} className="agent-header-image" />
              ) : (
                agent.imageUrl || '🤖'
              )}
            </div>
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
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-welcome">
                    <p className="chat-icon">💬</p>
                    <h4>Chat with {agent.name}</h4>
                    <p className="chat-description">{agent.instructions || 'Ask me anything about my specialization!'}</p>
                    <div className="chat-hints">
                      <p><strong>Tips:</strong></p>
                      <ul>
                        <li>Ask questions based on my skills: {(agent.skills || []).slice(0, 2).join(', ')}</li>
                        <li>I'll respond based on my expertise and personality</li>
                        <li>Press Enter to send, or Shift+Enter for new line</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map(msg => (
                      <div key={msg.id} className={`message ${msg.sender}`}>
                        <div className="message-avatar">
                          {msg.sender === 'user' ? '👤' : agent.imageUrl?.startsWith('http') ? (
                            <img src={agent.imageUrl} alt={agent.name} />
                          ) : (
                            agent.imageUrl || '🤖'
                          )}
                        </div>
                        <div className="message-content">
                          <div className="message-sender">
                            {msg.sender === 'user' ? 'You' : agent.name}
                          </div>
                          <div className="message-text">{msg.text}</div>
                          <div className="message-time">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="message agent typing">
                        <div className="message-avatar">🤖</div>
                        <div className="message-content">
                          <div className="typing-indicator">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <textarea
                  className="chat-input"
                  placeholder={`Ask ${agent.name}...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  rows={2}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={loading || !inputValue.trim()}
                >
                  {loading ? '⏳ ...' : '📤 Send'}
                </button>
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
          height: 100px;
          width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agent-header-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid rgba(100, 200, 255, 0.3);
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
          flex-direction: column;
          justify-content: flex-start;
          min-height: 400px;
          padding: 0;
        }

        .chat-tab {
          padding: 1.5rem;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 1rem;
          min-height: 250px;
          max-height: 350px;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }

        .chat-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
        }

        .chat-welcome .chat-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .chat-welcome h4 {
          margin: 0 0 0.5rem 0;
          color: #fff;
          font-size: 1.2rem;
        }

        .chat-description {
          color: #aaa;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .chat-hints {
          background: rgba(100, 200, 255, 0.1);
          border: 1px solid rgba(100, 200, 255, 0.3);
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
        }

        .chat-hints p {
          color: #fff;
          margin: 0 0 0.5rem 0;
          font-weight: 600;
        }

        .chat-hints ul {
          margin: 0.5rem 0 0 0;
          padding-left: 1.5rem;
          color: #ddd;
          font-size: 0.9rem;
        }

        .chat-hints li {
          margin: 0.3rem 0;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          display: flex;
          gap: 0.8rem;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          background: rgba(100, 200, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          overflow: hidden;
        }

        .message-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .message-content {
          flex: 1;
          max-width: 70%;
        }

        .message.user .message-content {
          align-items: flex-end;
          display: flex;
          flex-direction: column;
        }

        .message-sender {
          font-size: 0.75rem;
          color: #aaa;
          margin-bottom: 0.2rem;
          font-weight: 600;
        }

        .message-text {
          background: rgba(100, 200, 255, 0.1);
          border: 1px solid rgba(100, 200, 255, 0.2);
          padding: 0.8rem;
          border-radius: 8px;
          color: #ddd;
          word-wrap: break-word;
          line-height: 1.5;
        }

        .message.user .message-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: #fff;
        }

        .message-time {
          font-size: 0.7rem;
          color: #888;
          margin-top: 0.3rem;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 0.5rem 0.8rem;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .chat-input-area {
          display: flex;
          gap: 0.8rem;
          padding-top: 1rem;
          border-top: 1px solid #444;
        }

        .chat-input {
          flex: 1;
          padding: 0.8rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #444;
          border-radius: 8px;
          color: #fff;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;
          max-height: 100px;
        }

        .chat-input::placeholder {
          color: #777;
        }

        .chat-input:focus {
          outline: none;
          border-color: #64c8ff;
          background: rgba(100, 200, 255, 0.05);
        }

        .chat-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-send-btn {
          padding: 0.8rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .chat-send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .breed-placeholder,
        .breed-info {
          text-align: center;
        }

        .breed-icon {
          font-size: 3rem;
          margin: 0 0 1rem 0;
        }

        .breed-info h4 {
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .breed-info p {
          color: #aaa;
          margin: 0 0 1rem 0;
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
