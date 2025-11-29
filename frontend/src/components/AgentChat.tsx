import { useState, useEffect, useRef } from 'react'
import { Agent } from '../types'

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  agentName?: string
}

interface AgentChatProps {
  agent: Agent | null
  isOpen: boolean
  onClose: () => void
}

const AgentChat = ({ agent, isOpen, onClose }: AgentChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear messages when agent changes
  useEffect(() => {
    if (agent) {
      setMessages([
        {
          id: '1',
          role: 'agent',
          content: `Hello! I'm ${agent.name}. My skills are: ${agent.skills.join(', ')}. How can I help you today?`,
          timestamp: new Date(),
          agentName: agent.name
        }
      ])
      setError(null)
    }
  }, [agent])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !agent || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentName: agent.name,
          query: inputValue,
          personaPrompt: agent.personaPrompt,
          skills: agent.skills,
          tokenId: agent.tokenId
        })
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: data.response,
        timestamp: new Date(),
        agentName: agent.name
      }
      
      setMessages(prev => [...prev, agentMessage])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response'
      setError(errorMsg)
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: new Date(),
        agentName: agent.name
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen || !agent) return null

  return (
    <div className="agent-chat-overlay" onClick={onClose}>
      <div className="agent-chat-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-agent-info">
            <div className="chat-agent-icon">
              {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                <img src={agent.imageUrl} alt={agent.name} className="chat-agent-img" />
              ) : (
                agent.imageUrl || '🤖'
              )}
            </div>
            <div className="chat-agent-details">
              <h3>{agent.name}</h3>
              <p className="agent-skills">{agent.skills.slice(0, 2).join(' • ')}</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose} title="Close chat">✕</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.role}`}
            >
              {msg.role === 'agent' && (
                <div className="message-avatar">
                  {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                    <img src={agent.imageUrl} alt={agent.name} className="msg-avatar-img" />
                  ) : (
                    agent.imageUrl || '🤖'
                  )}
                </div>
              )}
              <div className={`message-content ${msg.role}`}>
                <p>{msg.content}</p>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message agent">
              <div className="message-avatar">
                {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                  <img src={agent.imageUrl} alt={agent.name} className="msg-avatar-img" />
                ) : (
                  agent.imageUrl || '🤖'
                )}
              </div>
              <div className="message-content agent loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <div className="chat-error">
            ⚠️ {error}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            disabled={isLoading}
            className="chat-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="chat-send-btn"
            title="Send message (Enter)"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>

      <style>{`
        .agent-chat-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .agent-chat-container {
          width: 100%;
          max-width: 500px;
          height: 90vh;
          max-height: 800px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.2);
          margin-right: 20px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .chat-header {
          padding: 20px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px 16px 0 0;
        }

        .chat-agent-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .chat-agent-icon {
          font-size: 32px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .chat-agent-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .msg-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .chat-agent-details {
          flex: 1;
        }

        .chat-agent-details h3 {
          margin: 0;
          font-size: 16px;
          color: #f1f5f9;
          font-weight: 600;
        }

        .agent-skills {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #94a3b8;
        }

        .chat-close-btn {
          background: rgba(148, 163, 184, 0.1);
          border: none;
          color: #cbd5e1;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-close-btn:hover {
          background: rgba(148, 163, 184, 0.2);
          color: #f1f5f9;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.05);
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.3);
        }

        .chat-message {
          display: flex;
          gap: 8px;
          animation: messageSlide 0.3s ease-out;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-message.user {
          justify-content: flex-end;
        }

        .message-avatar {
          font-size: 28px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
        }

        .message-content.agent {
          background: rgba(148, 163, 184, 0.1);
          color: #e2e8f0;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .message-content.user {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: #f1f5f9;
          text-align: right;
        }

        .message-time {
          display: block;
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .message-content.loading {
          padding: 10px 14px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #94a3b8;
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
            opacity: 0.5;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }

        .chat-error {
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          font-size: 12px;
          border-radius: 8px;
          margin: 0 16px;
        }

        .chat-input-area {
          padding: 16px;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0 0 16px 16px;
        }

        .chat-input {
          flex: 1;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #f1f5f9;
          padding: 10px 12px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: none;
          max-height: 100px;
          transition: all 0.2s;
        }

        .chat-input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.5);
          background: rgba(15, 23, 42, 0.95);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .chat-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chat-input::placeholder {
          color: #64748b;
        }

        .chat-send-btn {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          border-radius: 8px;
          color: #f1f5f9;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .chat-send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .chat-send-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .agent-chat-container {
            max-width: 100%;
            margin-right: 0;
            border-radius: 16px 16px 0 0;
            height: 80vh;
          }

          .message-content {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  )
}

export default AgentChat
