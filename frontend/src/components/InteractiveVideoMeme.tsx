import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface InteractiveVideoMemeProps {
  videoSrc: string
  title?: string
  description?: string
}

const InteractiveVideoMeme = ({ videoSrc, title, description }: InteractiveVideoMemeProps) => {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [showIdleHint, setShowIdleHint] = useState(true)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration)
      setIsVideoReady(true)
    }

    const handleError = (e: ErrorEvent) => {
      console.error('❌ Video failed to load:', e)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    
    video.load()
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
    }
  }, [videoSrc])

  const handleMouseDown = () => {
    if (!isVideoReady || isCompleted) return
    setIsDragging(true)
    setShowIdleHint(false)
    
    // Clear idle timer when user starts interacting
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const progress = (x / rect.width) * 100

    setDragProgress(progress)
    
    // Play video proportionally to progress
    if (videoRef.current && videoDuration > 0) {
      const videoTime = (progress / 100) * videoDuration
      videoRef.current.currentTime = videoTime
    }

    // Auto-complete at 90%
    if (progress >= 90) {
      handleCompletion()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (dragProgress < 90) {
      setDragProgress(0)
      // Restart idle hint after 3 seconds of inactivity
      idleTimerRef.current = setTimeout(() => {
        setShowIdleHint(true)
      }, 3000)
    }
  }

  const handleTouchStart = () => {
    if (!isVideoReady || isCompleted) return
    setIsDragging(true)
    setShowIdleHint(false)
    
    // Clear idle timer when user starts interacting
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
    const progress = (x / rect.width) * 100

    setDragProgress(progress)
    
    // Play video proportionally to progress
    if (videoRef.current && videoDuration > 0) {
      const videoTime = (progress / 100) * videoDuration
      videoRef.current.currentTime = videoTime
    }

    // Auto-complete at 90%
    if (progress >= 90) {
      handleCompletion()
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (dragProgress < 90) {
      setDragProgress(0)
      // Restart idle hint after 3 seconds of inactivity
      idleTimerRef.current = setTimeout(() => {
        setShowIdleHint(true)
      }, 3000)
    }
  }

  const handleCompletion = () => {
    setIsCompleted(true)
    setIsDragging(false)
    setDragProgress(100)
    
    // Show feedback
    setFeedback('Entered successfully!')
    setShowFeedback(true)
  }

  // Handle redirect when feedback is shown
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showFeedback, navigate])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, dragProgress])

  return (
    <div className="interactive-video-meme">
      <div className="video-container">
        <video
          ref={videoRef}
          src={videoSrc}
          className="meme-video"
          preload="auto"
          playsInline
          muted
          crossOrigin="anonymous"
        >
          Your browser does not support the video tag.
        </video>
        
        {!isVideoReady && (
          <div className="video-placeholder">
            <div className="loading-spinner">🎬</div>
            <p>Loading video...</p>
          </div>
        )}
      </div>

      <div className="video-controls">
        {title && <h3 className="video-title">{title}</h3>}
        {description && <p className="video-description">{description}</p>}
        
        <div 
          ref={containerRef}
          className={`swipe-container ${isCompleted ? 'completed' : ''}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="swipe-track">
            <div 
              className="swipe-progress"
              style={{ width: `${dragProgress}%` }}
            />
          </div>
          
          <div
            ref={thumbRef}
            className={`swipe-thumb ${isDragging ? 'dragging' : ''} ${showIdleHint && !isCompleted ? 'idle-hint' : ''}`}
            style={{ left: `${dragProgress}%` }}
          >
            <span className="swipe-arrow">›</span>
          </div>

          <span className={`swipe-text ${dragProgress > 30 ? 'hide' : ''}`}>
            Swipe to Enter
          </span>
          
          {isCompleted && (
            <span className="swipe-complete">✓ Entered</span>
          )}
        </div>

        {showFeedback && (
          <div className="feedback-message">
            <p>{feedback}</p>
            <span className="feedback-subtext">Redirecting to Explore...</span>
          </div>
        )}
      </div>

      <style>{`
        .interactive-video-meme {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          max-width: 800px;
        }

        .video-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(0, 240, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 240, 255, 0.15);
        }

        .meme-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .video-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }

        .loading-spinner {
          font-size: 2.5rem;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .video-placeholder p {
          color: rgba(255, 255, 255, 0.8);
          margin-top: 0.75rem;
          font-size: 0.875rem;
        }

        .video-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .video-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #00F0FF;
          margin: 0;
          font-family: 'Space Mono', monospace;
        }

        .video-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
        }

        .swipe-container {
          position: relative;
          width: 100%;
          height: 56px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          overflow: hidden;
          cursor: grab;
          transition: all 0.3s ease;
        }

        .swipe-container:hover:not(.completed) {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(0, 240, 255, 0.2);
        }

        .swipe-container.completed {
          cursor: default;
          background: rgba(0, 240, 255, 0.1);
          border-color: rgba(0, 240, 255, 0.3);
        }

        .swipe-track {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
        }

        .swipe-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.08) 100%);
          border-radius: 12px;
          transition: width 0.05s linear;
        }

        .swipe-thumb {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #00F0FF 0%, #0099CC 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          transition: all 0.05s linear;
          box-shadow: 0 4px 12px rgba(0, 240, 255, 0.3);
          z-index: 10;
        }

        .swipe-thumb.dragging {
          box-shadow: 0 6px 20px rgba(0, 240, 255, 0.5);
        }

        .swipe-thumb.idle-hint {
          animation: idleHintPush 2s ease-in-out infinite;
        }

        @keyframes idleHintPush {
          0%, 100% {
            transform: translateY(-50%) translateX(0);
          }
          25% {
            transform: translateY(-50%) translateX(20px);
          }
          50% {
            transform: translateY(-50%) translateX(0);
          }
        }

        .swipe-arrow {
          font-size: 1.5rem;
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: slideArrow 1.2s ease-in-out infinite;
        }

        @keyframes slideArrow {
          0%, 100% {
            transform: translateX(0);
            opacity: 1;
          }
          50% {
            transform: translateX(4px);
            opacity: 0.7;
          }
        }

        .swipe-text {
          position: absolute;
          top: 50%;
          left: 70px;
          transform: translateY(-50%);
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
          white-space: nowrap;
          z-index: 5;
          transition: opacity 0.2s ease;
        }

        .swipe-text.hide {
          opacity: 0;
          pointer-events: none;
        }

        .swipe-complete {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.9rem;
          color: #00F0FF;
          font-weight: 600;
          z-index: 15;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .feedback-message {
          padding: 1rem;
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 12px;
          text-align: center;
          animation: slideUp 0.4s ease;
        }

        .feedback-message p {
          font-size: 1rem;
          color: #00F0FF;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .feedback-subtext {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .interactive-video-meme {
            gap: 1rem;
          }

          .video-title {
            font-size: 1rem;
          }

          .video-description {
            font-size: 0.8rem;
          }

          .swipe-container {
            height: 52px;
          }

          .swipe-thumb {
            width: 52px;
            height: 52px;
          }

          .swipe-arrow {
            font-size: 1.25rem;
          }

          .swipe-text {
            left: 65px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}

export default InteractiveVideoMeme
