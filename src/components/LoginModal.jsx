import React from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginModal({ isOpen, onClose }) {
  const { currentUser, login } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  if (!isOpen || currentUser) return null

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await login()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose}></div>

      {/* Modal */}
      <div className="login-modal">
        <div className="modal-header">
          <h2>Welcome to Raja Bazar</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <div className="mission-text">
            <p>Join the safest PUBG assets marketplace</p>
            <ul>
              <li>✓ Admin-verified transactions</li>
              <li>✓ 0% scam rate</li>
              <li>✓ Fast & secure deals</li>
            </ul>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="modal-footer-text">
            We never share your information with sellers
          </p>
        </div>
      </div>
    </>
  )
}
