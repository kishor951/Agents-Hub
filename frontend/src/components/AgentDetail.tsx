import { useState, useRef, useEffect } from 'react'
import { Agent } from '../types'
import AgentEditor from './AgentEditor'
import axios from 'axios'

interface AgentDetailProps {
  agent: Agent
  onBack: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AgentDetail = ({ agent: initialAgent, onBack }: AgentDetailProps) => {
  const [agent, setAgent] = useState(initialAgent)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingModel, setEditingModel] = useState(false)
  const [selectedModel, setSelectedModel] = useState(agent.llmModel || '')
  const [isSavingModel, setIsSavingModel] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  // Available LLM models
  const availableModels = [
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'anthropic/claude-2', name: 'Claude 2', provider: 'Anthropic' },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', provider: 'Meta' },
    { id: 'x-ai/grok-4.1-fast:free', name: 'Grok 4.1 Fast (Free)', provider: 'xAI' },
    { id: 'microsoft/wizardlm-2-8x22b:free', name: 'WizardLM-2 (Free)', provider: 'Microsoft' },
  ]

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveModel = async () => {
    console.log('🔧 [DEBUG] handleSaveModel called')
    console.log('🔧 [DEBUG] selectedModel:', selectedModel)
    console.log('🔧 [DEBUG] agent.llmModel:', agent.llmModel)
    console.log('🔧 [DEBUG] agent.id:', agent.id)
    
    if (selectedModel === agent.llmModel) {
      console.log('🔧 [DEBUG] Model unchanged, closing edit mode')
      setEditingModel(false)
      return
    }

    setIsSavingModel(true)
    try {
      const updateUrl = `http://localhost:5000/api/agents/${agent.id}`
      console.log('🔧 [DEBUG] Sending PUT request to:', updateUrl)
      console.log('🔧 [DEBUG] Payload:', { llmModel: selectedModel })
      
      const response = await axios.put(updateUrl, {
        llmModel: selectedModel
      })
      
      console.log('🔧 [DEBUG] Response received:', response.data)
      setAgent(prev => ({ ...prev, llmModel: selectedModel }))
      setEditingModel(false)
      console.log('✅ Agent LLM model updated successfully to:', selectedModel)
    } catch (error: any) {
      console.error('❌ Failed to update model:', error)
      console.log('🔧 [DEBUG] Error response:', error.response?.data)
      console.log('🔧 [DEBUG] Error status:', error.response?.status)
      alert('Failed to update LLM model. Please try again.')
      setSelectedModel(agent.llmModel || '')
    } finally {
      setIsSavingModel(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    console.log('💬 [DEBUG] Sending message...')
    console.log('💬 [DEBUG] Agent:', { id: agent.id, name: agent.name, llmModel: agent.llmModel })
    console.log('💬 [DEBUG] Query:', inputValue)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    // Add user message to chat
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const queryUrl = `http://localhost:5000/api/agent/query`
      const queryPayload = {
        tokenId: agent.id,
        agentName: agent.name,
        query: inputValue,
        personaPrompt: agent.personality || agent.purpose || '',
        skills: agent.skills || [],
        llmModel: agent.llmModel
      }
      
      console.log('💬 [DEBUG] POST to:', queryUrl)
      console.log('💬 [DEBUG] Payload:', queryPayload)
      
      // Call backend API to get agent response
      const response = await axios.post(queryUrl, queryPayload)
      
      console.log('💬 [DEBUG] Response received:', response.data)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || 'No response received',
        timestamp: new Date(),
      }

      console.log('💬 [DEBUG] Added assistant message:', assistantMessage)
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('❌ Chat error:', error)
      console.log('💬 [DEBUG] Error response:', error.response?.data)
      console.log('💬 [DEBUG] Error status:', error.response?.status)
      console.log('💬 [DEBUG] Error message:', error.message)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="agent-detail-page">
      {/* Header */}
      <div className="agent-detail-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>{agent.name}</h1>
        <button 
          className="edit-agent-btn"
          onClick={() => setIsEditorOpen(true)}
          title="Edit agent properties"
        >
          ✏️ Edit
        </button>
      </div>

      {/* Agent Banner */}
      <div className="agent-banner">
        <div className="agent-banner-bg" />
        <div className="agent-banner-content">
          <div className="agent-large-image">
            {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
              <img src={agent.imageUrl} alt={agent.name} />
            ) : (
              <div className="agent-emoji">{agent.imageUrl || '🤖'}</div>
            )}
          </div>
          <div className="agent-header-info">
            <h2>{agent.name}</h2>
            <p className="agent-purpose">{agent.purpose || 'AI Agent'}</p>
            <div className="agent-meta">
              <span className="meta-item">
                <span className="label">Generation:</span>
                <span className="value">{agent.generation}</span>
              </span>
              <span className="meta-item">
                <span className="label">LLM Model:</span>
                <span className="value">{agent.llmModel || 'Unknown'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Section Notebook Layout */}
      <div className="notebook-layout">
        {/* Section 1: Chat History */}
        <div className="section chat-history-section">
          <div className="section-header">
            <h3>💬 Chat History</h3>
          </div>
          <div className="chat-history-list">
            {messages.length === 0 ? (
              <p className="empty-history">No messages yet. Start chatting!</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <span className="history-role">{msg.role === 'user' ? '👤' : '🤖'}</span>
                  <span className="history-text">{msg.content.substring(0, 50)}...</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Chat Interface */}
        <div className="section chat-interface-section">
          <div className="section-header">
            <h3>💭 Chat with Agent</h3>
          </div>
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <div className="welcome-emoji">🤖</div>
                <h4>Start a conversation</h4>
                <p>Ask {agent.name} anything about their skills and abilities!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : (
                      agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                        <img src={agent.imageUrl} alt="agent" className="message-img" />
                      ) : (
                        '🤖'
                      )
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">{msg.content}</div>
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">⏳</div>
                <div className="message-content">
                  <div className="message-bubble loading">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input-area">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder="Ask something..."
              disabled={isLoading}
              className="chat-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="send-button"
            >
              {isLoading ? '⏳' : '→'}
            </button>
          </div>
        </div>

        {/* Section 3: Agent Description */}
        <div className="section description-section">
          <div className="section-header">
            <h3>📋 Agent Description</h3>
          </div>
          <div className="description-content">
            {/* Instructions */}
            {agent.instructions && (
              <div className="desc-card">
                <h4>📋 Instructions</h4>
                <p>{agent.instructions}</p>
              </div>
            )}

            {/* Personality */}
            {agent.personality && (
              <div className="desc-card">
                <h4>🎭 Personality</h4>
                <p>{agent.personality}</p>
              </div>
            )}

            {/* Skills */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="desc-card">
                <h4>⚡ Skills</h4>
                <div className="skills-list">
                  {agent.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="desc-card">
              <h4>🔗 Metadata</h4>
              <div className="metadata-info">
                {agent.llmModel && (
                  <div className="meta-row">
                    <span className="meta-label">LLM Model:</span>
                    {editingModel ? (
                      <div className="model-edit-container">
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="model-select"
                        >
                          {availableModels.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.provider})
                            </option>
                          ))}
                        </select>
                        <button
                          className="save-model-btn"
                          onClick={handleSaveModel}
                          disabled={isSavingModel}
                        >
                          {isSavingModel ? '💾...' : '✓ Save'}
                        </button>
                        <button
                          className="cancel-model-btn"
                          onClick={() => {
                            setEditingModel(false)
                            setSelectedModel(agent.llmModel || '')
                          }}
                          disabled={isSavingModel}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="model-display-container">
                        <span className="meta-value">{agent.llmModel}</span>
                        <button
                          className="edit-model-btn"
                          onClick={() => {
                            setEditingModel(true)
                            setSelectedModel(agent.llmModel || '')
                          }}
                        >
                          ✎ Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {agent.generation && (
                  <div className="meta-row">
                    <span className="meta-label">Generation:</span>
                    <span className="meta-value">{agent.generation}</span>
                  </div>
                )}
                {agent.owner && (
                  <div className="meta-row">
                    <span className="meta-label">Owner:</span>
                    <code className="meta-value">{agent.owner.substring(0, 16)}...</code>
                  </div>
                )}
                {agent.ipfsCid && (
                  <div className="meta-row">
                    <span className="meta-label">IPFS CID:</span>
                    <code className="meta-value">{agent.ipfsCid.substring(0, 16)}...</code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .agent-detail-page {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f1728 0%, #1a1f3a 100%);
          color: #e2e8f0;
        }

        .agent-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .back-button {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.5);
          color: #e2e8f0;
        }

        .edit-agent-btn {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .edit-agent-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.5);
          color: #e2e8f0;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
        }

        .agent-detail-header h1 {
          margin: 0;
          font-size: 1.5rem;
          flex: 1;
          text-align: center;
        }

        .header-spacer {
          width: 80px;
        }

        .agent-banner {
          position: relative;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          padding: 3rem 2rem;
        }

        .agent-banner-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(139,92,246,0.05)" stroke-width="1"/></pattern></defs><rect width="1200" height="400" fill="url(%23grid)"/></svg>');
          pointer-events: none;
        }

        .agent-banner-content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3rem;
          align-items: center;
          max-width: 800px;
        }

        .agent-large-image {
          width: 150px;
          height: 150px;
          border-radius: 12px;
          border: 3px solid rgba(139, 92, 246, 0.3);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .agent-large-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .agent-emoji {
          font-size: 3rem;
        }

        .agent-header-info h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .agent-purpose {
          margin: 0 0 1rem 0;
          color: #94a3b8;
          font-size: 1.05rem;
        }

        .agent-meta {
          display: flex;
          gap: 2rem;
        }

        .meta-item {
          display: flex;
          gap: 0.5rem;
        }

        .meta-item .label {
          color: #64a0ff;
          font-weight: 600;
        }

        .meta-item .value {
          color: #cbd5e1;
        }

        /* 3-Section Notebook Layout */
        .notebook-layout {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 2rem;
          padding: 1.5rem 2rem 2rem 2rem;
          width: 100%;
          height: calc(100vh - 300px);
        }

        .section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          backdrop-filter: blur(10px);
        }

        .section-header {
          padding: 1.5rem;
          background: rgba(139, 92, 246, 0.1);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          flex-shrink: 0;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #e2e8f0;
        }

        /* Chat History Section */
        .chat-history-section {
          grid-column: 1;
        }

        .chat-history-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
        }

        .chat-history-list::-webkit-scrollbar {
          width: 6px;
        }

        .chat-history-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        .chat-history-list::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        .history-item {
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .history-item:hover {
          background: rgba(139, 92, 246, 0.1);
        }

        .history-item.user {
          border-left-color: #64a0ff;
        }

        .history-item.assistant {
          border-left-color: #8b5cf6;
        }

        .history-role {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .history-text {
          color: #cbd5e1;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty-history {
          color: #64748b;
          text-align: center;
          padding: 1.5rem;
          font-size: 0.9rem;
        }

        /* Chat Interface Section */
        .chat-interface-section {
          grid-column: 2;
          display: flex;
          flex-direction: column;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        .welcome-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 1rem;
          text-align: center;
        }

        .welcome-emoji {
          font-size: 3rem;
          opacity: 0.6;
        }

        .welcome-message h4 {
          margin: 0;
          color: #cbd5e1;
        }

        .welcome-message p {
          margin: 0;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .message {
          display: flex;
          gap: 0.75rem;
          animation: slideIn 0.3s ease-out;
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
          justify-content: flex-end;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.9rem;
          overflow: hidden;
        }

        .message-avatar .message-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .message.user .message-avatar {
          background: rgba(100, 160, 255, 0.2);
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          max-width: 70%;
        }

        .message.user .message-content {
          align-items: flex-end;
        }

        .message-bubble {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #cbd5e1;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .message.user .message-bubble {
          background: rgba(100, 160, 255, 0.2);
          border-color: rgba(100, 160, 255, 0.3);
        }

        .message-bubble.loading {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 0.75rem 1rem;
        }

        .message-bubble.loading span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8b5cf6;
          animation: pulse 1.4s infinite;
        }

        .message-bubble.loading span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .message-bubble.loading span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }

        .message-time {
          font-size: 0.75rem;
          color: #64748b;
        }

        .chat-input-area {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(139, 92, 246, 0.2);
          flex-shrink: 0;
        }

        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #e2e8f0;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .chat-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .chat-input::placeholder {
          color: #64748b;
        }

        .chat-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .send-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Description Section */
        .description-section {
          grid-column: 3;
        }

        .description-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .description-content::-webkit-scrollbar {
          width: 6px;
        }

        .description-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        .description-content::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        .desc-card {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid rgba(139, 92, 246, 0.15);
        }

        .desc-card h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          color: #e2e8f0;
        }

        .desc-card p {
          margin: 0;
          color: #cbd5e1;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-tag {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .metadata-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .meta-row {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
        }

        .meta-label {
          color: #64a0ff;
          font-weight: 600;
        }

        .meta-value {
          color: #cbd5e1;
          word-break: break-all;
          font-family: 'Courier New', monospace;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
        }

        .model-display-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .edit-model-btn {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #cbd5e1;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .edit-model-btn:hover {
          background: rgba(139, 92, 246, 0.3);
          border-color: rgba(139, 92, 246, 0.6);
          color: #e2e8f0;
        }

        .model-edit-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .model-select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #cbd5e1;
          padding: 0.4rem 0.6rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          flex: 1;
          min-width: 150px;
        }

        .model-select:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.8);
          background: rgba(0, 0, 0, 0.4);
        }

        .save-model-btn,
        .cancel-model-btn {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #cbd5e1;
          padding: 0.4rem 0.6rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .save-model-btn:hover:not(:disabled) {
          background: rgba(34, 197, 94, 0.3);
          border-color: rgba(34, 197, 94, 0.6);
          color: #e2e8f0;
        }

        .cancel-model-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.6);
          color: #e2e8f0;
        }

        .save-model-btn:disabled,
        .cancel-model-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .notebook-layout {
            grid-template-columns: 1fr 1.5fr;
            gap: 1.5rem;
          }

          .chat-history-section {
            grid-column: 1;
            grid-row: 1 / 3;
          }

          .chat-interface-section {
            grid-column: 2;
            grid-row: 1;
          }

          .description-section {
            grid-column: 2;
            grid-row: 2;
          }
        }

        @media (max-width: 768px) {
          .notebook-layout {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 1rem;
          }

          .section {
            height: auto;
            min-height: 300px;
          }

          .chat-history-section {
            grid-column: 1;
            grid-row: auto;
            max-height: 250px;
          }

          .chat-interface-section {
            grid-column: 1;
            grid-row: auto;
          }

          .description-section {
            grid-column: 1;
            grid-row: auto;
          }

          .agent-detail-header {
            padding: 1rem;
          }

          .agent-detail-header h1 {
            font-size: 1.2rem;
          }

          .agent-banner-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 0;
          }

          .agent-large-image {
            width: 120px;
            height: 120px;
            margin: 0 auto;
          }

          .agent-header-info h2 {
            font-size: 1.5rem;
          }

          .agent-meta {
            flex-direction: column;
            gap: 0.5rem;
          }

          .message-content {
            max-width: 85%;
          }
        }
      `}</style>

      {/* Agent Editor Modal */}
      <AgentEditor
        agent={agent}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(updatedAgent) => {
          setAgent(updatedAgent)
          setSelectedModel(updatedAgent.llmModel || '')
          console.log('✅ Agent updated:', updatedAgent)
        }}
      />
    </div>
  )
}

export default AgentDetail
