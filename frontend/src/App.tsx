import { useState } from 'react'
import './App.css'
import WalletConnect from './components/WalletConnect'
import Dashboard from './components/Dashboard'
import BreedScreen from './components/BreedScreen'
import ChildAgentView from './components/ChildAgentView'
import { Agent } from './types'

type Screen = 'dashboard' | 'breed' | 'child'

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [selectedParents, setSelectedParents] = useState<[Agent | null, Agent | null]>([null, null])
  const [childAgent, setChildAgent] = useState<Agent | null>(null)

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address)
  }

  const handleStartBreeding = (parentA: Agent, parentB: Agent) => {
    setSelectedParents([parentA, parentB])
    setCurrentScreen('breed')
  }

  const handleFusionComplete = (child: Agent) => {
    setChildAgent(child)
    setCurrentScreen('child')
  }

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard')
    setSelectedParents([null, null])
    setChildAgent(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧬 Agents Hub</h1>
        <p>Fuse AI Agents • Mint NFTs • Cardano Testnet</p>
        <WalletConnect onConnect={handleWalletConnect} />
      </header>

      <main className="app-main">
        {!walletAddress ? (
          <div className="connect-prompt">
            <h2>Connect Your Wallet</h2>
            <p>Please connect a Cardano wallet to start fusing agents</p>
          </div>
        ) : (
          <>
            {currentScreen === 'dashboard' && (
              <Dashboard 
                walletAddress={walletAddress} 
                onStartBreeding={handleStartBreeding}
              />
            )}
            {currentScreen === 'breed' && selectedParents[0] && selectedParents[1] && (
              <BreedScreen 
                parentA={selectedParents[0]}
                parentB={selectedParents[1]}
                walletAddress={walletAddress}
                onFusionComplete={handleFusionComplete}
                onBack={handleBackToDashboard}
              />
            )}
            {currentScreen === 'child' && childAgent && (
              <ChildAgentView 
                agent={childAgent}
                onBack={handleBackToDashboard}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Hackathon MVP • Cardano Testnet • 95% Owner / 5% Platform Split</p>
      </footer>
    </div>
  )
}

export default App
