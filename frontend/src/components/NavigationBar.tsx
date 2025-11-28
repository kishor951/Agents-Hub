import { useState, useRef, useEffect } from 'react'
import WalletConnect from './WalletConnect'

interface NavigationBarProps {
  walletAddress: string | null
  onConnect: (address: string) => void
  onDisconnect: () => void
}

const NavigationBar = ({ walletAddress, onConnect, onDisconnect }: NavigationBarProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate dropdown position when it's shown
  useEffect(() => {
    if (showDropdown && profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [showDropdown])

  const showToastNotification = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`
  }

  const generateAvatar = (address: string) => {
    // Generate a color based on address hash
    let hash = 0
    for (let i = 0; i < address.length; i++) {
      hash = ((hash << 5) - hash) + address.charCodeAt(i)
      hash = hash & hash
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 60%)`
  }

  return (
    <nav className="navigation-bar">
      {/* Left: Project Name */}
      <div className="nav-left">
        <div className="project-name">
          <span className="project-icon">🧬</span>
          <span className="project-title">Agents Hub</span>
        </div>
      </div>

      {/* Right: Wallet Profile */}
      <div className="nav-right">
        {!walletAddress ? (
          <div className="wallet-connect-nav">
            <WalletConnect onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>
        ) : (
          <div className="wallet-profile-container" ref={dropdownRef}>
            {/* Profile Button */}
            <button
              ref={profileButtonRef}
              className="profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
              title={walletAddress}
            >
              <div
                className="profile-avatar"
                style={{ backgroundColor: generateAvatar(walletAddress) }}
              >
                <span className="avatar-icon">👛</span>
              </div>
              <span className="profile-address">{formatAddress(walletAddress)}</span>
              <span className="dropdown-chevron">
                {showDropdown ? '▼' : '▶'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="profile-dropdown" style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}>
                <div className="dropdown-header">
                  <div className="dropdown-avatar" style={{ backgroundColor: generateAvatar(walletAddress) }}>
                    <span className="avatar-icon">👛</span>
                  </div>
                  <div className="dropdown-info">
                    <div className="dropdown-label">Connected Wallet</div>
                    <div className="dropdown-full-address" title={walletAddress}>
                      {walletAddress}
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-actions">
                  <button
                    className="dropdown-action copy-address"
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress)
                      showToastNotification('Address copied!')
                    }}
                  >
                    📋 Copy Address
                  </button>
                  <button
                    className="dropdown-action view-explorer"
                    onClick={() => {
                      const explorerUrl = `https://testnet.cardanoscan.io/address/${walletAddress}`
                      window.open(explorerUrl, '_blank')
                    }}
                  >
                    🔍 View on Explorer
                  </button>
                </div>

                <div className="dropdown-divider"></div>

                <button
                  className="dropdown-disconnect"
                  onClick={() => {
                    localStorage.removeItem('walletAddress')
                    localStorage.removeItem('walletType')
                    setShowDropdown(false)
                    onDisconnect()
                  }}
                >
                  🔌 Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          ✅ {toastMessage}
        </div>
      )}

      <style>{`
        .navigation-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          backdrop-filter: blur(10px);
          margin-bottom: 2rem;
          border-radius: 0 0 12px 12px;
        }

        .nav-left {
          display: flex;
          align-items: center;
        }

        .project-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .project-name:hover {
          transform: scale(1.05);
        }

        .project-icon {
          font-size: 1.75rem;
        }

        .project-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-right {
          display: flex;
          align-items: center;
        }

        .wallet-connect-nav {
          display: flex;
        }

        .wallet-profile-container {
          position: relative;
        }

        .profile-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #cbd5e1;
          font-weight: 600;
        }

        .profile-button:hover {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .avatar-icon {
          filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
        }

        .profile-address {
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }

        .dropdown-chevron {
          font-size: 0.75rem;
          transition: transform 0.2s;
        }

        /* Dropdown Menu */
        .profile-dropdown {
          position: fixed;
          top: auto;
          right: auto;
          margin-top: 0.5rem;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          min-width: 280px;
          z-index: 10000;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          border: 2px solid rgba(139, 92, 246, 0.4);
          flex-shrink: 0;
        }

        .dropdown-info {
          flex: 1;
          min-width: 0;
        }

        .dropdown-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .dropdown-full-address {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          color: #cbd5e1;
          word-break: break-all;
          line-height: 1.3;
        }

        .dropdown-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent);
          margin: 0.5rem 0;
        }

        .dropdown-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.5rem;
        }

        .dropdown-action {
          padding: 0.75rem 1rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 6px;
          color: #cbd5e1;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.875rem;
          transition: all 0.2s;
          text-align: left;
        }

        .dropdown-action:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
          color: #e2e8f0;
        }

        .dropdown-action.copy-address:before {
          content: '';
        }

        .dropdown-action.view-explorer:before {
          content: '';
        }

        .dropdown-disconnect {
          width: 100%;
          padding: 0.75rem 1rem;
          margin: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #fca5a5;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .dropdown-disconnect:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          color: #fecaca;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .navigation-bar {
            padding: 0.75rem 1rem;
            margin-bottom: 1.5rem;
          }

          .project-title {
            font-size: 1.25rem;
          }

          .profile-button {
            padding: 0.5rem 0.75rem;
          }

          .profile-address {
            display: none;
          }

          .profile-avatar {
            width: 32px;
            height: 32px;
            font-size: 1rem;
          }

          .profile-dropdown {
            min-width: 250px;
          }
        }

        /* Toast Notification */
        .toast-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
          font-weight: 600;
          z-index: 10001;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </nav>
  )
}

export default NavigationBar
