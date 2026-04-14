import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export function SessionIndicator() {
  const { currentUser } = useAuth()
  const [sessionTime, setSessionTime] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      setSessionTime(0)
      return
    }

    // Track session duration
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setSessionTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [currentUser])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (!currentUser) return null

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 229, 255, 0.1)',
        border: '1px solid var(--accent)',
        borderRadius: '8px',
        padding: isVisible ? '12px 16px' : '8px 12px',
        fontSize: '12px',
        color: 'var(--accent)',
        fontWeight: '600',
        cursor: 'pointer',
        zIndex: 999,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        fontFamily: 'var(--font-body)',
      }}
      onClick={() => setIsVisible(!isVisible)}
      title="Click to show/hide session info"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--accent)', fontSize: '16px' }}>●</span>
        <span>LIVE SESSION</span>
      </div>
      
      {isVisible && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--accent)', fontSize: '11px' }}>
          <div>👤 {currentUser.email}</div>
          <div>⏱️ Online: {formatTime(sessionTime)}</div>
          <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.7 }}>
            💾 Data stored on YOUR PC only<br/>
            🔒 Not visible to other users
          </div>
        </div>
      )}
    </div>
  )
}
