/**
 * Blockfrost API Validation Test
 * 
 * This script validates the Blockfrost endpoint configuration and connectivity.
 * Run: npm run test:blockfrost
 */

import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO'
  message: string
  details?: any
}

const results: TestResult[] = []

function log(result: TestResult) {
  results.push(result)
  const emoji = {
    'PASS': '✅',
    'FAIL': '❌',
    'WARN': '⚠️',
    'INFO': 'ℹ️'
  }[result.status]
  
  console.log(`\n${emoji} ${result.test}`)
  console.log(`   ${result.message}`)
  if (result.details) {
    console.log(`   Details:`, JSON.stringify(result.details, null, 2))
  }
}

function getNetworkFromApiKey(apiKey: string): string {
  if (apiKey.startsWith('mainnet')) return 'mainnet'
  if (apiKey.startsWith('preprod')) return 'preprod'
  if (apiKey.startsWith('preview')) return 'preview'
  return 'unknown'
}

function getBlockfrostUrl(network: string): string {
  switch (network) {
    case 'mainnet': return 'https://cardano-mainnet.blockfrost.io/api/v0'
    case 'preprod': return 'https://cardano-preprod.blockfrost.io/api/v0'
    case 'preview': return 'https://cardano-preview.blockfrost.io/api/v0'
    default: return 'https://cardano-preprod.blockfrost.io/api/v0'
  }
}

