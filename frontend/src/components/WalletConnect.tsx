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
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          font-weight: 700;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.75rem;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }

        .wallet-button {
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.3), 
            rgba(0, 240, 255, 0.1));
          color: var(--color-primary, #00F0FF);
          border: 1px solid rgba(0, 240, 255, 0.5);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }

        .wallet-button:hover:not(:disabled) {
          transform: translateY(-3px);
          background: linear-gradient(135deg, 
            rgba(0, 240, 255, 0.5), 
            rgba(0, 240, 255, 0.2));
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
          border-color: var(--color-primary, #00F0FF);
        }

        .wallet-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .demo-button {
          background: rgba(255, 255, 255, 0.05);
          color: var(--color-text-secondary, #8F90A6);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .demo-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.3);
          color: var(--color-text-primary, #FFFFFF);
          transform: translateY(-2px);
        }

        .wallet-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0;
        }

        .wallet-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .wallet-badge {
          background: linear-gradient(135deg, 
            rgba(32, 227, 178, 0.3), 
            rgba(32, 227, 178, 0.1));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #20E3B2;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          border: 1px solid rgba(32, 227, 178, 0.4);
          font-weight: 700;
          font-size: 0.6875rem;
          font-family: var(--font-mono, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          box-shadow: 0 0 15px rgba(32, 227, 178, 0.4);
        }

        .wallet-address {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: var(--color-text-primary, #FFFFFF);
          padding: 0.625rem 1rem;
          border-radius: 100px;
          font-family: var(--font-mono, 'Space Mono', monospace);
          font-size: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          letter-spacing: 0.02em;
        }

        .disconnect-button {
          background: rgba(255, 82, 82, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #FF5252;
          border: 1px solid rgba(255, 82, 82, 0.3);
        }

        .disconnect-button:hover {
          background: rgba(255, 82, 82, 0.25);
          border-color: rgba(255, 82, 82, 0.5);
          box-shadow: 0 0 20px rgba(255, 82, 82, 0.4);
          transform: translateY(-2px);
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
