import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import * as React from 'react'
import './App.css'
import NavigationBar from './components/NavigationBar'
import Dashboard from './components/Dashboard'
import CreateAgent from './components/CreateAgent'
import AgentDetail from './components/AgentDetail'
import BreedSelection from './components/BreedSelection'
import BreedScreen from './components/BreedScreen'
import ChildAgentView from './components/ChildAgentView'
import WalletTest from './components/WalletTest'
import MyAgents from './components/MyAgents'
import LandingPage from './components/LandingPage'
import { Agent } from './types'

function AppContent() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [selectedParents, setSelectedParents] = useState<[Agent | null, Agent | null]>([null, null])
  const [childAgent, setChildAgent] = useState<Agent | null>(null)
  const location = useLocation()
  
  // Determine if we're on a create page
  const isCreatePage = location.pathname.startsWith('/create') || location.pathname.startsWith('/breed')
  
  // Apply create-mode class to body element
  React.useEffect(() => {
    if (isCreatePage) {
      document.body.classList.add('create-mode')
    } else {
      document.body.classList.remove('create-mode')
    }
  }, [isCreatePage])

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address)
  }

  const handleWalletDisconnect = () => {
    setWalletAddress(null)
  }

  const handleStartBreeding = (parentA: Agent, parentB: Agent) => {
    setSelectedParents([parentA, parentB])
  }

  const handleFusionComplete = (child: Agent) => {
    setChildAgent(child)
  }

  const handleBackToDashboard = () => {
    setSelectedParents([null, null])
    setChildAgent(null)
  }

  return (
    <div className={`app ${isCreatePage ? 'create-mode' : ''}`}>
      <NavigationBar 
        walletAddress={walletAddress} 
        onConnect={handleWalletConnect}
        onDisconnect={handleWalletDisconnect}
      />

      <main className="app-main">
          <Routes>
            {/* Landing Page - Default route */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Dashboard - requires wallet */}
            <Route 
              path="/dashboard" 
              element={
                walletAddress ? (
                  <Dashboard 
                    walletAddress={walletAddress} 
                    onStartBreeding={handleStartBreeding}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Agent Detail */}
            <Route 
              path="/agent/:id" 
              element={<AgentDetail />} 
            />
            
            {/* Create Agent - requires wallet */}
            <Route 
              path="/create" 
              element={
                walletAddress ? (
                  <CreateAgent 
                    walletAddress={walletAddress}
                    onAgentCreated={(agent) => console.log('Agent created:', agent)}
                    onStartBreeding={handleStartBreeding}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Breed Selection - requires wallet */}
            <Route 
              path="/breed" 
              element={
                walletAddress ? (
                  !selectedParents[0] ? (
                    <BreedSelection 
                      walletAddress={walletAddress}
                      onStartBreeding={handleStartBreeding}
                    />
                  ) : (
                    selectedParents[0] && selectedParents[1] ? (
                      <BreedScreen 
                        parentA={selectedParents[0]}
                        parentB={selectedParents[1]}
                        walletAddress={walletAddress}
                        onFusionComplete={handleFusionComplete}
                        onBack={handleBackToDashboard}
                      />
                    ) : (
                      <Navigate to="/breed" replace />
                    )
                  )
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Child Agent View */}
            <Route 
              path="/child" 
              element={
                childAgent ? (
                  <ChildAgentView 
                    agent={childAgent}
                    onBack={handleBackToDashboard}
                  />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            
            {/* Wallet Test */}
            <Route path="/wallet-test" element={<WalletTest />} />
            
            {/* My Agents - requires wallet */}
            <Route 
              path="/my-agents" 
              element={
                walletAddress ? (
                  <MyAgents walletAddress={walletAddress} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Hackathon MVP • Cardano Testnet • 95% Owner / 5% Platform Split</p>
        </footer>
      </div>
    )
  }

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
