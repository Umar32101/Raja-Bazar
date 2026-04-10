import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Navbar() {
  const { currentUser, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav>
      <a href="#hero" className="logo">
        ⚔ Raja <span>Bazar</span>
      </a>
      <ul className="nav-links">
        <li><a href="#hero">Home</a></li>
        <li><a href="#marketplace">Marketplace</a></li>
        <li><a href="#post-section">Post Ad</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
      </ul>
      <button className="auth-btn auth-btn-desktop" onClick={currentUser ? handleLogout : handleLogin}>
        {currentUser ? 'Logout' : 'Login'}
      </button>
      <button
        className="hamburger"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Menu"
      >
        <span></span><span></span><span></span>
      </button>

      {mobileMenuOpen && (
        <div className="mobile-menu open">
          <a href="#hero" onClick={closeMobileMenu}>Home</a>
          <a href="#marketplace" onClick={closeMobileMenu}>Marketplace</a>
          <a href="#post-section" onClick={closeMobileMenu}>Post Ad</a>
          <a href="#how-it-works" onClick={closeMobileMenu}>How It Works</a>
          <button
            className="auth-btn"
            onClick={() => {
              currentUser ? handleLogout() : handleLogin()
              closeMobileMenu()
            }}
            style={{ marginTop: '8px' }}
          >
            {currentUser ? 'Logout' : 'Login'}
          </button>
        </div>
      )}
    </nav>
  )
}

