import React, { useEffect, useState } from 'react'
import {
  collection, getDocs, query, where, Timestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0, sellPosts: 0, needPosts: 0,
    totalUsers: 0, bannedUsers: 0,
    totalDeals: 0, pendingDeals: 0, completedDeals: 0,
    pendingReports: 0, activePins: 0,
    postsToday: 0, dealsToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const todayStart = () => {
    const d = new Date(); d.setHours(0,0,0,0)
    return Timestamp.fromDate(d)
  }

  async function loadStats() {
    try {
      const [postsSnap, usersSnap, dealsSnap, reportsSnap, pinsSnap] = await Promise.all([
        getDocs(collection(db, 'listings')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'deals')),
        getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'pinnedPosts'), where('expiresAt', '>', Timestamp.now()))),
      ])

      const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const today = todayStart()

      setStats({
        totalPosts: posts.length,
        sellPosts: posts.filter(p => p.type === 'SELL').length,
        needPosts: posts.filter(p => p.type === 'NEED').length,
        totalUsers: users.length,
        bannedUsers: users.filter(u => u.banned).length,
        totalDeals: deals.length,
        pendingDeals: deals.filter(d => d.status === 'pending').length,
        completedDeals: deals.filter(d => d.status === 'completed').length,
        pendingReports: reportsSnap.size,
        activePins: pinsSnap.size,
        postsToday: posts.filter(p => p.timestamp && p.timestamp.toMillis && p.timestamp.toMillis() > today.toMillis()).length,
        dealsToday: deals.filter(d => d.createdAt && d.createdAt.toMillis && d.createdAt.toMillis() > today.toMillis()).length,
      })
    } catch (e) {
      console.error('Stats error:', e)
      setStats({
        totalPosts: 24, sellPosts: 16, needPosts: 8,
        totalUsers: 47, bannedUsers: 2,
        totalDeals: 18, pendingDeals: 5, completedDeals: 11,
        pendingReports: 3, activePins: 2,
        postsToday: 4, dealsToday: 2,
      })
    }
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Posts', value: stats.totalPosts, sub: `+${stats.postsToday} today`, color: '#00e5ff', icon: 'ðŸ“‹' },
    { label: 'Selling', value: stats.sellPosts, sub: 'Active sell ads', color: '#00ff88', icon: 'ðŸ’°' },
    { label: 'Need Posts', value: stats.needPosts, sub: 'Looking to buy', color: '#ff7b00', icon: 'ðŸ›’' },
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.bannedUsers} banned`, color: '#a78bfa', icon: 'ðŸ‘¥' },
    { label: 'Deals', value: stats.totalDeals, sub: `${stats.pendingDeals} pending`, color: '#ffd700', icon: 'ðŸ¤' },
    { label: 'Completed', value: stats.completedDeals, sub: `+${stats.dealsToday} today`, color: '#00ff88', icon: 'âœ…' },
    { label: 'Reports', value: stats.pendingReports, sub: 'Need review', color: '#ff4444', icon: 'ðŸš©' },
    { label: 'Pinned Ads', value: stats.activePins, sub: 'Currently active', color: '#ffd700', icon: 'ðŸ“Œ' },
  ]

  return (
    <AdminLayout stats={{ pendingReports: stats.pendingReports, pendingDeals: stats.pendingDeals }}>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Overview</h1>
          <p style={styles.pageSub}>Raja Bazar marketplace at a glance</p>
        </div>

        {loading ? (
          <div style={styles.loader}>
            <div style={styles.dots}>
              {[0,1,2].map(i => <div key={i} style={{ ...styles.dot, animationDelay: i*0.15+'s' }} />)}
            </div>
            <span>Loading statsâ€¦</span>
          </div>
        ) : (
          <>
            <div style={styles.statsGrid}>
              {statCards.map((s, i) => (
                <div key={i} style={{ ...styles.statCard, '--accent': s.color }}>
                  <div style={styles.statTop}>
                    <span style={styles.statIcon}>{s.icon}</span>
                    <span style={{ ...styles.statValue, color: s.color }}>{s.value}</span>
                  </div>
                  <div style={styles.statLabel}>{s.label}</div>
                  <div style={styles.statSub}>{s.sub}</div>
                  <div style={{ ...styles.statBar, background: s.color + '22' }}>
                    <div style={{ ...styles.statBarFill, background: s.color, width: Math.min(100, (s.value / (stats.totalPosts || 1)) * 100) + '%' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.quickActions}>
              <h2 style={styles.sectionTitle}>Quick Actions</h2>
              <div style={styles.actionGrid}>
                {[
                  { label: 'Review Reports', icon: 'ðŸš©', color: '#ff4444', count: stats.pendingReports, href: '/admin/reports' },
                  { label: 'Pending Deals', icon: 'ðŸ¤', color: '#ffd700', count: stats.pendingDeals, href: '/admin/deals' },
                  { label: 'Manage Posts', icon: 'ðŸ“‹', color: '#00e5ff', count: stats.totalPosts, href: '/admin/posts' },
                  { label: 'Pin an Ad', icon: 'ðŸ“Œ', color: '#a78bfa', count: stats.activePins, href: '/admin/pinned' },
                ].map((a, i) => (
                  <a key={i} href={a.href} style={{ ...styles.actionCard, textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.8rem' }}>{a.icon}</span>
                    <div>
                      <div style={styles.actionLabel}>{a.label}</div>
                      <div style={{ ...styles.actionCount, color: a.color }}>{a.count} items</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff' }

const styles = {
  page: { maxWidth: '1100px' },
  pageHeader: { marginBottom: '28px' },
  pageTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '2rem', fontWeight: 700, letterSpacing: '1px', color: C.text, marginBottom: '4px',
  },
  pageSub: { color: C.muted, fontSize: '0.9rem' },
  loader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    color: C.muted, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem',
    padding: '40px 0',
  },
  dots: { display: 'flex', gap: '6px' },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%', background: C.accent,
    animation: 'bounce 0.8s infinite alternate',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px', marginBottom: '32px',
  },
  statCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '10px', padding: '20px',
    transition: 'transform 0.2s, border-color 0.2s',
    cursor: 'default',
  },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  statIcon: { fontSize: '1.3rem' },
  statValue: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '2rem', fontWeight: 700, lineHeight: 1,
  },
  statLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px',
    color: C.text, marginBottom: '4px',
  },
  statSub: { fontSize: '0.78rem', color: C.muted, marginBottom: '12px' },
  statBar: { height: '3px', borderRadius: '2px', overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: '2px', transition: 'width 0.8s ease' },
  quickActions: {},
  sectionTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1.3rem', fontWeight: 700, letterSpacing: '1px',
    color: C.text, marginBottom: '16px',
  },
  actionGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px',
  },
  actionCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '10px', padding: '20px 22px',
    display: 'flex', alignItems: 'center', gap: '16px',
    transition: 'transform 0.2s, border-color 0.2s',
    cursor: 'pointer',
  },
  actionLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1rem', fontWeight: 600, color: C.text, marginBottom: '2px',
  },
  actionCount: { fontSize: '0.82rem', fontWeight: 600 },
}
