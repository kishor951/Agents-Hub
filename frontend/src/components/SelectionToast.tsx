import { Agent } from '../types'

interface SelectionToastProps {
  selectedAgents: Agent[]
  onViewComparison: () => void
  onClear: () => void
  onRemoveAgent: (agentId: string) => void
}

const SelectionToast = ({ selectedAgents, onViewComparison, onClear, onRemoveAgent }: SelectionToastProps) => {
  if (selectedAgents.length === 0) return null

  return (
    <>
      <div className="selection-toast">
        <div className="toast-content">
          <div className="selection-counter">
            <span className="count">{selectedAgents.length}</span>
            <span className="label">Agent{selectedAgents.length !== 1 ? 's' : ''} Selected</span>
          </div>

          <div className="selected-agents-display">
            {selectedAgents.map((agent) => (
              <div key={agent.id} className="selected-agent-item">
                <span className="agent-emoji">
                  {agent.imageUrl && agent.imageUrl.startsWith('http') ? (
                    <img src={agent.imageUrl} alt={agent.name} className="agent-toast-img" />
                  ) : (
                    agent.imageUrl || 'AI'
                  )}
                </span>
                <span className="agent-name">{agent.name}</span>
                <button
                  className="remove-btn"
                  onClick={() => onRemoveAgent(agent.id)}
                  title="Remove from selection"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="toast-actions">
            {selectedAgents.length === 2 && (
              <button className="btn-compare" onClick={onViewComparison}>
                Compare & Breed
              </button>
            )}
            {selectedAgents.length < 2 && (
              <button className="btn-compare disabled" disabled>
                Select 2 Agents
              </button>
            )}
            <button className="btn-clear" onClick={onClear}>
              Clear
            </button>
          </div>
        </div>

        <style>{`
          .selection-toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
            z-index: 900;
            max-width: 600px;
            width: 90%;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              transform: translateX(-50%) translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }

          .toast-content {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .selection-counter {
            display: flex;
            align-items: center;
            gap: 0.8rem;
          }

          .count {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.1rem;
          }

          .label {
            color: #ddd;
            font-weight: 600;
            font-size: 1rem;
          }

          .selected-agents-display {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
          }

          .selected-agent-item {
            background: rgba(100, 200, 255, 0.1);
            border: 1px solid rgba(100, 200, 255, 0.3);
            padding: 0.5rem 0.8rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            color: #64c8ff;
            font-size: 0.9rem;
          }

          .agent-emoji {
            font-size: 1.2rem;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .agent-toast-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
          }

          .agent-name {
            font-weight: 500;
          }

          .remove-btn {
            background: none;
            border: none;
            color: #64c8ff;
            cursor: pointer;
            padding: 0;
            margin-left: 0.3rem;
            font-size: 0.8rem;
            opacity: 0.7;
            transition: opacity 0.2s;
          }

          .remove-btn:hover {
            opacity: 1;
          }

          .toast-actions {
            display: flex;
            gap: 0.8rem;
          }

          .btn-compare,
          .btn-clear {
            flex: 1;
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
          }

          .btn-compare {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .btn-compare:hover:not(.disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
          }

          .btn-compare.disabled {
            background: rgba(100, 100, 100, 0.3);
            color: #888;
            cursor: not-allowed;
          }

          .btn-clear {
            background: rgba(255, 255, 255, 0.1);
            color: #ddd;
          }

          .btn-clear:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          @media (max-width: 600px) {
            .selection-toast {
              width: 95%;
              padding: 1rem;
            }

            .selected-agents-display {
              max-height: 80px;
              overflow-y: auto;
            }

            .toast-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </>
  )
}

export default SelectionToast
