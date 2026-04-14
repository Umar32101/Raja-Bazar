import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function ForgetPasswordModal({ isOpen, onClose }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSubmitted(true)
      setMessage('Password reset email sent! Check your inbox.')
      setEmail('')
    } catch (err) {
      console.error('Reset error:', err.code, err.message)
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setMessage('')
    setError('')
    setSubmitted(false)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reset Your Password</h2>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body">
          {!submitted ? (
            <>
              <p className="modal-description">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="reset-email">Email Address</label>
                  <input
                    type="email"
                    id="reset-email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !email}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <p>{message}</p>
              <p className="success-info">
                Follow the link in the email to reset your password. The link expires in 1 hour.
              </p>
              <button className="btn-primary" onClick={handleClose}>
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
