import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWallet } from '@meshsdk/react'
import { Agent } from '../types'
import AgentEditor from './AgentEditor'
import { 
  fetchAgent, 
  checkBackendHealth,
  sendChatMessage,
  getChatSessions,
  getChatHistory,
  createChatSession,
  type ChatMessage,
  type ConversationSession
} from '../utils/api'

interface AgentDetailProps {
  agent?: Agent
}

const AgentDetail = ({ agent: initialAgent }: AgentDetailProps) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { wallet, connected } = useWallet()
  
  const [agent, setAgent] = useState<Agent | null>(initialAgent || null)
  const [loading, setLoading] = useState(!initialAgent)
  const [error, setError] = useState<string | null>(null)
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking")
  
  // Pagination
  const [messageOffset, setMessageOffset] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Agent editing
  const [editingModel, setEditingModel] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [isSavingModel, setIsSavingModel] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Generation color function
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

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkBackendHealth()
      setBackendStatus(isHealthy ? "online" : "offline")
    }
    checkHealth()
  }, [])

  // Fetch agent data if not provided as prop
  useEffect(() => {
    if (!initialAgent && id) {
      const loadAgent = async () => {
        try {
          setLoading(true)
          const agentData = await fetchAgent(id)
          
          // Map API response to Agent interface
          const mappedAgent: Agent = {
            id: agentData.asset_id,
            tokenId: agentData.asset_id,
            name: agentData.name || 'Unnamed Agent',
            purpose: agentData.purpose,
            instructions: agentData.instructions,
            personality: agentData.personality,
            skills: agentData.skills || [],
            llmModel: agentData.llm_model,
            generation: agentData.generation || 0,
            xp: agentData.xp || 0,
            owner: '', // Will be set from wallet if needed
            ipfsCid: agentData.brain_cid?.replace('ipfs://', ''),
            geneticHash: agentData.genetic_hash,
            masumiDid: agentData.masumi_did,
            minted: true,
            txHash: agentData.mint_tx_hash
          }
          
          setAgent(mappedAgent)
          setSelectedModel(mappedAgent.llmModel || '')
        } catch (err: any) {
          console.error('Failed to fetch agent:', err)
          setError('Agent not found')
        } finally {
          setLoading(false)
        }
      }
      loadAgent()
    } else if (initialAgent) {
      setSelectedModel(initialAgent.llmModel || '')
    }
  }, [id, initialAgent])

  // Load sessions and auto-create session when agent is loaded
  useEffect(() => {
    if (!agent || !agent.id || backendStatus !== "online") return

    const loadSessionsAndCreate = async () => {
      try {
        // Get user address from wallet
        const userAddress = connected && wallet 
          ? await wallet.getChangeAddress().catch(() => undefined) 
          : undefined

        // Load existing sessions
        const sessionList = await getChatSessions(agent.id, userAddress)
        setSessions(sessionList)

        // Auto-create session if none exists, or use most recent
        if (sessionList.length === 0) {
          console.log('📝 [Chat] No existing sessions, creating new session...')
          const newSession = await createChatSession(agent.id, userAddress)
          setSessionId(newSession.session_id)
        } else {
          // Use most recent session
          const mostRecent = sessionList.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0]
          setSessionId(mostRecent.session_id)
          console.log('📝 [Chat] Using existing session:', mostRecent.session_id)
        }
      } catch (err: any) {
        console.error('❌ [Chat] Failed to load sessions:', err)
      }
    }

    loadSessionsAndCreate()
  }, [agent, backendStatus, connected, wallet])

  // Load chat history when session is selected
  useEffect(() => {
    if (!sessionId || backendStatus !== "online") return

    const loadHistory = async () => {
      try {
        setMessageOffset(0)
        const history = await getChatHistory(sessionId, 10, 0)
        setMessages(history.messages)
        setHasMoreMessages(history.has_more)
        console.log(`✅ [Chat] Loaded ${history.messages.length} messages (${history.total} total)`)
      } catch (err: any) {
        console.error('❌ [Chat] Failed to load history:', err)
      }
    }

    loadHistory()
  }, [sessionId, backendStatus])

  // Handle scroll to load more messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !hasMoreMessages || isLoadingMore) return

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMoreMessages) {
        loadMoreMessages()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMore])

  const loadMoreMessages = async () => {
    if (!sessionId || isLoadingMore || !hasMoreMessages) return

    try {
      setIsLoadingMore(true)
      const nextOffset = messageOffset + 10
      const history = await getChatHistory(sessionId, 10, nextOffset)
      
      // Prepend older messages (they come in chronological order)
      setMessages(prev => [...history.messages, ...prev])
      setMessageOffset(nextOffset)
      setHasMoreMessages(history.has_more)
      console.log(`✅ [Chat] Loaded more messages. Total: ${history.messages.length + messages.length}`)
    } catch (err: any) {
      console.error('❌ [Chat] Failed to load more messages:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleSelectSession = async (selectedSessionId: string) => {
    setSessionId(selectedSessionId)
    setMessageOffset(0)
  }

  const handleNewSession = async () => {
    if (!agent || !agent.id) return

    try {
      const userAddress = connected && wallet 
        ? await wallet.getChangeAddress().catch(() => undefined) 
        : undefined

      const newSession = await createChatSession(agent.id, userAddress)
      setSessionId(newSession.session_id)
      setMessages([])
      setMessageOffset(0)
      setHasMoreMessages(false)
      
      // Reload sessions list
      const sessionList = await getChatSessions(agent.id, userAddress)
      setSessions(sessionList)
    } catch (err: any) {
      console.error('❌ [Chat] Failed to create new session:', err)
      setError('Failed to create new session')
    }
  }

  const handleSaveModel = async () => {
    if (!agent) return
    
    if (selectedModel === agent.llmModel) {
      setEditingModel(false)
      return
    }

    setIsSavingModel(true)
    try {
      // Note: LLM model update endpoint not yet implemented in new backend
      // This is a placeholder for future implementation
      console.log('⚠️  [Model] LLM model update not yet implemented in new backend')
      alert('LLM model update feature is not yet available. This will be implemented in a future update.')
      setSelectedModel(agent.llmModel || '')
      setEditingModel(false)
    } catch (error: any) {
      console.error('❌ Failed to update model:', error)
      alert('Failed to update LLM model. Please try again.')
      setSelectedModel(agent.llmModel || '')
    } finally {
      setIsSavingModel(false)
    }
  }

  const handleSendMessage = async () => {
    if (!agent || !agent.id || !inputValue.trim() || isLoading || backendStatus !== "online") return

    const userMessageText = inputValue.trim()
    setInputValue('')
    setIsLoading(true)
    setError(null)

    // Add user message to UI immediately (optimistic update)
    const tempUserMessage: ChatMessage = {
      message_id: `temp-${Date.now()}`,
      session_id: sessionId || '',
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const userAddress = connected && wallet 
        ? await wallet.getChangeAddress().catch(() => undefined) 
        : undefined

      // Send message using new chat API
      const response = await sendChatMessage(
        agent.id,
        userMessageText,
        sessionId || undefined,
        undefined,
        userAddress
      )

      // Update session ID if it was created
      const finalSessionId = response.session_id
      if (!sessionId && finalSessionId) {
        setSessionId(finalSessionId)
      }

      // Reload conversation history to get both user and agent messages from backend
      // This ensures both messages are displayed correctly
      try {
        const history = await getChatHistory(finalSessionId || sessionId || '', 10, 0)
        setMessages(history.messages)
        setHasMoreMessages(history.has_more)
        setMessageOffset(0)
        console.log(`✅ [Chat] Reloaded conversation history: ${history.messages.length} messages`)
      } catch (historyErr: any) {
        console.error('❌ [Chat] Failed to reload history, using response data:', historyErr)
        // Fallback: Remove temp message and add agent response
        // But we still need the user message - get it from temp message before filtering
        setMessages(prev => {
          const tempUserMsg = prev.find(m => m.message_id.startsWith('temp-'))
          const filtered = prev.filter(m => !m.message_id.startsWith('temp-'))
          const newMessages = filtered
          
          // Add user message back if we had a temp one
          if (tempUserMsg) {
            newMessages.push({
              ...tempUserMsg,
              message_id: `user-${Date.now()}`, // Generate a proper ID
              session_id: finalSessionId || sessionId || ''
            })
          }
          
          // Add agent response
          newMessages.push({
            message_id: response.message_id,
            session_id: finalSessionId || sessionId || '',
            role: 'agent',
            content: response.response,
            timestamp: response.timestamp,
            agent_asset_id: response.agent_asset_id,
          })
          
          return newMessages
        })
      }

      // Reload sessions to update message count
      if (agent.id) {
        const sessionList = await getChatSessions(agent.id, userAddress)
        setSessions(sessionList)
      }
    } catch (error: any) {
      console.error('❌ [Chat] Error sending message:', error)
      setError(error.message || 'Failed to send message')
      
      // Remove temp message on error
      setMessages(prev => prev.filter(m => !m.message_id.startsWith('temp-')))
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="agent-detail-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading agent...</div>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="agent-detail-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <div>{error || 'Agent not found'}</div>
          <button className="back-button" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="agent-detail-page"
      style={{ '--gen-color-rgb': agent ? getGenerationColor(agent.generation).rgb : '139, 92, 246' } as React.CSSProperties}
    >
      {/* Header */}
      <div className="agent-detail-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <div className="header-content">
          <div className="header-title">
            <div className="agent-header-image">
              {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                <img src={agent.imageUrl} alt={agent.name} />
              ) : (
                <div className="agent-emoji">{agent.imageUrl || 'AI'}</div>
              )}
            </div>
            <h1>{agent.name}</h1>
            <div className="generation-badge" style={{ backgroundColor: getGenerationColor(agent.generation).hex }}>
              <svg className="gen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 6v12"/>
                <path d="M8 10h8"/>
                <path d="M8 14h8"/>
                <path d="M10 8h4"/>
                <path d="M10 16h4"/>
              </svg>
              <span className="gen-text">Gen {agent.generation}</span>
            </div>
          </div>
        </div>
        <button 
          className="edit-agent-btn"
          onClick={() => setIsEditorOpen(true)}
          title="Edit agent properties"
        >
          Edit
        </button>
      </div>

      {/* Agent Banner */}
      <div className="agent-banner">
        <div className="agent-banner-bg" />
        <div className="agent-banner-content">
          <div className="agent-header-info">
            <p className="agent-purpose">{agent.purpose || 'AI Agent'}</p>
          </div>
        </div>
      </div>

      {/* 3-Section Notebook Layout */}
      <div className="notebook-layout">
        {/* Section 1: Chat History / Sessions */}
        <div className="section chat-history-section">
          <div className="section-header">
            <h3>Conversations</h3>
            <button
              onClick={handleNewSession}
              className="new-session-btn"
              title="Start new conversation"
            >
              + New
            </button>
          </div>
          <div className="chat-history-list">
            {sessions.length === 0 ? (
              <p className="empty-history">No conversations yet</p>
            ) : (
              sessions
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map(session => (
                  <button
                    key={session.session_id}
                    onClick={() => handleSelectSession(session.session_id)}
                    className={`session-item ${sessionId === session.session_id ? 'active' : ''}`}
                  >
                    <div className="session-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                    <div className="session-meta">
                      {session.message_count} messages
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>

        {/* Section 2: Chat Interface */}
        <div className="section chat-interface-section">
          <div className="section-header">
            <h3>Chat with Agent</h3>
          </div>
          <div 
            className="messages-container" 
            ref={messagesContainerRef}
          >
            {isLoadingMore && (
              <div className="load-more-indicator">
                Loading older messages...
              </div>
            )}
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h4>Start a conversation</h4>
                <p>Ask {agent.name} anything about their skills and abilities!</p>
                {backendStatus === "offline" && (
                  <p className="backend-offline">⚠️ Backend API is offline</p>
                )}
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.message_id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? 'U' : (
                      agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                        <img src={agent.imageUrl} alt="agent" className="message-img" />
                      ) : (
                        'AI'
                      )
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">{msg.content}</div>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">...</div>
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
          {backendStatus === "online" && (
            <div className="chat-input-area">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Ask something..."
                disabled={isLoading || !sessionId}
                className="chat-input"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim() || !sessionId}
                className="send-button"
              >
                {isLoading ? '...' : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </div>
          )}
          {backendStatus === "offline" && (
            <div className="chat-input-area">
              <div className="backend-offline-message">
                ⚠️ Backend API is offline. Chat unavailable.
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Agent Description */}
        <div className="section description-section">
          <div className="section-header">
            <h3>Agent Description</h3>
          </div>
          <div className="description-content">
            {/* Instructions */}
            {/* Removed instructions display */}

            {/* Personality */}
            {agent.personality && (
              <div className="desc-card">
                <h4>Personality</h4>
                <p>{agent.personality}</p>
              </div>
            )}

            {/* Skills */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="desc-card">
                <h4>Skills</h4>
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
              <h4>Metadata</h4>
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
                          {isSavingModel ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="cancel-model-btn"
                          onClick={() => {
                            setEditingModel(false)
                            setSelectedModel(agent.llmModel || '')
                          }}
                          disabled={isSavingModel}
                        >
                          Cancel
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
                          Edit
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
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.1);
          border-bottom: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .agent-header-image {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .agent-header-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .agent-emoji {
          font-size: 1.5rem;
        }

        .agent-detail-header h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #e2e8f0;
        }

        .generation-badge {
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
          box-shadow: 0 2px 8px rgba(0, 240, 255, 0.3);
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

        .back-button {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.1);
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
          color: #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.5);
          color: #e2e8f0;
        }

        .edit-agent-btn {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.1);
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
          color: #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .edit-agent-btn:hover {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.5);
          color: #e2e8f0;
          box-shadow: 0 0 12px rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
        }

        .header-spacer {
          width: 80px;
        }

        .agent-banner {
          position: relative;
          background: linear-gradient(135deg, rgba(var(--gen-color-rgb, 139, 92, 246), 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          border-bottom: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          padding: 2rem 2rem;
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
          max-width: none;
          text-align: left;
        }

        .agent-header-info {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 1rem;
          width: 100%;
        }

        .agent-purpose {
          margin: 0;
          color: #94a3b8;
          font-size: 1rem;
          line-height: 1.5;
          max-width: none;
          width: 100%;
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
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          backdrop-filter: blur(10px);
        }

        .section-header {
          padding: 1.5rem;
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.1);
          border-bottom: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #e2e8f0;
        }

        .new-session-btn {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.4);
          color: #cbd5e1;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .new-session-btn:hover {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.6);
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
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
          border-radius: 3px;
        }

        .session-item {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: left;
        }

        .session-item:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
        }

        .session-item.active {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.15);
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.5);
        }

        .session-date {
          color: #e2e8f0;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .session-meta {
          color: #94a3b8;
          font-size: 0.75rem;
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

        .load-more-indicator {
          text-align: center;
          padding: 0.5rem;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .backend-offline {
          color: #fca5a5;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .backend-offline-message {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          border-radius: 6px;
          text-align: center;
          font-size: 0.85rem;
        }

        .messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
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
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
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
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
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
          border-top: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          flex-shrink: 0;
        }

        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          color: #e2e8f0;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .chat-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.4);
        }

        .chat-input::placeholder {
          color: #64748b;
        }

        .chat-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .send-button {
          background: linear-gradient(135deg, rgba(var(--gen-color-rgb, 139, 92, 246), 0.8) 0%, rgba(99, 102, 241, 0.8) 100%);
          border: none;
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(var(--gen-color-rgb, 139, 92, 246), 0.4);
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
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
          border-radius: 3px;
        }

        .desc-card {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.15);
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
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.4);
          color: #cbd5e1;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .edit-model-btn:hover {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.3);
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.6);
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
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.4);
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
          border-color: rgba(var(--gen-color-rgb, 139, 92, 246), 0.8);
          background: rgba(0, 0, 0, 0.4);
        }

        .save-model-btn,
        .cancel-model-btn {
          background: rgba(var(--gen-color-rgb, 139, 92, 246), 0.2);
          border: 1px solid rgba(var(--gen-color-rgb, 139, 92, 246), 0.4);
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

          .header-content {
            gap: 0.25rem;
          }

          .header-title {
            gap: 0.75rem;
          }

          .agent-header-image {
            width: 40px;
            height: 40px;
          }

          .agent-detail-header h1 {
            font-size: 1.2rem;
          }

          .header-meta {
            font-size: 0.7rem;
            gap: 1rem;
          }

          .agent-banner-content {
            padding: 0;
          }

          .agent-purpose {
            font-size: 0.9rem;
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
