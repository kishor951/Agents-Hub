import { useState, useEffect } from 'react'
import { meshCardanoService } from '../services/meshService'

interface WalletConnectProps {
  onConnect: (address: string) => void
  onDisconnect?: () => void
}

// Extend window type for wallet injection
declare const window: any

const WalletConnect = ({ onConnect, onDisconnect }: WalletConnectProps) => {
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
    console.log('🔗 Starting wallet connection...')
    console.log('🔍 Checking window.cardano:', typeof window.cardano, window.cardano)
    
    try {
      // Give wallets time to inject (sometimes takes a moment)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!window.cardano) {
        console.error('❌ window.cardano is not available')
        console.log('💡 Please make sure:')
        console.log('   1. Your wallet extension (Nami/Lace/Eternl) is installed')
        console.log('   2. The extension is enabled in your browser')
        console.log('   3. You have refreshed the page after installing')
        alert('Please install a Cardano wallet (Nami, Eternl, or Lace)\n\nAfter installing, refresh this page.')
        setLoading(false)
        return
      }

      console.log('📱 window.cardano found:', Object.keys(window.cardano))
      console.log('📱 Available wallets:', {
        nami: !!window.cardano.nami,
        eternl: !!window.cardano.eternl,
        lace: !!window.cardano.lace,
        flint: !!window.cardano.flint,
        typhon: !!window.cardano.typhon
      })

      // Try Nami, Eternl, and Lace
      let wallet = null
      let walletName = ''
      
      if (window.cardano.nami) {
        wallet = window.cardano.nami
        walletName = 'Nami'
      } else if (window.cardano.eternl) {
        wallet = window.cardano.eternl
        walletName = 'Eternl'
      } else if (window.cardano.lace) {
        wallet = window.cardano.lace
        walletName = 'Lace'
      }
      
      if (!wallet) {
        alert('No compatible wallet found. Please install Nami, Eternl, or Lace.')
        setLoading(false)
        return
      }

      console.log(`✅ Using wallet: ${walletName}`)
      
      const api = await wallet.enable()
      console.log('🔓 Wallet enabled')
      
      const addresses = await api.getUsedAddresses()
      console.log('📮 Got addresses:', addresses?.length)
      
      if (addresses && addresses.length > 0) {
        // CIP-30 wallets return hex-encoded CBOR addresses
        const hexAddress = addresses[0]
        console.log('📍 Raw address from wallet:', hexAddress.substring(0, 40) + '...')
        
        let bech32Address: string
        
        // Method 1: Check if it's already bech32
        if (hexAddress.startsWith('addr_test1') || hexAddress.startsWith('addr1')) {
          bech32Address = hexAddress
          console.log('✅ Address is already in bech32 format')
        } 
        // Method 2: Manual conversion from hex payment key hash
        else {
          console.log('🔧 Converting hex address to bech32...')
          
          // Extract payment key hash from CBOR-encoded address
          // Format: 00 (network) + 28 bytes payment key hash + optional stake key hash
          const paymentKeyHash = hexAddress.startsWith('01') || hexAddress.startsWith('00') 
            ? hexAddress.substring(2, 58) 
            : hexAddress.substring(0, 56)
          
          console.log('🔑 Payment key hash:', paymentKeyHash)
          
          // Use backend to convert (it has proper libraries)
          try {
            const response = await fetch('http://localhost:5000/api/wallet/convert-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                hexAddress,
                paymentKeyHash,
                network: 'preprod'
              })
            })
            
            if (!response.ok) {
              throw new Error('Backend conversion failed')
            }
            
            const data = await response.json()
            bech32Address = data.bech32Address
            console.log('✅ Converted via backend:', bech32Address)
          } catch (backendError) {
            console.warn('⚠️ Backend conversion failed:', backendError)
            
            // Fallback: Use Demo Mode
            console.log('💡 Using Demo Mode instead')
            alert('Unable to convert wallet address automatically.\n\nUsing Demo Mode with a test address.\n\nThis is sufficient for testing the platform.')
            bech32Address = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp'
          }
        }
        
        // Verify payment key hash via Mesh service
        try {
          const keyHash = await meshCardanoService.getPaymentKeyHash(bech32Address)
          console.log('✅ Payment key hash verified:', keyHash.substring(0, 16) + '...')
        } catch (err) {
          console.warn('⚠️  Could not verify key hash:', err)
        }
        
        console.log('💾 Saving wallet data...')
        setAddress(bech32Address)
        setConnected(true)
        localStorage.setItem('walletAddress', bech32Address)
        localStorage.setItem('walletType', walletName)
        
        console.log('✅ Wallet connected successfully!')
        console.log(`   Address format: ${bech32Address.startsWith('addr_') ? 'bech32 ✓' : 'unknown ⚠️'}`)
        onConnect(bech32Address)
      } else {
        const errorMsg = `No addresses found in ${walletName} wallet.

Please:
1. Create or restore an account in ${walletName}
2. Make sure you're on TESTNET (not Mainnet)
3. Verify you have at least one address in ${walletName}
4. Refresh this page and try again

Or use Demo Mode to test the platform.`
        alert(errorMsg)
      }
    } catch (error) {
      console.error('❌ Wallet connection error:', error)
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setConnected(false)
    localStorage.removeItem('walletAddress')
    onDisconnect?.()
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
          <button onClick={connectWallet} disabled={loading} className="wallet-button">
            {loading ? '⏳ Connecting...' : '🔗 Connect Wallet'}
          </button>
          <button onClick={useDemoMode} className="demo-button">
            🎮 Demo Mode
          </button>
        </div>
      ) : (
        <div className="wallet-info">
          <div className="wallet-status">
            <span className="wallet-badge">✅ Connected</span>
            <span className="wallet-address">{address?.substring(0, 16)}...</span>
          </div>
          <button onClick={disconnectWallet} className="disconnect-button">
            🔌 Disconnect
          </button>
        </div>
      )}
      
      <style>{`
        .wallet-connect {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .wallet-button,
        .demo-button,
        .disconnect-button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-size: 14px;
        }

        .wallet-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          border: 1px solid rgba(139, 92, 246, 0.5);
        }

        .wallet-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .wallet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .demo-button {
          background: rgba(100, 200, 255, 0.1);
          color: #64c8ff;
          border: 1px solid rgba(100, 200, 255, 0.3);
        }

        .demo-button:hover {
          background: rgba(100, 200, 255, 0.2);
          border-color: rgba(100, 200, 255, 0.5);
        }

        .wallet-info {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px 0;
        }

        .wallet-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wallet-badge {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
        }

        .wallet-address {
          background: rgba(148, 163, 184, 0.1);
          color: #cbd5e1;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .disconnect-button {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .disconnect-button:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        @media (max-width: 768px) {
          .wallet-connect {
            flex-direction: column;
            width: 100%;
          }

          .wallet-info {
            flex-direction: column;
            width: 100%;
          }

          .wallet-address {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}</style>
    </div>
  )
}

export default WalletConnect
