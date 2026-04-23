import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const { adminLogin } = useAdminAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await adminLogin(email, password)
      navigate('/admin/dashboard')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>⚔</span>
          <span style={styles.logoText}>Raja <span style={styles.logoGold}>Bazar</span></span>
        </div>
        <div style={styles.badge}>ADMIN PORTAL</div>
        <h1 style={styles.title}>Control Center</h1>
        <p style={styles.sub}>Sign in with your admin credentials</p>

        {err && <div style={styles.errBox}>{err}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>EMAIL</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@rajabazar.com"
              required
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Verifying…' : '🔐 Login as Admin'}
          </button>
        </form>

        <p style={styles.hint}>
          Admin access only. Unauthorized attempts are logged.
        </p>
      </div>
    </div>
  )
}

const C = {
  bg: '#080c10', surface: '#0d1117', card: '#111820',
  border: '#1e2d3d', accent: '#00e5ff', gold: '#ffd700',
  danger: '#ff4444', text: '#e0e8f0', muted: '#5a7080',
}

const styles = {
  page: {
    minHeight: '100vh', background: C.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Exo 2', sans-serif", padding: '20px',
    position: 'relative', overflow: 'hidden',
  },
  glow: {
    position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
    width: '600px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(0,229,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '12px', padding: '48px 40px',
    width: '100%', maxWidth: '420px',
    textAlign: 'center', position: 'relative', zIndex: 1,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', marginBottom: '16px',
    fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700,
    color: C.accent, letterSpacing: '2px',
  },
  logoIcon: { fontSize: '1.4rem' },
  logoText: { color: C.accent },
  logoGold: { color: C.gold },
  badge: {
    display: 'inline-block', padding: '3px 14px',
    border: `1px solid ${C.border}`, borderRadius: '100px',
    background: 'rgba(0,229,255,0.06)', color: C.accent,
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '20px',
  },
  title: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '2rem', fontWeight: 700, letterSpacing: '1px',
    color: C.text, marginBottom: '8px',
  },
  sub: { color: C.muted, fontSize: '0.9rem', marginBottom: '28px' },
  errBox: {
    background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
    color: C.danger, borderRadius: '6px', padding: '10px 16px',
    fontSize: '0.85rem', marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.7rem', letterSpacing: '2px', color: C.muted,
  },
  input: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: '6px', padding: '11px 14px',
    color: C.text, fontFamily: "'Exo 2', sans-serif", fontSize: '0.95rem',
    outline: 'none', width: '100%',
  },
  btn: {
    marginTop: '8px', padding: '13px',
    background: C.accent, color: C.bg,
    border: 'none', borderRadius: '6px',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1.05rem', fontWeight: 700, letterSpacing: '1px',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  hint: { marginTop: '20px', fontSize: '0.75rem', color: C.muted },
}
