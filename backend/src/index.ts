import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env file explicitly before any other imports
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') })
console.log('📁 Dotenv config result:', result.error ? `Error: ${result.error.message}` : 'Loaded successfully')
console.log('🔑 BLOCKFROST_PROJECT_ID check:', process.env.BLOCKFROST_PROJECT_ID ? 'Present' : 'Missing')

import express from 'express'
import cors from 'cors'
import fusionRoutes from './routes/fusion.js'
import agentRoutes from './routes/agent.js'
import mintRoutes from './routes/mint.js'
import walletRoutes from './routes/wallet.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Agents Hub API is running' })
})

// Routes
app.use('/api', fusionRoutes)
app.use('/api', agentRoutes)
app.use('/api', mintRoutes)
app.use('/api/wallet', walletRoutes)

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Agents Hub backend running on http://localhost:${PORT}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`⛓️  Cardano Network: ${process.env.CARDANO_NETWORK || 'testnet'}`)
})

export default app