async function validateBlockfrost() {
  console.log('🔍 BLOCKFROST VALIDATION TEST')
  console.log('=' .repeat(60))

  // Test 1: Check API Key Configuration
  const apiKey = process.env.BLOCKFROST_PROJECT_ID
  
  if (!apiKey) {
    log({
      test: 'API Key Configuration',
      status: 'FAIL',
      message: 'BLOCKFROST_PROJECT_ID not found in .env file'
    })
    return
  }

  log({
    test: 'API Key Configuration',
    status: 'PASS',
    message: `API key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
    details: { length: apiKey.length }
  })

  // Test 2: Detect Network
  const network = getNetworkFromApiKey(apiKey)
  const baseUrl = getBlockfrostUrl(network)
  
  log({
    test: 'Network Detection',
    status: 'INFO',
    message: `Detected network: ${network}`,
    details: { baseUrl }
  })

  // Test 3: Test API Connectivity (Get latest block)
  try {
    console.log('\n🌐 Testing API connectivity...')
    const response = await axios.get(`${baseUrl}/blocks/latest`, {
      headers: { 'project_id': apiKey },
      timeout: 10000
    })

    log({
      test: 'API Connectivity',
      status: 'PASS',
      message: 'Successfully connected to Blockfrost',
      details: {
        blockHeight: response.data.height,
        blockHash: response.data.hash,
        time: response.data.time
      }
    })
  } catch (error: any) {
    if (error.response?.status === 403) {
      log({
        test: 'API Connectivity',
        status: 'FAIL',
        message: 'Authentication failed - Invalid API key',
        details: { statusCode: 403 }
      })
      return
    } else if (error.code === 'ENOTFOUND') {
      log({
        test: 'API Connectivity',
        status: 'FAIL',
        message: 'Network error - Check internet connection',
        details: { error: error.message }
      })
      return
    } else {
      log({
        test: 'API Connectivity',
        status: 'FAIL',
        message: `Unexpected error: ${error.message}`,
        details: { error: error.response?.data || error.message }
      })
      return
    }
  }

  // Test 4: Test Account Info Endpoint
  try {
    console.log('\n📊 Testing account info endpoint...')
    const accountResponse = await axios.get(`${baseUrl}/accounts/stake_test1uqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhgm3v2`, {
      headers: { 'project_id': apiKey },
      timeout: 10000
    })

    log({
      test: 'Account Endpoint',
      status: 'PASS',
      message: 'Account info endpoint working',
      details: { controlled_amount: accountResponse.data.controlled_amount }
    })
  } catch (error: any) {
    // This is expected if the account doesn't exist
    if (error.response?.status === 404) {
      log({
        test: 'Account Endpoint',
        status: 'WARN',
        message: 'Account not found (expected for test account)',
        details: { note: 'This is normal - endpoint is working' }
      })
    } else {
      log({
        test: 'Account Endpoint',
        status: 'WARN',
        message: `Account endpoint error: ${error.message}`,
        details: error.response?.data
      })
    }
  }

  // Test 5: Test Transaction Submission Endpoint (without actual TX)
  console.log('\n📤 Checking transaction submission endpoint...')
  try {
    await axios.post(`${baseUrl}/tx/submit`, 'invalid_tx_data', {
      headers: { 
        'project_id': apiKey,
        'Content-Type': 'application/cbor'
      },
      timeout: 10000
    })
  } catch (error: any) {
    if (error.response?.status === 400) {
      // This is expected - we sent invalid data
      log({
        test: 'TX Submission Endpoint',
        status: 'PASS',
        message: 'Transaction submission endpoint accessible',
        details: { 
          note: 'Got expected 400 error for invalid transaction',
          errorMessage: error.response?.data?.message || 'Invalid transaction format'
        }
      })
    } else if (error.response?.status === 403) {
      log({
        test: 'TX Submission Endpoint',
        status: 'FAIL',
        message: 'Authentication error on submission endpoint',
        details: error.response?.data
      })
    } else {
      log({
        test: 'TX Submission Endpoint',
        status: 'WARN',
        message: `Unexpected response: ${error.message}`,
        details: error.response?.data
      })
    }
  }

  // Test 6: Get Account Usage Stats
  try {
    console.log('\n📈 Checking API usage limits...')
    const metricsResponse = await axios.get(`${baseUrl}/metrics`, {
      headers: { 'project_id': apiKey },
      timeout: 10000
    })

    const calls = metricsResponse.data
    log({
      test: 'API Usage Stats',
      status: 'INFO',
      message: 'Successfully retrieved API metrics',
      details: {
        calls_today: calls[0]?.calls || 'N/A',
        note: 'Free tier limit: 50,000 requests/day'
      }
    })
  } catch (error: any) {
    log({
      test: 'API Usage Stats',
      status: 'WARN',
      message: 'Could not retrieve metrics',
      details: { note: 'Not critical - endpoint may require paid plan' }
    })
  }

  // Test 7: Test Address UTXO Query (with known test address)
  const testAddress = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp'
  
  try {
    console.log('\n🔍 Testing address UTXO query...')
    const utxoResponse = await axios.get(`${baseUrl}/addresses/${testAddress}/utxos`, {
      headers: { 'project_id': apiKey },
      timeout: 10000
    })

    if (utxoResponse.data.length > 0) {
      log({
        test: 'Address UTXO Query',
        status: 'PASS',
        message: `Found ${utxoResponse.data.length} UTXOs at test address`,
        details: {
          address: `${testAddress.substring(0, 20)}...`,
          utxoCount: utxoResponse.data.length,
          note: 'This address has funds - can be used for testing'
        }
      })
    } else {
      log({
        test: 'Address UTXO Query',
        status: 'WARN',
        message: 'No UTXOs found at test address',
        details: {
          note: 'Address is empty - need to fund it from faucet',
          faucet: `https://docs.cardano.org/cardano-testnets/tools/faucet/`
        }
      })
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      log({
        test: 'Address UTXO Query',
        status: 'WARN',
        message: 'Test address not found on chain',
        details: {
          note: 'Address may need to receive first transaction',
          faucet: `https://docs.cardano.org/cardano-testnets/tools/faucet/`
        }
      })
    } else {
      log({
        test: 'Address UTXO Query',
        status: 'FAIL',
        message: `UTXO query failed: ${error.message}`,
        details: error.response?.data
      })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  const info = results.filter(r => r.status === 'INFO').length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warned}`)
  console.log(`ℹ️  Info: ${info}`)
  console.log(`📝 Total Tests: ${results.length}`)
  
  console.log('\n' + '='.repeat(60))
  
  if (failed === 0) {
    console.log('🎉 ALL CRITICAL TESTS PASSED!')
    console.log('\nBlockfrost is properly configured and ready for use.')
    console.log(`\nNetwork: ${network}`)
    console.log(`Ready for: Transaction submission, UTXO queries, NFT minting`)
  } else {
    console.log('⚠️  SOME TESTS FAILED')
    console.log('\nPlease fix the failed tests before proceeding.')
    console.log('Check your .env file and API key configuration.')
  }
  
  console.log('='.repeat(60))
}

// Run validation
validateBlockfrost().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
