import { useState, useRef, useEffect } from 'react'
import WalletConnect from './WalletConnect'

type Screen = 'dashboard' | 'create' | 'agent-detail' | 'breed' | 'child' | 'my-agents' | 'wallet-test'

interface NavigationBarProps {
  walletAddress: string | null
  onConnect: (address: string) => void
  onDisconnect: () => void
  currentScreen: string
  onScreenChange: (screen: Screen) => void
}

const NavigationBar = ({ walletAddress, onConnect, onDisconnect, currentScreen, onScreenChange }: NavigationBarProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const createButtonRef = useRef<HTMLDivElement>(null)

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
      <div className="nav-container">
        {/* Left: Project Name */}
        <div className="nav-left">
          <div className="project-name">
            <span className="project-icon">🧬</span>
            <span className="project-title">Agents Hub</span>
          </div>
        </div>

      {/* Right: Navigation Tabs + Wallet Profile */}
      <div className="nav-right">
        {walletAddress && (
          <div className="nav-tabs">
            <button
              className={`nav-tab ${currentScreen === 'dashboard' ? 'active' : ''}`}
              onClick={() => onScreenChange('dashboard')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                <path d="M2 12h20"/>
              </svg>
              <span>Explore Agents</span>
            </button>
            <div 
              className="nav-tab-wrapper"
              ref={createButtonRef}
              onMouseEnter={() => setShowCreateDropdown(true)}
              onMouseLeave={() => setShowCreateDropdown(false)}
            >
              <button
                className={`nav-tab ${(currentScreen === 'create' || currentScreen === 'breed') ? 'active' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Create Agents</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dropdown-icon">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {/* Page Indicator - Shows below button when not hovering */}
              {!showCreateDropdown && (currentScreen === 'create' || currentScreen === 'breed') && (
                <div className="page-indicator-inline">
                  <span className="indicator-label">
                    {currentScreen === 'create' ? 'DIY Agent' : 'Breeding'}
                  </span>
                </div>
              )}
              
              {showCreateDropdown && (
                <div className="create-dropdown">
                  <button 
                    className={`create-option ${currentScreen === 'create' ? 'active' : ''}`}
                    onClick={() => {
                      onScreenChange('create')
                      setShowCreateDropdown(false)
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M2 12h20"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <div className="option-text">
                      <span className="option-title">DIY Agent</span>
                      <span className="option-desc">Create from scratch</span>
                    </div>
                  </button>
                  <button 
                    className={`create-option ${currentScreen === 'breed' ? 'active' : ''}`}
                    onClick={() => {
                      onScreenChange('breed')
                      setShowCreateDropdown(false)
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.2 7.8l-7.7 7.7-4-4-5.7 5.7"/>
                      <path d="M15 7h6v6"/>
                      <path d="M9 18H3v-6"/>
                    </svg>
                    <div className="option-text">
                      <span className="option-title">Breed Agents</span>
                      <span className="option-desc">Combine two agents</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
                <div className="dropdown-actions">
                  <button
                    className="dropdown-action copy-address"
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress)
                      showToastNotification('Address copied!')
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span>Copy Address</span>
                  </button>
                  <button
                    className="dropdown-action view-explorer"
                    onClick={() => {
                      const explorerUrl = `https://testnet.cardanoscan.io/address/${walletAddress}`
                      window.open(explorerUrl, '_blank')
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <span>View on Explorer</span>
                  </button>
                  <button
                    className={`dropdown-action test-wallet ${currentScreen === 'wallet-test' ? 'active' : ''}`}
                    onClick={() => {
                      setShowDropdown(false)
                      onScreenChange('wallet-test')
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Test Wallet</span>
                  </button>
                  <button
                    className={`dropdown-action my-agents ${currentScreen === 'my-agents' ? 'active' : ''}`}
                    onClick={() => {
                      setShowDropdown(false)
                      onScreenChange('my-agents')
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.2 7.8l-7.7 7.7-4-4-5.7 5.7"/>
                      <path d="M15 7h6v6"/>
                      <path d="M9 18H3v-6"/>
                    </svg>
                    <span>My Agents</span>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          ✅ {toastMessage}
        </div>
      )}

      <style>{`
        /* ========== GLASSMORPHIC NAVIGATION BAR ========== */
        .navigation-bar {
          background: rgba(10, 11, 16, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 0;
          width: 100%;
          box-sizing: border-box;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem var(--nav-padding, 0.09375rem);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }

        /* Project Logo */
        .project-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .project-name:hover {
          transform: translateY(-2px);
          filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.5));
        }

        .project-icon {
          font-size: 1.75rem;
          filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.6));
        }

        .project-title {
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Tomorrow', 'Space Mono', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, #00F0FF 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Padding Editor Toggle Button */
        .padding-editor-toggle {
          padding: 0.625rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--color-text-secondary, #8F90A6);
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .padding-editor-toggle:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.3);
          color: var(--color-primary, #00F0FF);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
        }

        /* Padding Editor Panel */
        .padding-editor-panel {
          position: fixed;
          top: 80px;
          right: 20px;
          width: 380px;
          background: rgba(10, 11, 16, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 240, 255, 0.2);
          z-index: 10000;
          padding: 1.5rem;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .editor-header h4 {
          font-size: 1rem;
          font-family: var(--font-headline, 'Orbitron', sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-primary, #00F0FF);
          margin: 0;
        }

        .close-editor {
          background: none;
          border: none;
          color: var(--color-text-secondary, #8F90A6);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          transition: all 0.3s;
        }

        .close-editor:hover {
          color: var(--color-text-primary, #FFFFFF);
        }

        .editor-controls {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group label {
          font-size: 0.75rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #8F90A6);
        }

        .control-group input[type="range"] {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          outline: none;
          -webkit-appearance: none;
        }

        .control-group input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--color-primary, #00F0FF);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .control-group input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--color-primary, #00F0FF);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .control-group input[type="number"] {
          width: 100%;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--color-text-primary, #FFFFFF);
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.875rem;
        }

        .control-group input[type="number"]:focus {
          outline: none;
          border-color: var(--color-primary, #00F0FF);
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
        }

        .apply-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(255, 255, 255, 0.15));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 240, 255, 0.5);
          border-radius: 100px;
          color: var(--color-text-primary, #FFFFFF);
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
        }

        .apply-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.6);
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.5), rgba(255, 255, 255, 0.25));
        }

        .current-values {
          padding: 0.75rem;
          background: rgba(0, 240, 255, 0.05);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 8px;
          text-align: center;
        }

        .current-values small {
          font-family: var(--font-mono, 'Space Mono', monospace);
          color: var(--color-text-secondary, #8F90A6);
          font-size: 0.6875rem;
        }

        /* Navigation Tabs - Glass Pills */
        .nav-tabs {
          display: flex;
          gap: 0.5rem;
        }

        .nav-tab-wrapper {
          position: relative;
        }

        .nav-tab-wrapper::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          height: 12px;
          background: transparent;
        }

        .nav-tab {
          padding: 0.625rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          color: var(--color-text-secondary, #8F90A6);
          cursor: pointer;
          font-weight: 500;
          font-size: 0.75rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dropdown-icon {
          margin-left: 0.25rem;
          transition: transform 0.3s;
        }

        .nav-tab-wrapper:hover .dropdown-icon {
          transform: rotate(180deg);
        }

        .nav-tab:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.3);
          color: var(--color-text-primary, #FFFFFF);
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
        }

        .nav-tab.active {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.05));
          border-color: var(--color-primary, #00F0FF);
          color: var(--color-primary, #00F0FF);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3);
        }

        /* Create Agents Dropdown */
        .create-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 240px;
          background: rgba(10, 11, 16, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 12px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 240, 255, 0.2);
          padding: 0.5rem;
          z-index: 1000;
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Add padding area to prevent dropdown from closing */
        .create-dropdown::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 0;
          right: 0;
          height: 8px;
          background: transparent;
        }

        .create-option {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--color-text-secondary, #8F90A6);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 0.5rem;
          text-align: left;
        }

        .create-option:last-child {
          margin-bottom: 0;
        }

        .create-option:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.4);
          transform: translateX(4px);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
        }

        .create-option.active {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.05));
          border-color: var(--color-primary, #00F0FF);
          color: var(--color-primary, #00F0FF);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }

        .create-option svg {
          flex-shrink: 0;
          color: currentColor;
        }

        .option-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .option-title {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-primary, #FFFFFF);
        }

        .option-desc {
          font-size: 0.625rem;
          font-family: var(--font-primary, 'Space Mono', sans-serif);
          color: var(--color-text-secondary, #8F90A6);
          text-transform: none;
        }

        .create-option.active .option-title {
          color: var(--color-primary, #00F0FF);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        /* Navigation Tabs - Glass Pills */
        .nav-tabs {
          display: flex;
          gap: 0.5rem;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          color: var(--color-text-secondary, #8F90A6);
          cursor: pointer;
          font-weight: 500;
          font-size: 0.75rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
        }

        .nav-tab svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .nav-tab:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.3);
          color: var(--color-text-primary, #FFFFFF);
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
        }

        .nav-tab.active {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.05));
          border-color: var(--color-primary, #00F0FF);
          color: var(--color-primary, #00F0FF);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3);
        }

        .nav-tab.active svg {
          filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.8));
        }
        .wallet-profile-container {
          position: relative;
        }

        .profile-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--color-text-primary, #FFFFFF);
          font-weight: 600;
          font-family: var(--font-mono, 'Space Mono', monospace);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }

        .profile-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2);
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
        }

        .avatar-icon {
          filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.5));
        }

        .profile-address {
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.75rem;
          letter-spacing: 0.02em;
        }

        .dropdown-chevron {
          font-size: 0.625rem;
          transition: transform 0.3s;
          opacity: 0.6;
        }

        /* Dropdown Menu - Enhanced Glass */
        .profile-dropdown {
          position: fixed;
          background: rgba(10, 11, 16, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), 
                      0 0 40px rgba(0, 240, 255, 0.1);
          min-width: 240px;
          z-index: 10000;
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          padding: 0.75rem;
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

        .dropdown-divider {
          height: 1px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(0, 240, 255, 0.3) 20%, 
            rgba(255, 255, 255, 0.2) 80%, 
            transparent
          );
          margin: 0.5rem 0;
        }

        .dropdown-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dropdown-action {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.125rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: var(--color-text-primary, #FFFFFF);
          cursor: pointer;
          font-weight: 500;
          font-size: 0.8125rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
        }

        .dropdown-action svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .dropdown-action:hover {
          background: rgba(0, 240, 255, 0.15);
          border-color: rgba(0, 240, 255, 0.4);
          transform: translateX(4px);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
        }

        .dropdown-action.active {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.05));
          border-color: var(--color-primary, #00F0FF);
          color: var(--color-primary, #00F0FF);
        }

        .dropdown-disconnect {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1.125rem;
          margin-top: 0.5rem;
          background: rgba(255, 82, 82, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 82, 82, 0.3);
          border-radius: 10px;
          color: #FF5252;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8125rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dropdown-disconnect svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .dropdown-disconnect:hover {
          background: rgba(255, 82, 82, 0.2);
          border-color: rgba(255, 82, 82, 0.6);
          box-shadow: 0 0 20px rgba(255, 82, 82, 0.4);
          transform: translateY(-2px);
        }

        /* Toast Notification - Glassmorphic */
        .toast-notification {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(32, 227, 178, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(32, 227, 178, 0.4);
          color: #20E3B2;
          padding: 1rem 2rem;
          border-radius: 100px;
          box-shadow: 0 0 30px rgba(32, 227, 178, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3);
          font-weight: 600;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 10001;
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Page Indicator - Shows current Create Agents selection */
        .page-indicator-inline {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 50%;
          transform: translateX(-50%);
          z-index: 998;
          animation: indicatorFadeIn 0.3s ease-out;
          pointer-events: none;
        }

        .page-indicator-inline .indicator-label {
          display: inline-block;
          font-size: 0.625rem;
          font-weight: 600;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          background: linear-gradient(135deg, #00F0FF 0%, #00A8CC 100%);
          color: #0A0B10;
          box-shadow: 0 4px 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.2);
          white-space: nowrap;
        }

        @keyframes indicatorFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Ensure nav-tab-wrapper has relative positioning */
        .nav-tab-wrapper {
          position: relative;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .nav-container {
            padding: 1rem 0.0625rem;
          }

          .nav-tabs {
            gap: 0.375rem;
          }
          
          .nav-tab {
            padding: 0.5rem 0.875rem;
            font-size: 0.6875rem;
          }

          .nav-tab span {
            display: none;
          }

          .nav-tab svg {
            margin: 0;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 1rem 0.046875rem;
          }

          .nav-right {
            gap: 1rem;
          }

          .nav-tabs {
            gap: 0.375rem;
          }
          
          .nav-tab {
            padding: 0.5rem 0.75rem;
            font-size: 0.6875rem;
          }

          .nav-tab span {
            display: none;
          }

          .profile-address {
            display: none;
          }

          .profile-dropdown {
            min-width: 280px;
          }
        }

        @media (max-width: 480px) {
          .nav-container {
            padding: 0.875rem 0.03125rem;
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .nav-left {
            width: 100%;
          }
          
          .project-title {
            font-size: 1.125rem;
          }

          .nav-right {
            width: 100%;
            justify-content: space-between;
          }
          
          .nav-tabs {
            gap: 0.25rem;
            flex: 1;
          }
          
          .nav-tab {
            font-size: 0.625rem;
            padding: 0.5rem 0.625rem;
            flex: 1;
            justify-content: center;
          }

          .nav-tab span {
            display: none;
          }
        }
      `}</style>
    </nav>
  )
}

export default NavigationBar
