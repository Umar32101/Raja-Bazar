import React, { useEffect, useState } from 'react'
import { collection, getDocs, onSnapshot, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'
import { formatDateTime } from '../utils/formatters'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    totalUsers: 0,
    restrictedUsers: 0,
    premiumUsers: 0,
    pendingDeals: 0,
    completedDeals: 0,
    pendingReports: 0,
    activePins: 0,
  })
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCoreStats() {
      try {
        const [postsSnap, usersSnap, reportsSnap, pinsSnap] = await Promise.all([
          getDocs(collection(db, 'listings')),
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'pinnedPosts'), where('expiresAt', '>', Timestamp.now()))),
        ])

        if (cancelled) return

        const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        setStats(prev => ({
          ...prev,
          totalPosts: posts.length,
          activePosts: posts.filter(post => !post.hidden).length,
          totalUsers: users.length,
          restrictedUsers: users.filter(user => user.restricted || user.banned).length,
          premiumUsers: users.filter(user => user.isPremium).length,
          pendingReports: reportsSnap.size,
          activePins: pinsSnap.size,
        }))
      } catch (error) {
        console.error('Admin stats error:', error)
      }
      setLoading(false)
    }

    loadCoreStats()

    const dealsUnsub = onSnapshot(collection(db, 'deal_notifications'), (snap) => {
      if (cancelled) return
      const deals = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setStats(prev => ({
        ...prev,
        pendingDeals: deals.filter(deal => (deal.status || 'pending') === 'pending').length,
        completedDeals: deals.filter(deal => deal.status === 'completed').length,
      }))
    })

    const adminsUnsub = onSnapshot(collection(db, 'admins'), (snap) => {
      if (cancelled) return
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => {
      cancelled = true
      dealsUnsub()
      adminsUnsub()
    }
  }, [])

  const statCards = [
    { label: 'Posts', value: stats.totalPosts, sub: `${stats.activePosts} visible`, color: '#00e5ff' },
    { label: 'Users', value: stats.totalUsers, sub: `${stats.restrictedUsers} restricted`, color: '#00ff88' },
    { label: 'Premium Users', value: stats.premiumUsers, sub: 'Upgraded accounts', color: '#ffd700' },
    { label: 'Pending Deals', value: stats.pendingDeals, sub: 'Awaiting action', color: '#ffb020' },
    { label: 'Completed Deals', value: stats.completedDeals, sub: 'Closed safely', color: '#00ff88' },
    { label: 'Reports', value: stats.pendingReports, sub: 'Need review', color: '#ff4444' },
    { label: 'Pinned Ads', value: stats.activePins, sub: 'Currently active', color: '#a78bfa' },
  ]

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Admin Overview</h1>
          <p style={styles.pageSub}>Live operations view for users, deals, posts, reports, and admin handover.</p>
        </div>

        {loading ? (
          <div style={styles.loader}>Loading dashboard...</div>
        ) : (
          <>
            <div style={styles.statsGrid}>
              {statCards.map((card) => (
                <div key={card.label} style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
                  <div style={styles.statLabel}>{card.label}</div>
                  <div style={styles.statSub}>{card.sub}</div>
                </div>
              ))}
            </div>

            <div style={styles.sectionGrid}>
              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>Admin Shift Status</h2>
                <div style={styles.adminList}>
                  {admins.length === 0 ? (
                    <div style={styles.empty}>No admin records found</div>
                  ) : admins.map(admin => (
                    <div key={admin.id} style={styles.adminRow}>
                      <div>
                        <div style={styles.adminName}>{admin.name || admin.email || admin.id}</div>
                        <div style={styles.adminMeta}>{admin.role || 'admin'} · {admin.email || '-'}</div>
                      </div>
                      <div style={styles.statusWrap}>
                        <span style={{ ...styles.onlineDot, background: admin.onlinestatus ? '#00ff88' : '#5a7080' }} />
                        <span style={{ color: admin.onlinestatus ? '#00ff88' : '#9aa7b4' }}>
                          {admin.onlinestatus ? 'Online' : `Offline · ${formatDateTime(admin.lastSeenAt)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>Action Priorities</h2>
                <div style={styles.priorityList}>
                  <a href="/admin/deals" style={styles.priorityCard}>
                    <span style={{ color: '#ffb020' }}>{stats.pendingDeals}</span>
                    <span>Pending deal requests</span>
                  </a>
                  <a href="/admin/reports" style={styles.priorityCard}>
                    <span style={{ color: '#ff4444' }}>{stats.pendingReports}</span>
                    <span>Posts to moderate</span>
                  </a>
                  <a href="/admin/users" style={styles.priorityCard}>
                    <span style={{ color: '#ffd700' }}>{stats.premiumUsers}</span>
                    <span>Premium users active</span>
                  </a>
                  <a href="/admin/settings" style={styles.priorityCard}>
                    <span style={{ color: '#00e5ff' }}>Open</span>
                    <span>Global post limits & admin WhatsApp</span>
                  </a>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080' }

const styles = {
  page: { maxWidth: '1180px' },
  pageHeader: { marginBottom: '28px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700, color: C.text, marginBottom: '6px' },
  pageSub: { color: C.muted },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '26px' },
  statCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px' },
  statValue: { fontFamily: "'Rajdhani', sans-serif", fontSize: '2rem', fontWeight: 700, lineHeight: 1 },
  statLabel: { color: C.text, marginTop: '10px', fontWeight: 600 },
  statSub: { color: C.muted, marginTop: '4px', fontSize: '0.82rem' },
  sectionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' },
  panel: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' },
  sectionTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' },
  adminList: { display: 'grid', gap: '12px' },
  adminRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` },
  adminName: { fontWeight: 700 },
  adminMeta: { fontSize: '0.82rem', color: C.muted, marginTop: '3px' },
  statusWrap: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' },
  onlineDot: { width: '10px', height: '10px', borderRadius: '50%' },
  priorityList: { display: 'grid', gap: '10px' },
  priorityCard: { textDecoration: 'none', color: C.text, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' },
  empty: { color: C.muted },
}
