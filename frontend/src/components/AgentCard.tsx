import { Agent } from '../types'

interface AgentCardProps {
  agent: Agent
  selected?: boolean
  onClick?: () => void
}

const AgentCard = ({ agent, selected = false, onClick }: AgentCardProps) => {
  return (
    <div 
      className={`agent-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="agent-icon">{agent.imageUrl || '🤖'}</div>
      <h3>{agent.name}</h3>
      <div className="agent-meta">
        <span className="generation">Gen {agent.generation}</span>
        {agent.tokenId && <span className="token-id">{agent.tokenId}</span>}
      </div>
      <div className="skills">
        {agent.skills.slice(0, 3).map((skill, idx) => (
          <span key={idx} className="skill-badge">{skill}</span>
        ))}
        {agent.skills.length > 3 && <span className="skill-badge">+{agent.skills.length - 3}</span>}
      </div>

      <style>{`
        .agent-card {
          background: #1a1a1a;
          border: 2px solid #333;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .agent-card:hover {
          transform: translateY(-4px);
          border-color: #646cff;
          box-shadow: 0 4px 12px rgba(100, 108, 255, 0.3);
        }

        .agent-card.selected {
          border-color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
        }

        .agent-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .agent-card h3 {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }

        .agent-meta {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 0.85rem;
          color: #888;
        }

        .generation {
          background: #333;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }

        .token-id {
          background: #2a2a2a;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-family: monospace;
        }

        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .skill-badge {
          background: #646cff;
          color: white;
          padding: 0.3rem 0.7rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

export default AgentCard
