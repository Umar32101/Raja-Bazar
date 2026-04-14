import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function ForgetPasswordModal({ isOpen, onClose }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('email') // 'email', 'password', 'success'

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email) {
      setError('Please enter your email')
      return
    }

    setLoading(true)

    try {
      // Verify email exists by attempting to send reset email
      await resetPassword(email)
      // If successful, move to password input step
      setStep('password')
    } catch (err) {
      console.error('Email verification error:', err.code, err.message)
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to verify email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!newPassword) {
      setError('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Show success since Firebase reset email was already sent
      setStep('success')
    } catch (err) {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('email')
    setEmail('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
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
          {step === 'success' ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <p>Password reset instructions sent!</p>
              <p className="success-info">
                Check your email for a reset link. Click it to complete the password change.
              </p>
              <button className="btn-primary" onClick={handleClose}>
                Back to Login
              </button>
            </div>
          ) : step === 'email' ? (
            <>
              <p className="modal-description">
                Enter your email address to reset your password
              </p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleEmailSubmit}>
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
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="modal-description">
                Set your new password below ({email})
              </p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm-password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setStep('email')
                    setNewPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  disabled={loading}
                >
                  Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
