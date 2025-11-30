interface LogoProps {
    size?: number
    className?: string
    isCreateMode?: boolean
  }
  
  const Logo = ({ size = 40, className = '', isCreateMode = false }: LogoProps) => {
    const gradientId = isCreateMode ? 'logoGradientPurple' : 'logoGradientCyan'
    
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="logoGradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00F0FF', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0099CC', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="logoGradientPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6D28D9', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* USB Connector Icon */}
        <g transform="translate(40, 40)">
          {/* Top connector */}
          <rect x="45" y="0" width="30" height="20" fill={`url(#${gradientId})`} rx="4"/>
          <line x1="60" y1="20" x2="60" y2="45" stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round"/>
          
          {/* Connection symbol */}
          <circle cx="60" cy="60" r="15" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6"/>
          <line x1="60" y1="45" x2="60" y2="75" stroke={`url(#${gradientId})`} strokeWidth="6"/>
          <line x1="45" y1="60" x2="75" y2="60" stroke={`url(#${gradientId})`} strokeWidth="6"/>
          
          {/* Diagonal connector */}
          <line x1="50" y1="70" x2="20" y2="100" stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round"/>
          <line x1="70" y1="70" x2="100" y2="100" stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round"/>
          
          {/* Bottom connectors */}
          <rect x="0" y="100" width="30" height="20" fill={`url(#${gradientId})`} rx="4"/>
          <rect x="90" y="100" width="30" height="20" fill={`url(#${gradientId})`} rx="4"/>
        </g>
      </svg>
    )
  }
  
  export default Logo
  