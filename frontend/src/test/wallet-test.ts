/**
 * Wallet Connection Test (CIP-30)
 * 
 * This test validates wallet connectivity without requiring a backend.
 * Open in browser: Copy this code to browser console after loading frontend
 */

// Color logging helpers
const log = {
  success: (msg: string, data?: any) => {
    console.log('%c✅ ' + msg, 'color: #00ff00; font-weight: bold')
    if (data) console.log(data)
  },
  error: (msg: string, data?: any) => {
    console.log('%c❌ ' + msg, 'color: #ff0000; font-weight: bold')
    if (data) console.error(data)
  },
  warn: (msg: string, data?: any) => {
    console.log('%c⚠️  ' + msg, 'color: #ffaa00; font-weight: bold')
    if (data) console.warn(data)
  },
  info: (msg: string, data?: any) => {
    console.log('%c🔍 ' + msg, 'color: #00aaff; font-weight: bold')
    if (data) console.log(data)
  }
}

interface WalletTest {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
  message: string
  details?: any
}

const results: WalletTest[] = []

function recordResult(result: WalletTest) {
  results.push(result)
  switch (result.status) {
    case 'PASS':
      log.success(`${result.name}: ${result.message}`, result.details)
      break
    case 'FAIL':
      log.error(`${result.name}: ${result.message}`, result.details)
      break
    case 'WARN':
      log.warn(`${result.name}: ${result.message}`, result.details)
      break
    case 'SKIP':
      log.info(`${result.name}: ${result.message}`, result.details)
      break
  }
}

