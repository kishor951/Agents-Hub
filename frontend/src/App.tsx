import { useState } from 'react'
import './App.css'
import NavigationBar from './components/NavigationBar'
import Dashboard from './components/Dashboard'
import CreateAgent from './components/CreateAgent'
import AgentDetail from './components/AgentDetail'
import BreedScreen from './components/BreedScreen'
import ChildAgentView from './components/ChildAgentView'
import WalletTest from './components/WalletTest'
import { Agent } from './types'

type Screen = 'dashboard' | 'create' | 'agent-detail' | 'breed' | 'child' | 'wallet-test'

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [selectedParents, setSelectedParents] = useState<[Agent | null, Agent | null]>([null, null])
  const [childAgent, setChildAgent] = useState<Agent | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address)
  }

  const handleWalletDisconnect = () => {
    setWalletAddress(null)
  }

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setCurrentScreen('agent-detail')
  }

  const handleBackToMain = () => {
    setSelectedAgent(null)
    setCurrentScreen('dashboard')
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
      <NavigationBar 
        walletAddress={walletAddress} 
        onConnect={handleWalletConnect}
        onDisconnect={handleWalletDisconnect}
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />


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
                onViewAgent={handleViewAgent}
              />
            )}
            {currentScreen === 'agent-detail' && selectedAgent && (
              <AgentDetail
                agent={selectedAgent}
                onBack={handleBackToMain}
              />
            )}
            {currentScreen === 'create' && (
              <CreateAgent 
                walletAddress={walletAddress}
                onAgentCreated={() => {
                  setCurrentScreen('dashboard')
                }}
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
            {currentScreen === 'wallet-test' && (
              <WalletTest />
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
