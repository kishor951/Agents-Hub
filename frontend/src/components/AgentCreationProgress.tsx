import { useEffect, useState } from 'react'

interface AgentCreationProgressProps {
  isOpen: boolean
  currentStep: 'validating' | 'uploading' | 'saving' | 'minting' | 'complete' | 'error'
  errorMessage?: string
  onClose: () => void
}

const AgentCreationProgress = ({ isOpen, currentStep, errorMessage, onClose }: AgentCreationProgressProps) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animate progress bar based on step
    switch (currentStep) {
      case 'validating':
        setProgress(20)
        break
      case 'uploading':
        setProgress(40)
        break
      case 'saving':
        setProgress(60)
        break
      case 'minting':
        setProgress(80)
        break
      case 'complete':
        setProgress(100)
        break
      case 'error':
        setProgress(0)
        break
    }
  }, [currentStep])

  if (!isOpen) return null

  const steps = [
    { id: 'validating', label: 'Validating Data', icon: '🔍' },
    { id: 'uploading', label: 'Uploading to IPFS', icon: '📤' },
    { id: 'saving', label: 'Saving Metadata', icon: '💾' },
    { id: 'minting', label: 'Building Mint TX', icon: '⛓️' },
    { id: 'complete', label: 'Agent Created', icon: '✅' }
  ]

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    
    if (currentStep === 'error') return 'error'
    if (stepIndex < currentIndex) return 'complete'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="progress-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && currentStep === 'complete') {
        onClose()
      }
    }}>
      <div className="progress-modal">
        <div className="progress-header">
          <h2>Creating Your Agent</h2>
          {currentStep === 'complete' && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Steps */}
        <div className="progress-steps">
          {steps.map((step) => {
            const status = getStepStatus(step.id)
            return (
              <div key={step.id} className={`progress-step ${status}`}>
                <div className="step-icon">{step.icon}</div>
                <div className="step-label">{step.label}</div>
                {status === 'active' && (
                  <div className="step-spinner">
                    <div className="spinner" />
                  </div>
                )}
                {status === 'complete' && (
                  <div className="step-check">✓</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Error Message */}
        {currentStep === 'error' && errorMessage && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{errorMessage}</p>
            <button className="retry-btn" onClick={onClose}>Close</button>
          </div>
        )}

        {/* Success Message */}
        {currentStep === 'complete' && (
          <div className="success-message">
            <h3>🎉 Agent Created & NFT Ready!</h3>
            <p>Your agent has been minted as an NFT. Sign with your wallet to complete the transaction.</p>
            <button className="done-btn" onClick={onClose}>View My Agents</button>
          </div>
        )}
      </div>

      <style>{`
        .progress-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .progress-modal {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .progress-header h2 {
          margin: 0;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #cbd5e1;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
          border-radius: 4px;
          transition: width 0.5s ease-out;
        }

        .progress-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s;
        }

        .progress-step.active {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
        }

        .progress-step.complete {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
        }

        .progress-step.error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .step-icon {
          font-size: 1.5rem;
          width: 40px;
          text-align: center;
        }

        .step-label {
          flex: 1;
          color: #e2e8f0;
          font-weight: 500;
        }

        .progress-step.pending .step-label {
          color: #94a3b8;
        }

        .step-spinner {
          width: 20px;
          height: 20px;
        }

        .spinner {
          width: 100%;
          height: 100%;
          border: 3px solid rgba(139, 92, 246, 0.2);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .step-check {
          color: #22c55e;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
        }

        .error-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .error-message p {
          color: #fca5a5;
          margin: 0 0 1rem 0;
        }

        .retry-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          color: #fecaca;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .retry-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .success-message {
          text-align: center;
          padding: 1rem 0;
        }

        .success-message h3 {
          color: #e2e8f0;
          margin: 0 0 0.5rem 0;
        }

        .success-message p {
          color: #94a3b8;
          margin: 0 0 1.5rem 0;
        }

        .done-btn {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          border-radius: 8px;
          padding: 0.75rem 2rem;
          color: white;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .done-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        @media (max-width: 768px) {
          .progress-modal {
            padding: 1.5rem;
          }

          .progress-header h2 {
            font-size: 1.25rem;
          }

          .step-icon {
            font-size: 1.2rem;
            width: 32px;
          }

          .step-label {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  )
}

export default AgentCreationProgress