async function testWalletConnection() {
  console.clear()
  console.log('%c🔍 WALLET CONNECTION TEST (CIP-30)', 'color: #ffffff; font-size: 20px; font-weight: bold')
  console.log('%c' + '='.repeat(60), 'color: #666666')

  // Test 1: Check if window.cardano exists
  log.info('Test 1: Checking for window.cardano...')
  if (typeof window === 'undefined') {
    recordResult({
      name: 'Environment Check',
      status: 'FAIL',
      message: 'Not running in browser environment'
    })
    return
  }

  if (!window.cardano) {
    recordResult({
      name: 'Cardano Object',
      status: 'FAIL',
      message: 'window.cardano not found - No Cardano wallet installed',
      details: {
        solution: 'Install Lace, Nami, or Eternl wallet extension',
        lace: 'https://www.lace.io/',
        nami: 'https://namiwallet.io/',
        eternl: 'https://eternl.io/'
      }
    })
    return
  }

  recordResult({
    name: 'Cardano Object',
    status: 'PASS',
    message: 'window.cardano found',
    details: { available: Object.keys(window.cardano) }
  })

  // Test 2: Detect available wallets
  log.info('Test 2: Detecting available wallets...')
  const wallets = {
    lace: window.cardano.lace,
    nami: window.cardano.nami,
    eternl: window.cardano.eternl,
    flint: window.cardano.flint,
    typhon: window.cardano.typhoncip30,
    gero: window.cardano.gerowallet
  }

  const availableWallets = Object.entries(wallets)
    .filter(([_, wallet]) => wallet)
    .map(([name, wallet]) => ({
      name,
      version: (wallet as any).apiVersion,
      icon: (wallet as any).icon
    }))

  if (availableWallets.length === 0) {
    recordResult({
      name: 'Wallet Detection',
      status: 'FAIL',
      message: 'No CIP-30 compatible wallets found',
      details: { solution: 'Install a wallet extension and refresh the page' }
    })
    return
  }

  recordResult({
    name: 'Wallet Detection',
    status: 'PASS',
    message: `Found ${availableWallets.length} wallet(s)`,
    details: availableWallets
  })

  // Test 3: Select primary wallet (prefer Lace)
  log.info('Test 3: Selecting wallet to test...')
  let primaryWallet: any = null
  let walletName = ''

  if (wallets.lace) {
    primaryWallet = wallets.lace
    walletName = 'Lace'
  } else if (wallets.nami) {
    primaryWallet = wallets.nami
    walletName = 'Nami'
  } else if (wallets.eternl) {
    primaryWallet = wallets.eternl
    walletName = 'Eternl'
  } else {
    primaryWallet = availableWallets[0]
    walletName = availableWallets[0].name
  }

  recordResult({
    name: 'Wallet Selection',
    status: 'PASS',
    message: `Selected ${walletName} for testing`,
    details: {
      wallet: walletName,
      apiVersion: primaryWallet.apiVersion,
      name: primaryWallet.name
    }
  })

  // Test 4: Check if wallet is already enabled
  log.info('Test 4: Checking wallet connection status...')
  let walletApi: any = null

  try {
    walletApi = await primaryWallet.isEnabled()
    if (walletApi) {
      recordResult({
        name: 'Wallet Status',
        status: 'PASS',
        message: `${walletName} is already connected`,
        details: { note: 'Wallet was previously authorized' }
      })
    } else {
      recordResult({
        name: 'Wallet Status',
        status: 'WARN',
        message: `${walletName} not yet connected`,
        details: { note: 'Will request authorization in next step' }
      })
    }
  } catch (error) {
    recordResult({
      name: 'Wallet Status',
      status: 'WARN',
      message: 'Could not check connection status',
      details: { note: 'Wallet may need authorization' }
    })
  }

  // Test 5: Request wallet connection (enable)
  log.info('Test 5: Requesting wallet connection...')
  try {
    if (!walletApi) {
      log.info('   (A popup should appear - please approve it)')
      walletApi = await primaryWallet.enable()
    }

    recordResult({
      name: 'Wallet Enable',
      status: 'PASS',
      message: `Successfully connected to ${walletName}!`,
      details: {
        apiVersion: primaryWallet.apiVersion,
        note: 'User approved connection request'
      }
    })
  } catch (error: any) {
    recordResult({
      name: 'Wallet Enable',
      status: 'FAIL',
      message: `Failed to connect to ${walletName}`,
      details: {
        error: error.message,
        note: error.message.includes('user') 
          ? 'User rejected connection request' 
          : 'Wallet error - try refreshing the page'
      }
    })
    return
  }

  // Test 6: Get network ID
  log.info('Test 6: Getting network ID...')
  try {
    const networkId = await walletApi.getNetworkId()
    const networkName = networkId === 0 ? 'Testnet' : networkId === 1 ? 'Mainnet' : 'Unknown'
    
    recordResult({
      name: 'Network ID',
      status: networkId === 0 ? 'PASS' : 'WARN',
      message: `Connected to ${networkName} (ID: ${networkId})`,
      details: {
        networkId,
        expected: 'Testnet (0) for development',
        note: networkId === 1 ? '⚠️  WARNING: Connected to MAINNET!' : '✅ Correct network'
      }
    })
  } catch (error: any) {
    recordResult({
      name: 'Network ID',
      status: 'FAIL',
      message: 'Failed to get network ID',
      details: { error: error.message }
    })
  }

  // Test 7: Get wallet addresses
  log.info('Test 7: Retrieving wallet addresses...')
  try {
    const usedAddresses = await walletApi.getUsedAddresses()
    const unusedAddresses = await walletApi.getUnusedAddresses()
    const changeAddress = await walletApi.getChangeAddress()

    if (usedAddresses.length === 0 && unusedAddresses.length === 0) {
      recordResult({
        name: 'Wallet Addresses',
        status: 'WARN',
        message: 'No addresses found in wallet',
        details: {
          note: 'Wallet may be new or empty',
          solution: 'Generate addresses in your wallet app'
        }
      })
    } else {
      recordResult({
        name: 'Wallet Addresses',
        status: 'PASS',
        message: `Found ${usedAddresses.length} used and ${unusedAddresses.length} unused addresses`,
        details: {
          usedAddresses: usedAddresses.length,
          unusedAddresses: unusedAddresses.length,
          changeAddress: changeAddress ? 'Available' : 'None'
        }
      })
    }
  } catch (error: any) {
    recordResult({
      name: 'Wallet Addresses',
      status: 'FAIL',
      message: 'Failed to retrieve addresses',
      details: { error: error.message }
    })
  }

  // Test 8: Get UTXOs
  log.info('Test 8: Querying wallet UTXOs...')
  try {
    const utxos = await walletApi.getUtxos()
    
    if (!utxos || utxos.length === 0) {
      recordResult({
        name: 'Wallet UTXOs',
        status: 'WARN',
        message: 'No UTXOs found - wallet has no funds',
        details: {
          note: 'Need testnet ADA to create transactions',
          faucet: 'https://docs.cardano.org/cardano-testnets/tools/faucet/',
          solution: 'Request testnet ADA from faucet'
        }
      })
    } else {
      recordResult({
        name: 'Wallet UTXOs',
        status: 'PASS',
        message: `Found ${utxos.length} UTXOs in wallet`,
        details: {
          utxoCount: utxos.length,
          note: 'Wallet has funds - ready for transactions'
        }
      })
    }
  } catch (error: any) {
    recordResult({
      name: 'Wallet UTXOs',
      status: 'FAIL',
      message: 'Failed to query UTXOs',
      details: { error: error.message }
    })
  }

  // Test 9: Get balance
  log.info('Test 9: Checking wallet balance...')
  try {
    const balance = await walletApi.getBalance()
    
    recordResult({
      name: 'Wallet Balance',
      status: 'PASS',
      message: 'Successfully retrieved balance',
      details: {
        balance: balance,
        note: 'Balance in CBOR format'
      }
    })
  } catch (error: any) {
    recordResult({
      name: 'Wallet Balance',
      status: 'FAIL',
      message: 'Failed to get balance',
      details: { error: error.message }
    })
  }

  // Test 10: Test signTx capability (without actually signing)
  log.info('Test 10: Checking transaction signing capability...')
  if (typeof walletApi.signTx === 'function') {
    recordResult({
      name: 'Sign TX Capability',
      status: 'PASS',
      message: 'Wallet supports transaction signing',
      details: {
        method: 'signTx',
        note: 'Ready to sign transactions when needed'
      }
    })
  } else {
    recordResult({
      name: 'Sign TX Capability',
      status: 'FAIL',
      message: 'Wallet does not support signTx',
      details: {
        note: 'This wallet may not be CIP-30 compliant',
        solution: 'Try a different wallet (Lace, Nami, Eternl)'
      }
    })
  }

  // Test 11: Test submitTx capability
  log.info('Test 11: Checking transaction submission capability...')
  if (typeof walletApi.submitTx === 'function') {
    recordResult({
      name: 'Submit TX Capability',
      status: 'PASS',
      message: 'Wallet supports transaction submission',
      details: {
        method: 'submitTx',
        note: 'Can submit transactions directly through wallet'
      }
    })
  } else {
    recordResult({
      name: 'Submit TX Capability',
      status: 'WARN',
      message: 'Wallet does not support submitTx',
      details: {
        note: 'Will need to submit via backend (Blockfrost)',
        workaround: 'Use backend API for submission'
      }
    })
  }

  // Summary
  console.log('%c' + '='.repeat(60), 'color: #666666')
  console.log('%c📊 TEST SUMMARY', 'color: #ffffff; font-size: 16px; font-weight: bold')
  console.log('%c' + '='.repeat(60), 'color: #666666')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  const skipped = results.filter(r => r.status === 'SKIP').length

  log.success(`Passed: ${passed}`)
  if (failed > 0) log.error(`Failed: ${failed}`)
  if (warned > 0) log.warn(`Warnings: ${warned}`)
  if (skipped > 0) log.info(`Skipped: ${skipped}`)
  console.log(`%c📝 Total Tests: ${results.length}`, 'color: #ffffff')

  console.log('%c' + '='.repeat(60), 'color: #666666')

  if (failed === 0) {
    log.success('🎉 WALLET CONNECTION SUCCESSFUL!')
    console.log('%cWallet is properly connected and ready for transactions.', 'color: #00ff00')
    console.log(`%cWallet: ${walletName}`, 'color: #00aaff')
    console.log(`%cReady for: Transaction signing, NFT minting`, 'color: #00aaff')
  } else {
    log.error('⚠️  SOME TESTS FAILED')
    console.log('%cPlease fix the failed tests before proceeding.', 'color: #ffaa00')
    console.log('%cCheck your wallet installation and configuration.', 'color: #ffaa00')
  }

  console.log('%c' + '='.repeat(60), 'color: #666666')

  return results
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testWallet = testWalletConnection
  console.log('%c💡 Run: testWallet()', 'color: #00aaff; font-size: 14px')
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.cardano) {
  testWalletConnection()
}
