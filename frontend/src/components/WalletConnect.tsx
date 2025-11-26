import { useState, useEffect } from 'react'
import { WalletApi } from '../types'

interface WalletConnectProps {
  onConnect: (address: string) => void
}

declare global {
  interface Window {
    cardano?: {
      nami?: { enable(): Promise<WalletApi> }
      eternl?: { enable(): Promise<WalletApi> }
      [key: string]: any
    }
  }
}

const WalletConnect = ({ onConnect }: WalletConnectProps) => {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if wallet was previously connected
    const savedAddress = localStorage.getItem('walletAddress')
    if (savedAddress) {
      setAddress(savedAddress)
      setConnected(true)
      onConnect(savedAddress)
    }
  }, [onConnect])

  const connectWallet = async () => {
    setLoading(true)
    try {
      if (!window.cardano) {
        alert('Please install a Cardano wallet (Nami or Eternl)')
        setLoading(false)
        return
      }

      // Try Nami first, then Eternl
      const wallet = window.cardano.nami || window.cardano.eternl
      if (!wallet) {
        alert('No compatible wallet found. Please install Nami or Eternl.')
        setLoading(false)
        return
      }

      const api = await wallet.enable()
      const addresses = await api.getUsedAddresses()
      
      if (addresses && addresses.length > 0) {
        // Use first address (simplified for demo)
        const addr = addresses[0]
        setAddress(addr)
        setConnected(true)
        localStorage.setItem('walletAddress', addr)
        onConnect(addr)
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setConnected(false)
    localStorage.removeItem('walletAddress')
  }

  const useDemoMode = () => {
    const demoAddress = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp'
    setAddress(demoAddress)
    setConnected(true)
    localStorage.setItem('walletAddress', demoAddress)
    onConnect(demoAddress)
  }

  return (
    <div className="wallet-connect">
      {!connected ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : '🔗 Connect Wallet'}
          </button>
          <button onClick={useDemoMode} className="demo-button">
            🎮 Demo Mode
          </button>
        </div>
      ) : (
        <div className="wallet-info">
          <span>✅ {address?.substring(0, 12)}...</span>
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      )}
    </div>
  )
}

export default WalletConnect
