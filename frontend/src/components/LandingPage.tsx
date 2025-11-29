import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const [currentMeme, setCurrentMeme] = useState(0)
  const navigate = useNavigate()

  const memes = [
    {
      image: '🤖',
      title: 'Welcome to Agents Hub',
      subtitle: 'Where AI Agents Meet Blockchain Magic',
      description: 'Fuse, mint, and collect unique AI agents on the Cardano blockchain'
    },
    {
      image: '🧬',
      title: 'Genetic Fusion',
      subtitle: 'Combine AI Personalities',
      description: 'Breed agents with unique skills and personalities through genetic algorithms'
    },
    {
      image: '💎',
      title: 'NFT Collection',
      subtitle: 'Own Your AI Creations',
      description: 'Mint your fused agents as NFTs and build your collection'
    }
  ]

  const nextMeme = () => {
    setCurrentMeme((prev) => (prev + 1) % memes.length)
  }

  const prevMeme = () => {
    setCurrentMeme((prev) => (prev - 1 + memes.length) % memes.length)
  }

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Agents Hub</h1>
          <p className="hero-subtitle">Fuse • Mint • Collect</p>
          <p className="hero-description">
            The ultimate platform for creating, breeding, and collecting AI agents on Cardano
          </p>

          <div className="cta-buttons">
            <button
              className="cta-primary"
              onClick={() => navigate('/dashboard')}
            >
              Explore Agents
            </button>
            <button
              className="cta-secondary"
              onClick={() => navigate('/create')}
            >
              Create Agent
            </button>
          </div>
        </div>

        <div className="meme-section">
          <div className="meme-container">
            <button className="meme-nav prev" onClick={prevMeme}>‹</button>

            <div className="meme-card">
              <div className="meme-emoji">
                {memes[currentMeme].image}
              </div>
              <h3 className="meme-title">{memes[currentMeme].title}</h3>
              <h4 className="meme-subtitle">{memes[currentMeme].subtitle}</h4>
              <p className="meme-description">{memes[currentMeme].description}</p>
            </div>

            <button className="meme-nav next" onClick={nextMeme}>›</button>
          </div>

          <div className="meme-indicators">
            {memes.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentMeme ? 'active' : ''}`}
                onClick={() => setCurrentMeme(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Create</h3>
            <p>Design your AI agent with unique personality, skills, and appearance</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔬</div>
            <h3>Fuse</h3>
            <p>Combine two agents through genetic algorithms to create offspring</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⛓️</div>
            <h3>Mint</h3>
            <p>Mint your creations as NFTs on the Cardano blockchain</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Collect</h3>
            <p>Build your collection and trade with other agent enthusiasts</p>
          </div>
        </div>
      </div>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0A0B10 0%, #1a1b23 50%, #0A0B10 100%);
          color: white;
          overflow-x: hidden;
        }

        .hero-section {
          display: flex;
          align-items: center;
          min-height: 80vh;
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          gap: 4rem;
        }

        .hero-content {
          flex: 1;
          text-align: left;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          font-family: 'Orbitron', sans-serif;
          background: linear-gradient(135deg, #00F0FF 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          font-weight: 600;
          color: #00F0FF;
          margin-bottom: 1rem;
          font-family: 'Space Mono', monospace;
        }

        .hero-description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 500px;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cta-primary, .cta-secondary {
          padding: 1rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1rem;
          font-family: 'Space Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .cta-primary {
          background: linear-gradient(135deg, #00F0FF 0%, #0099CC 100%);
          color: #0A0B10;
          box-shadow: 0 4px 20px rgba(0, 240, 255, 0.3);
        }

        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 240, 255, 0.5);
        }

        .cta-secondary {
          background: transparent;
          color: #00F0FF;
          border-color: #00F0FF;
        }

        .cta-secondary:hover {
          background: rgba(0, 240, 255, 0.1);
          transform: translateY(-2px);
        }

        .meme-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .meme-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .meme-nav {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .meme-nav:hover {
          background: rgba(0, 240, 255, 0.2);
          transform: scale(1.1);
        }

        .meme-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          min-width: 300px;
          transition: all 0.3s ease;
        }

        .meme-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 240, 255, 0.3);
          box-shadow: 0 10px 40px rgba(0, 240, 255, 0.2);
        }

        .meme-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .meme-title {
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Orbitron', sans-serif;
          color: #00F0FF;
          margin-bottom: 0.5rem;
        }

        .meme-subtitle {
          font-size: 1.125rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
          font-family: 'Space Mono', monospace;
        }

        .meme-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .meme-indicators {
          display: flex;
          gap: 0.5rem;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator.active {
          background: #00F0FF;
          transform: scale(1.2);
        }

        .features-section {
          padding: 4rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
          text-align: center;
        }

        .features-section h2 {
          font-size: 2.5rem;
          font-weight: 700;
          font-family: 'Orbitron', sans-serif;
          color: #00F0FF;
          margin-bottom: 3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 240, 255, 0.3);
          box-shadow: 0 10px 40px rgba(0, 240, 255, 0.2);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #00F0FF;
          margin-bottom: 1rem;
          font-family: 'Space Mono', monospace;
        }

        .feature-card p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            text-align: center;
            gap: 2rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.25rem;
          }

          .hero-description {
            font-size: 1rem;
          }

          .cta-buttons {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .meme-card {
            min-width: 250px;
          }
        }
      `}</style>
    </div>
  )
}

export default LandingPage