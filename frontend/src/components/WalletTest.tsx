import { useState } from 'react'
import '../styles/WalletTest.css'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO'
  message: string
  details?: any
}

const WalletTest = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string>('')

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const runWalletTest = async () => {
    setResults([])
    setTesting(true)

    try {
      // Test 1: Check window.cardano
      if (!window.cardano) {
        addResult({
          test: 'Cardano Object Detection',
          status: 'FAIL',
          message: 'window.cardano not found',
          details: 'No Cardano wallet installed. Install Lace, Nami, or Eternl.'
        })
        setTesting(false)
        return
      }

      addResult({
        test: 'Cardano Object Detection',
        status: 'PASS',
        message: 'window.cardano found',
        details: `Available: ${Object.keys(window.cardano).join(', ')}`
      })

      // Test 2: Detect wallets
      const wallets: any = {
        lace: window.cardano.lace,
        nami: window.cardano.nami,
        eternl: window.cardano.eternl,
        flint: window.cardano.flint
      }

      const available = Object.entries(wallets)
        .filter(([_, w]) => w)
        .map(([name]) => name)

      if (available.length === 0) {
        addResult({
          test: 'Wallet Detection',
          status: 'FAIL',
          message: 'No CIP-30 wallets found',
          details: 'Install a wallet extension'
        })
        setTesting(false)
        return
      }

      addResult({
        test: 'Wallet Detection',
        status: 'PASS',
        message: `Found ${available.length} wallet(s)`,
        details: available.join(', ')
      })

      // Test 3: Select wallet
      const walletName = available[0]
      setSelectedWallet(walletName)
      const wallet = wallets[walletName]

      addResult({
        test: 'Wallet Selection',
        status: 'INFO',
        message: `Testing with ${walletName}`,
        details: `API Version: ${wallet.apiVersion || 'N/A'}`
      })

      // Test 4: Enable wallet
      addResult({
        test: 'Wallet Connection',
        status: 'INFO',
        message: 'Requesting connection...',
        details: 'Please approve the popup'
      })

      let walletApi
      try {
        walletApi = await wallet.enable()
      } catch (error: any) {
        addResult({
          test: 'Wallet Connection',
          status: 'FAIL',
          message: 'Connection rejected',
          details: error.message
        })
        setTesting(false)
        return
      }

      addResult({
        test: 'Wallet Connection',
        status: 'PASS',
        message: 'Successfully connected!',
        details: `Connected to ${walletName}`
      })

      // Test 5: Get network
      try {
        const networkId = await walletApi.getNetworkId()
        const networkName = networkId === 0 ? 'Testnet' : networkId === 1 ? 'Mainnet' : 'Unknown'
        
        addResult({
          test: 'Network Detection',
          status: networkId === 0 ? 'PASS' : 'WARN',
          message: `Connected to ${networkName}`,
          details: networkId === 1 ? '⚠️ Connected to MAINNET!' : '✅ Testnet (correct)'
        })
      } catch (error: any) {
        addResult({
          test: 'Network Detection',
          status: 'FAIL',
          message: 'Failed to get network',
          details: error.message
        })
      }

      // Test 6: Get addresses
      try {
        const usedAddrs = await walletApi.getUsedAddresses()
        const unusedAddrs = await walletApi.getUnusedAddresses()
        
        if (usedAddrs.length === 0 && unusedAddrs.length === 0) {
          addResult({
            test: 'Address Query',
            status: 'WARN',
            message: 'No addresses found',
            details: 'Wallet may be empty or new'
          })
        } else {
          addResult({
            test: 'Address Query',
            status: 'PASS',
            message: `Found ${usedAddrs.length + unusedAddrs.length} addresses`,
            details: `${usedAddrs.length} used, ${unusedAddrs.length} unused`
          })
        }
      } catch (error: any) {
        addResult({
          test: 'Address Query',
          status: 'FAIL',
          message: 'Failed to get addresses',
          details: error.message
        })
      }

      // Test 7: Get UTXOs
      try {
        const utxos = await walletApi.getUtxos()
        
        if (!utxos || utxos.length === 0) {
          addResult({
            test: 'UTXO Query',
            status: 'WARN',
            message: 'No UTXOs found',
            details: 'Wallet has no funds. Get testnet ADA from faucet.'
          })
        } else {
          addResult({
            test: 'UTXO Query',
            status: 'PASS',
            message: `Found ${utxos.length} UTXOs`,
            details: 'Wallet has funds - ready for transactions'
          })
        }
      } catch (error: any) {
        addResult({
          test: 'UTXO Query',
          status: 'FAIL',
          message: 'Failed to query UTXOs',
          details: error.message
        })
      }

      // Test 8: Check signing capability
      if (typeof walletApi.signTx === 'function') {
        addResult({
          test: 'Transaction Signing',
          status: 'PASS',
          message: 'Wallet supports signTx',
          details: 'Ready to sign transactions'
        })
      } else {
        addResult({
          test: 'Transaction Signing',
          status: 'FAIL',
          message: 'signTx not available',
          details: 'Wallet may not be CIP-30 compliant'
        })
      }

      // Final summary
      const passed = results.filter(r => r.status === 'PASS').length
      const failed = results.filter(r => r.status === 'FAIL').length
      
      if (failed === 0) {
        addResult({
          test: 'Overall Status',
          status: 'PASS',
          message: '🎉 All tests passed!',
          details: 'Wallet is ready for NFT minting'
        })
      } else {
        addResult({
          test: 'Overall Status',
          status: 'WARN',
          message: `${passed} passed, ${failed} failed`,
          details: 'Some tests failed - check details above'
        })
      }

    } catch (error: any) {
      addResult({
        test: 'Test Execution',
        status: 'FAIL',
        message: 'Unexpected error',
        details: error.message
      })
    }

    setTesting(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return '✅'
      case 'FAIL': return '❌'
      case 'WARN': return '⚠️'
      case 'INFO': return 'ℹ️'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return '#00ff00'
      case 'FAIL': return '#ff0000'
      case 'WARN': return '#ffaa00'
      case 'INFO': return '#00aaff'
      default: return '#666666'
    }
  }

  return (
    <div className="wallet-test-container">
      <div className="wallet-test-header">
        <h2>🔍 Wallet Connection Test</h2>
        <p>Test CIP-30 wallet integration for NFT minting</p>
      </div>

      <div className="wallet-test-actions">
        <button 
          onClick={runWalletTest}
          disabled={testing}
          className="test-button"
        >
          {testing ? '🔄 Testing...' : '▶️ Run Wallet Test'}
        </button>
        
        {results.length > 0 && (
          <button 
            onClick={() => setResults([])}
            className="clear-button"
          >
            🗑️ Clear Results
          </button>
        )}
      </div>

      {selectedWallet && (
        <div className="selected-wallet">
          Testing with: <strong>{selectedWallet.toUpperCase()}</strong>
        </div>
      )}

      <div className="test-results">
        {results.length === 0 && !testing && (
          <div className="no-results">
            <p>Click "Run Wallet Test" to begin validation</p>
            <p className="help-text">
              Make sure you have Lace, Nami, or Eternl wallet installed
            </p>
          </div>
        )}

        {results.map((result, index) => (
          <div 
            key={index} 
            className={`test-result test-result-${result.status.toLowerCase()}`}
          >
            <div className="result-header">
              <span className="result-icon">{getStatusIcon(result.status)}</span>
              <span className="result-test">{result.test}</span>
              <span 
                className="result-status"
                style={{ color: getStatusColor(result.status) }}
              >
                {result.status}
              </span>
            </div>
            <div className="result-message">{result.message}</div>
            {result.details && (
              <div className="result-details">{result.details}</div>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && !testing && (
        <div className="test-summary">
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-icon">✅</span>
              <span className="stat-label">Passed:</span>
              <span className="stat-value">{results.filter(r => r.status === 'PASS').length}</span>
            </div>
            <div className="stat">
              <span className="stat-icon">❌</span>
              <span className="stat-label">Failed:</span>
              <span className="stat-value">{results.filter(r => r.status === 'FAIL').length}</span>
            </div>
            <div className="stat">
              <span className="stat-icon">⚠️</span>
              <span className="stat-label">Warnings:</span>
              <span className="stat-value">{results.filter(r => r.status === 'WARN').length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="test-info">
        <h3>📚 What This Tests:</h3>
        <ul>
          <li>✅ Wallet extension detection</li>
          <li>✅ CIP-30 API availability</li>
          <li>✅ Wallet connection/authorization</li>
          <li>✅ Network detection (testnet vs mainnet)</li>
          <li>✅ Address retrieval</li>
          <li>✅ UTXO queries</li>
          <li>✅ Transaction signing capability</li>
        </ul>
      </div>
    </div>
  )
}

export default WalletTest
