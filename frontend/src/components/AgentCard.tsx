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
      <div className="card-content">
        <div className="agent-icon">
          {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
            <img src={agent.imageUrl} alt={agent.name} className="agent-image" />
          ) : (
            agent.imageUrl || '🤖'
          )}
        </div>
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
      </div>

      <style>{`
        /* ========== HOLOGRAPHIC AGENT CARD ========== */
        .agent-card {
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.08) 0%, 
            rgba(255, 255, 255, 0.05) 50%, 
            rgba(0, 240, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          position: relative;
          overflow: hidden;
          min-height: 340px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        /* Holographic Shine Effect */
        .agent-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          );
          animation: holographic-shine 4s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes holographic-shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }

        /* Hover Effects */
        .agent-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(0, 240, 255, 0.5);
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.15) 0%, 
            rgba(255, 255, 255, 0.08) 50%, 
            rgba(0, 240, 255, 0.1) 100%);
          box-shadow: 
            0 0 30px rgba(0, 240, 255, 0.5),
            0 0 60px rgba(0, 240, 255, 0.3),
            0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .agent-card.selected {
          border: 2px solid var(--color-primary, #00F0FF);
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.2) 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(0, 240, 255, 0.15) 100%);
          box-shadow: 
            0 0 40px rgba(0, 240, 255, 0.8),
            0 0 80px rgba(0, 240, 255, 0.5),
            0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .agent-card.selected::after {
          content: '✓ SELECTED';
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 240, 255, 0.9);
          color: var(--color-bg-base, #0A0B10);
          font-size: 0.625rem;
          font-weight: 700;
          font-family: var(--font-mono, 'Space Mono', monospace);
          letter-spacing: 0.1em;
          border-radius: 100px;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.8);
        }

        .card-content {
          position: relative;
          z-index: 2;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .agent-card:hover .card-content {
          transform: translateY(-10px);
        }

        /* Agent Icon/Avatar */
        .agent-icon {
          font-size: 4.5rem;
          margin-bottom: 1.5rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.6));
        }

        .agent-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid rgba(0, 240, 255, 0.4);
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
        }

        .agent-card:hover .agent-icon {
          transform: scale(1.15) rotate(5deg);
          filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.9));
        }

        /* Agent Name */
        .agent-card h3 {
          font-size: 1.5rem;
          margin: 1rem 0;
          color: var(--color-text-primary, #FFFFFF);
          font-weight: 700;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-shadow: 0 0 15px rgba(0, 240, 255, 0.5);
        }

        /* Metadata Section */
        .agent-meta {
          display: flex;
          gap: 0.625rem;
          justify-content: center;
          margin-bottom: 1.25rem;
          font-size: 0.75rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
        }

        .generation {
          background: rgba(0, 240, 255, 0.15);
          color: var(--color-primary, #00F0FF);
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          border: 1px solid rgba(0, 240, 255, 0.4);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
        }

        .token-id {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: var(--font-mono, 'Space Mono', monospace);
          color: var(--color-text-secondary, #8F90A6);
          letter-spacing: 0.02em;
        }

        /* Skills Section */
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .skill-badge {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.15), 
            rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: var(--color-text-primary, #FFFFFF);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          font-size: 0.6875rem;
          font-weight: 600;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .skill-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
        }

        /* Card Overlay (Hidden by default, shows on hover) */
        .card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, 
            transparent 0%, 
            rgba(10, 11, 16, 0.95) 60%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .agent-card:hover .card-overlay {
          transform: translateY(0);
        }

        .action-btn {
          flex: 1;
          padding: 0.875rem 1rem;
          border: none;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.75rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .select-btn {
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.3), 
            rgba(0, 240, 255, 0.1));
          border: 1px solid rgba(0, 240, 255, 0.5);
          color: var(--color-primary, #00F0FF);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }

        .select-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.5), 
            rgba(0, 240, 255, 0.2));
        }

        .select-btn.selected {
          background: linear-gradient(135deg, 
            rgba(32, 227, 178, 0.4), 
            rgba(32, 227, 178, 0.15));
          border-color: rgba(32, 227, 178, 0.6);
          color: #20E3B2;
          box-shadow: 0 0 30px rgba(32, 227, 178, 0.6);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .agent-card {
            padding: 1.5rem;
            min-height: 300px;
          }

          .agent-icon {
            font-size: 3.5rem;
            height: 100px;
          }

          .agent-card h3 {
            font-size: 1.25rem;
          }

          .skill-badge {
            font-size: 0.625rem;
            padding: 0.35rem 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default AgentCard
