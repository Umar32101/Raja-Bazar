import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ForgetPasswordModal } from '../components/ForgetPasswordModal'

export function LoginPage() {
  const { loginWithEmail, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgetPasswordModal, setShowForgetPasswordModal] = useState(false)

 const handleLogin = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    await loginWithEmail(email, password)
    navigate('/')
  } catch (err) {
    console.error('Login error:', err.code, err.message)
    
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      setError('Incorrect email or password')
    } else if (err.code === 'auth/user-not-found') {
      setError('No account found with this email')
    } else if (err.code === 'auth/invalid-email') {
      setError('Invalid email address')
    } else {
      setError('Something went wrong. Please try again.')
    }
  } finally {
    setLoading(false)
  }
}

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await login()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>⚔ Raja Bazar</h1>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group-footer">
              <a
                href="#"
                className="forgot-password-link"
                onClick={(e) => {
                  e.preventDefault()
                  setShowForgetPasswordModal(true)
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="btn-google" onClick={handleGoogleLogin} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Continue with Google
          </button>

          <p className="auth-footer">
            Don't have an account? <a href="/signup">Sign up here</a>
          </p>

          <p className="auth-info">
            💡 Safe and secure PUBG marketplace
          </p>
        </div>
      </div>

      <ForgetPasswordModal
        isOpen={showForgetPasswordModal}
        onClose={() => setShowForgetPasswordModal(false)}
      />
    </div>
  )
}
