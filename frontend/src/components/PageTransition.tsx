import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const PageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [color, setColor] = useState<'cyan' | 'purple'>('cyan')
  const location = useLocation()
  const prevLocation = useRef<string>('')

  useEffect(() => {
    const currentPath = location.pathname
    const previousPath = prevLocation.current

    // Define paths
    const isExplore = currentPath === '/dashboard'
    const isCreate = currentPath === '/create' || currentPath === '/breed'
    const wasExplore = previousPath === '/dashboard'
    const wasCreate = previousPath === '/create' || previousPath === '/breed'
    const wasLanding = previousPath === '/' || previousPath === ''

    // Only animate on specific transitions
    let shouldAnimate = false
    let animationColor: 'cyan' | 'purple' = 'cyan'

    if (wasLanding && isExplore) {
      // Coming from landing page to dashboard (after meme swipe)
      shouldAnimate = true
      animationColor = 'cyan'
    } else if (wasExplore && isCreate) {
      // Going from explore to create page
      shouldAnimate = true
      animationColor = 'purple'
    } else if (wasCreate && isExplore) {
      // Going from create page to explore
      shouldAnimate = true
      animationColor = 'cyan'
    }

    if (shouldAnimate) {
      setColor(animationColor)
      setIsTransitioning(true)
      
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 1000)
      
      prevLocation.current = currentPath
      return () => clearTimeout(timer)
    }

    prevLocation.current = currentPath
  }, [location.pathname])

  if (!isTransitioning) return null

  const gradientColors = color === 'purple' 
    ? { start: '#8B5CF6', end: '#6D28D9', glow: 'rgba(139, 92, 246, 0.6)' }
    : { start: '#00F0FF', end: '#0099CC', glow: 'rgba(0, 240, 255, 0.6)' }

  return (
    <div className="page-transition-overlay">
      <div className="circle-animation" />
      
      <style>{`
        .page-transition-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .circle-animation {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${gradientColors.start} 0%, ${gradientColors.end} 100%);
          box-shadow: 0 0 60px ${gradientColors.glow},
                      0 0 120px ${gradientColors.glow},
                      inset 0 0 30px rgba(255, 255, 255, 0.3);
          animation: circleExpand 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes circleExpand {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(50) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(100) rotate(360deg);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .circle-animation {
            width: 30px;
            height: 30px;
          }
        }
      `}</style>
    </div>
  )
}

export default PageTransition
