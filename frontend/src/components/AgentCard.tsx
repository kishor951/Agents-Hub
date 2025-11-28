import { Agent } from '../types'

interface AgentCardProps {
  agent: Agent
  selected?: boolean
  onClick?: () => void
  onSelect?: () => void
  onChat?: () => void
}

const AgentCard = ({ agent, selected = false, onClick, onSelect, onChat }: AgentCardProps) => {
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.()
  }

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChat?.()
  }

  return (
    <div 
      className={`agent-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="card-content">
        <div className="agent-icon">{agent.imageUrl || '🤖'}</div>
        <h3>{agent.name}</h3>
        <div className="agent-meta">
          <span className="generation">Gen {agent.generation}</span>
          {agent.tokenId && <span className="token-id">{agent.tokenId.slice(0, 12)}...</span>}
        </div>
        <div className="skills">
          {agent.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="skill-badge">{skill}</span>
          ))}
          {agent.skills.length > 3 && <span className="skill-badge">+{agent.skills.length - 3}</span>}
        </div>
      </div>

      {/* Overlay Actions */}
      <div className="card-overlay">
        <button className="action-btn info-btn" onClick={onClick} title="View details">
          ℹ️ Details
        </button>
        <button 
          className="action-btn chat-btn"
          onClick={handleChatClick}
          title="Chat with agent"
        >
          💬 Chat
        </button>
        <button 
          className={`action-btn select-btn ${selected ? 'selected' : ''}`}
          onClick={handleSelectClick}
          title="Select for breeding"
        >
          {selected ? '✓ Selected' : '🧬 Breed'}
        </button>
      </div>

      <style>{`
        .agent-card {
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
          border: 2px solid #444;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .agent-card:hover {
          transform: translateY(-6px);
          border-color: #64c8ff;
          box-shadow: 0 12px 30px rgba(100, 200, 255, 0.3);
        }

        .agent-card.selected {
          border-color: #4ade80;
          background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.05) 100%);
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
        }

        .card-content {
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }

        .agent-card:hover .card-content {
          transform: translateY(-20px);
        }

        .agent-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          transition: transform 0.3s ease;
        }

        .agent-card:hover .agent-icon {
          transform: scale(1.1);
        }

        .agent-card h3 {
          font-size: 1.3rem;
          margin: 0.5rem 0;
          color: #fff;
          font-weight: 600;
        }

        .agent-meta {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 0.8rem;
          color: #aaa;
        }

        .generation {
          background: rgba(100, 200, 255, 0.2);
          color: #64c8ff;
          padding: 0.3rem 0.7rem;
          border-radius: 4px;
          border: 1px solid rgba(100, 200, 255, 0.3);
        }

        .token-id {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.3rem 0.7rem;
          border-radius: 4px;
          font-family: monospace;
          color: #ddd;
        }

        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          justify-content: center;
        }

        .skill-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.3rem 0.7rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.95) 80%);
          padding: 1rem;
          display: flex;
          gap: 0.8rem;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          z-index: 2;
        }

        .agent-card:hover .card-overlay {
          transform: translateY(0);
        }

        .action-btn {
          flex: 1;
          padding: 0.7rem 0.8rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .info-btn {
          background: rgba(100, 200, 255, 0.2);
          color: #64c8ff;
          border: 1px solid #64c8ff;
        }

        .info-btn:hover {
          background: #64c8ff;
          color: #000;
        }

        .chat-btn {
          background: rgba(139, 92, 246, 0.2);
          color: #b78cf4;
          border: 1px solid #b78cf4;
        }

        .chat-btn:hover {
          background: #b78cf4;
          color: #000;
        }

        .select-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .select-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .select-btn.selected {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        }

        @media (max-width: 600px) {
          .agent-card {
            min-height: 250px;
          }

          .agent-icon {
            font-size: 2.5rem;
          }

          .card-overlay {
            transform: translateY(0);
            position: relative;
            background: transparent;
            padding: 1rem 0 0 0;
          }

          .action-btn {
            padding: 0.6rem 0.5rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}

export default AgentCard
