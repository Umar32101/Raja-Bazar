import React from 'react'

export function useIsMobile(breakpoint = 900) {
  const getValue = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  }

  const [isMobile, setIsMobile] = React.useState(getValue)

  React.useEffect(() => {
    const handleResize = () => setIsMobile(getValue())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
