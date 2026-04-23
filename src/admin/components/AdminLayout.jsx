import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/posts', label: 'Posts' },
  { to: '/admin/pinned', label: 'Pinned Ads' },
  { to: '/admin/deals', label: 'Deals' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout({ children }) {
  const { adminData, adminLogout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await adminLogout()
    navigate('/admin/login')
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logo}>RB</div>
          <div>
            <div style={styles.brandTitle}>Raja Bazar</div>
            <div style={styles.brandSub}>Admin Panel</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  ...styles.navLink,
                  ...(active ? styles.navLinkActive : {}),
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.adminCard}>
            <div style={styles.adminLabel}>Signed in as</div>
            <div style={styles.adminName}>{adminData?.name || adminData?.email || 'Admin'}</div>
          </div>
          <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>{children}</main>
    </div>
  )
}

const C = {
  bg: '#080c10',
  surface: '#0d1117',
  card: '#111820',
  border: '#1e2d3d',
  accent: '#00e5ff',
  text: '#e0e8f0',
  muted: '#5a7080',
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
  },
  sidebar: {
    borderRight: `1px solid ${C.border}`,
    background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`,
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'rgba(0,229,255,0.12)',
    border: '1px solid rgba(0,229,255,0.28)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: C.accent,
    fontWeight: 700,
    fontFamily: "'Rajdhani', sans-serif",
    letterSpacing: '1px',
  },
  brandTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1.3rem',
    fontWeight: 700,
  },
  brandSub: {
    color: C.muted,
    fontSize: '0.8rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  navLink: {
    textDecoration: 'none',
    color: C.muted,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: '10px',
    padding: '12px 14px',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.6px',
  },
  navLinkActive: {
    color: C.accent,
    borderColor: 'rgba(0,229,255,0.3)',
    background: 'rgba(0,229,255,0.08)',
  },
  sidebarFooter: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  adminCard: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: '10px',
    padding: '14px',
  },
  adminLabel: {
    color: C.muted,
    fontSize: '0.72rem',
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  adminName: {
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  logoutBtn: {
    background: 'rgba(255,68,68,0.1)',
    border: '1px solid rgba(255,68,68,0.3)',
    color: '#ff6b6b',
    borderRadius: '10px',
    padding: '11px 14px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  main: {
    padding: '32px',
    overflowX: 'auto',
  },
}
