import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdminAuth } from '../hooks/useAdminAuth'

export function Navbar() {
  const { currentUser, logout } = useAuth()
  const { adminData } = useAdminAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [logoutOnClose, setLogoutOnClose] = useState(() =>
    localStorage.getItem('logout_on_close') === 'true'
  )
  const navigate = useNavigate()

  const getUserName = () => {
    if (!currentUser?.email) return ''
    return currentUser.email.split('@')[0]
  }

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

  const handleAdminDashboard = () => {
    navigate('/admin/dashboard')
  }

  const handleLogoutOnCloseToggle = () => {
    const newValue = !logoutOnClose
    setLogoutOnClose(newValue)
    localStorage.setItem('logout_on_close', newValue.toString())
    if (window.showToast) {
      window.showToast(
        newValue ? 'You will be logged out when you close this tab' : 'You will stay logged in',
        'success'
      )
    }
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav>
      <a href="#hero" className="logo">
        Raja <span>Bazar</span>
      </a>
      <ul className="nav-links">
        <li><a href="#hero">Home</a></li>
        <li><a href="#marketplace">Marketplace</a></li>
        <li><a href="#post-section">Post Ad</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
      </ul>

      {currentUser && (
        <div className="user-section" style={{ position: 'relative' }}>
          <span
            className="user-greeting"
            onClick={() => setShowSettings(!showSettings)}
            style={{ cursor: 'pointer' }}
          >
            Welcome, <span className="username">{getUserName()}</span>
            {showSettings ? ' ▼' : ' ▶'}
          </span>

          {showSettings && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '8px',
              minWidth: '280px',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border)'
              }}>
                ACCOUNT SETTINGS
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px 4px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <input
                  type="checkbox"
                  checked={logoutOnClose}
                  onChange={handleLogoutOnCloseToggle}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px' }}>Logout when tab closes</span>
              </label>

              {adminData?.isadmin === true && (
                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleAdminDashboard}
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Admin Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {adminData?.isadmin === true && (
        <button className="auth-btn auth-btn-desktop" onClick={handleAdminDashboard}>
          Admin Dashboard
        </button>
      )}

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
          {currentUser && (
            <>
              <div className="mobile-user-info">
                Welcome, <span className="username">{getUserName()}</span>
              </div>

              {adminData?.isadmin === true && (
                <button
                  className="auth-btn"
                  onClick={() => {
                    handleAdminDashboard()
                    closeMobileMenu()
                  }}
                  style={{ marginBottom: '8px', width: '100%' }}
                >
                  Admin Dashboard
                </button>
              )}

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px',
                marginBottom: '8px',
                borderRadius: '4px',
                background: 'rgba(0,229,255,0.05)',
                fontSize: '13px'
              }}>
                <input
                  type="checkbox"
                  checked={logoutOnClose}
                  onChange={handleLogoutOnCloseToggle}
                  style={{ cursor: 'pointer' }}
                />
                Logout when tab closes
              </label>
            </>
          )}
          <button
            className="auth-btn"
            onClick={() => {
              currentUser ? handleLogout() : handleLogin()
              closeMobileMenu()
            }}
            style={{ marginTop: '8px', width: '100%' }}
          >
            {currentUser ? 'Logout' : 'Login'}
          </button>
        </div>
      )}
    </nav>
  )
}
