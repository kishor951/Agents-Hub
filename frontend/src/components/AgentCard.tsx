import { Agent } from '../types'

interface AgentCardProps {
  agent: Agent
  selected?: boolean
  onClick?: () => void
}

const AgentCard = ({ agent, selected = false, onClick }: AgentCardProps) => {
  const truncateName = (name: string) => {
    const maxLength = 18;
    return name.length > maxLength ? name.slice(0, maxLength - 3) + '...' : name;
  };

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
  };

  return (
    <div 
      className={`agent-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ '--card-bg-color': getGenerationColor(agent.generation).rgb } as React.CSSProperties}
    >
      {/* Generation Badge - Top Right */}
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

      <div className="card-content">
        <div className="agent-icon">
          {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
            <img src={agent.imageUrl} alt={agent.name} className="agent-image" />
          ) : (
            agent.imageUrl || '🤖'
          )}
        </div>
        <h3>{truncateName(agent.name)}</h3>
        <div className="agent-meta">
        </div>
        <div className="skills" style={{ '--gen-color-rgb': getGenerationColor(agent.generation).rgb } as React.CSSProperties}>
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
          background: rgba(var(--card-bg-color, 0, 240, 255), 0.08);
          border: 1px solid rgba(var(--card-bg-color, 0, 240, 255), 0.15);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          position: relative;
          overflow: hidden;
          min-height: 340px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Removed holographic shine effect */

        /* Hover Effects */
        .agent-card:hover {
          transform: translateY(-6px);
          border-color: rgba(var(--card-bg-color, 0, 240, 255), 0.4);
          background: rgba(var(--card-bg-color, 0, 240, 255), 0.5);
        }

        .agent-card:hover h3 {
          color: rgba(255, 255, 255, 0.95);
        }

        .agent-card:hover .gen-text,
        .agent-card:hover .gen-icon {
          color: rgba(255, 255, 255, 0.95);
        }

        .agent-card:hover .generation-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .agent-card:hover .skill-badge {
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .agent-card.selected {
          border: 2px solid var(--color-primary, #00F0FF);
          background: rgba(var(--card-bg-color, 0, 240, 255), 0.15);
        }

        .agent-card.selected::after {
          content: '✓ SELECTED';
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 240, 255, 0.9);
          color: var(--color-bg-base, #0A0B10);
          font-size: 0.625rem;
          font-weight: 700;
          font-family: var(--font-mono, 'Space Mono', monospace);
          letter-spacing: 0.1em;
          border-radius: 100px;
          box-shadow: none;
        }

        /* Generation Badge - Top Right */
        .generation-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
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

        .card-content {
          position: relative;
          z-index: 2;
        }

        /* Agent Icon/Avatar */
        .agent-icon {
          font-size: 4.5rem;
          margin-bottom: 1.5rem;
          transition: transform 0.3s ease-in-out;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          /* removed drop-shadow to avoid inner glow */
          filter: none;
        }

        .agent-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid rgba(0, 240, 255, 0.15);
          /* removed image glow */
          box-shadow: none;
        }

        /* Agent Name */
        .agent-card h3 {
          font-size: 1.25rem;
          margin: 1rem 0;
          color: var(--color-text-primary, #FFFFFF);
          font-weight: 700;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: capitalize;
          letter-spacing: 0.05em;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
          /* remove text shadow for flatter, cleaner feel */
          text-shadow: none;
        }

        .agent-card h3:hover {
          text-decoration: underline;
          text-decoration-color: rgba(var(--card-bg-color, 0, 240, 255), 0.6);
          text-decoration-thickness: 2px;
          text-underline-offset: 4px;
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

        /* Skills Section */
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .skill-badge {
          background: rgba(var(--gen-color-rgb, 0, 240, 255), 0.15);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(var(--gen-color-rgb, 0, 240, 255), 0.25);
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          font-size: 0.6875rem;
          font-weight: 600;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: none;
          transition: background 0.2s ease;
        }

        .skill-badge:hover {
          background: rgba(var(--gen-color-rgb, 0, 240, 255), 0.25);
        }

        /* Card Overlay (Hidden by default, shows on hover) */
        .card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          /* make overlay fully transparent and remove blur to avoid bottom layer effect */
          background: transparent;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
          border-top: none;
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
          /* removed backdrop-filter to avoid blurred layer on hover */
        }

        .select-btn {
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.18), 
            rgba(0, 240, 255, 0.08));
          border: 1px solid rgba(0, 240, 255, 0.25);
          color: var(--color-primary, #00F0FF);
          box-shadow: none;
        }

        .select-btn:hover {
          background: linear-gradient(135deg, rgba(0,240,255,0.22), rgba(0,240,255,0.12));
        }

        .select-btn.selected {
          background: linear-gradient(135deg, 
            rgba(32, 227, 178, 0.4), 
            rgba(32, 227, 178, 0.15));
          border-color: rgba(32, 227, 178, 0.6);
          color: #20E3B2;
          box-shadow: none;
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
            font-size: 1.125rem;
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
