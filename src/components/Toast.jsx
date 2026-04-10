import React, { useEffect, useState } from 'react'

export function Toast({ message, type = 'success', duration = 3000, isVisible = false }) {
  const [visible, setVisible] = useState(isVisible)

  useEffect(() => {
    setVisible(isVisible)
    if (isVisible) {
      const timer = setTimeout(() => setVisible(false), duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration])

  return (
    <div className={`toast ${visible ? 'show' : ''} ${type}`}>
      {message}
    </div>
  )
}
