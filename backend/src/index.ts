import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fusionRoutes from './routes/fusion.js'
import agentRoutes from './routes/agent.js'
import mintRoutes from './routes/mint.js'

dotenv.config()

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
