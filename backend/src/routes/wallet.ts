import express from 'express'

const router = express.Router()

/**
 * POST /api/wallet/convert-address
 * Convert hex-encoded CBOR address to bech32 format
 */
router.post('/convert-address', async (req, res) => {
  try {
    const { hexAddress, paymentKeyHash, network } = req.body
    
    console.log('🔄 Converting address...')
    console.log('   Hex:', hexAddress?.substring(0, 40) + '...')
    console.log('   Payment key hash:', paymentKeyHash)
    console.log('   Network:', network)
    
    if (!hexAddress) {
      return res.status(400).json({ error: 'hexAddress is required' })
    }
    
    try {
      // Import CSL dynamically
      const CSL = await import('@emurgo/cardano-serialization-lib-nodejs')
      
      // Method 1: Try direct CBOR decoding
      const addressBytes = Buffer.from(hexAddress, 'hex')
      const addressObj = CSL.Address.from_bytes(addressBytes)
      const bech32Address = addressObj.to_bech32()
      
      console.log('✅ Converted to bech32:', bech32Address)
      
      return res.json({
        success: true,
        bech32Address,
        method: 'cbor-decode'
      })
    } catch (conversionError) {
      console.error('❌ Address conversion failed:', conversionError)
      throw conversionError
    }
  } catch (error) {
    console.error('❌ Address conversion error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Use Demo Mode for testing'
    })
  }
})

export default router
