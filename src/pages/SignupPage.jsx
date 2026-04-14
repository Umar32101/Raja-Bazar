import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function SignupPage() {
  const { signup, loginWithEmail } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('92') // Pakistan default
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Country codes for quick selection
  const countryCodes = [
    { code: '92', country: 'Pakistan 🇵🇰', flag: '🇵🇰' },
    { code: '1', country: 'USA/Canada 🇺🇸', flag: '🇺🇸' },
    { code: '44', country: 'UK 🇬🇧', flag: '🇬🇧' },
    { code: '91', country: 'India 🇮🇳', flag: '🇮🇳' },
    { code: '971', country: 'UAE 🇦🇪', flag: '🇦🇪' },
    { code: '966', country: 'Saudi Arabia 🇸🇦', flag: '🇸🇦' },
  ]

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '') // Remove all non-digits
    
    // Format based on country code
    if (countryCode === '92') { // Pakistan format: XXX XXXXXXX or XXXXXXXXXX
      if (value.length > 0 && !value.startsWith('92')) {
        value = value.slice(-10) // Keep last 10 digits
      }
      if (value.length > 10) {
        value = value.slice(0, 10)
      }
    } else if (countryCode === '1') { // USA/Canada format
      if (value.length > 10) {
        value = value.slice(0, 10)
      }
    } else {
      if (value.length > 15) {
        value = value.slice(0, 15)
      }
    }
    
    setPhone(value)
  }

  const getFullPhoneNumber = () => {
    return `+${countryCode} ${phone}`
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    // Validate phone length based on country
    const phoneDigits = phone.replace(/\D/g, '').length
    if ((countryCode === '92' && phoneDigits !== 10) || 
        (countryCode !== '92' && phoneDigits < 7)) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const fullPhone = getFullPhoneNumber()
      // Store phone in localStorage temporarily until user profile is created
      const phoneData = { email, phone: fullPhone, createdAt: new Date().toISOString() }
      localStorage.setItem(`user_phone_${email}`, JSON.stringify(phoneData))
      
      await signup(email, password, fullPhone)
      // Auto-login after signup
      await loginWithEmail(email, password)
      navigate('/')
    } catch (err) {
      console.error('Signup error:', err.code, err.message)
      if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters')
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Please sign in')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password format')
      } else {
        setError(err.message || 'Failed to create account')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>⚔ Raja Bazar</h1>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join the safest PUBG marketplace</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">WhatsApp Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={loading}
                  style={{ 
                    flex: '0 0 120px',
                    background: 'rgba(0,229,255,.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 8px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {countryCodes.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} +{c.code}
                    </option>
                  ))}
                </select>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="tel"
                    id="phone"
                    placeholder={countryCode === '92' ? '300 1234567' : '2025551234'}
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={loading}
                    style={{ width: '100%' }}
                  />
                  {phone && (
                    <small style={{ display: 'block', marginTop: '4px', color: 'var(--accent)' }}>
                      {getFullPhoneNumber()}
                    </small>
                  )}
                </div>
              </div>
              <small>Your WhatsApp number for buyer contacts</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <small>Password must be at least 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <a href="/login">Sign in here</a>
          </p>

          <div className="auth-benefits">
            <h4>Benefits:</h4>
            <ul>
              <li>✓ Admin-verified transactions</li>
              <li>✓ 0% scam rate</li>
              <li>✓ Fast & secure deals</li>
              <li>✓ 24/7 support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
