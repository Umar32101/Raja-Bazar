import React, { useEffect, useState } from 'react'
import {
  collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, where
} from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'

const PLANS = [
  { hours: 1,  label: '1 Hour',  price: 'Rs. 50',   color: '#5a7080' },
  { hours: 3,  label: '3 Hours', price: 'Rs. 120',  color: '#00e5ff' },
  { hours: 24, label: '24 Hours',price: 'Rs. 500',  color: '#a78bfa' },
  { hours: 72, label: '3 Days',  price: 'Rs. 1200', color: '#ffd700' },
]

function timeLeft(expiresAt) {
  if (!expiresAt) return 'Unknown'
  const ms = expiresAt.toMillis() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export default function PinnedPostsManager() {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadPins() }, [])

  async function loadPins() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'pinnedPosts'), orderBy('pinnedAt', 'desc')))
      setPins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {
      // Demo
      const now = Timestamp.now()
      setPins([
        { id: 'p1', postTitle: '32K POP Available', postId: 'post1', hours: 3, paidPlan: '3hr', expiresAt: { toMillis: () => Date.now() + 7200000 }, pinnedAt: null },
        { id: 'p2', postTitle: 'Need 600 UC', postId: 'post2', hours: 24, paidPlan: '24hr', expiresAt: { toMillis: () => Date.now() + 82000000 }, pinnedAt: null },
        { id: 'p3', postTitle: 'Conqueror Account', postId: 'post3', hours: 1, paidPlan: '1hr', expiresAt: { toMillis: () => Date.now() - 1000 }, pinnedAt: null },
      ])
    }
    setLoading(false)
  }

  async function removePin(id) {
    if (!window.confirm('Remove this pinned post?')) return
    try { await deleteDoc(doc(db, 'pinnedPosts', id)) } catch {}
    setPins(p => p.filter(x => x.id !== id))
    notify('Pin removed')
  }

  function notify(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const active = pins.filter(p => p.expiresAt?.toMillis() > Date.now())
  const expired = pins.filter(p => !p.expiresAt || p.expiresAt.toMillis() <= Date.now())

  const planRevenue = PLANS.reduce((acc, plan) => {
    const count = pins.filter(p => p.hours === plan.hours).length
    acc[plan.hours] = count
    return acc
  }, {})

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Pinned Ads</h1>
            <p style={styles.pageSub}>{active.length} active pins · {expired.length} expired</p>
          </div>
        </div>

        {msg && <div style={styles.toast}>{msg}</div>}

        {/* Plans overview */}
        <div style={styles.plansRow}>
          {PLANS.map(plan => (
            <div key={plan.hours} style={{ ...styles.planCard, borderColor: planRevenue[plan.hours] > 0 ? plan.color + '55' : '#1e2d3d' }}>
              <div style={{ ...styles.planPrice, color: plan.color }}>{plan.price}</div>
              <div style={styles.planLabel}>{plan.label}</div>
              <div style={{ ...styles.planCount, color: plan.color }}>
                {planRevenue[plan.hours] || 0} sold
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={styles.loader}>Loading pins…</div>
        ) : (
          <>
            {active.length > 0 && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>📌 Active Pins ({active.length})</h2>
                <div style={styles.pinsList}>
                  {active.map(pin => {
                    const plan = PLANS.find(p => p.hours === pin.hours) || PLANS[0]
                    const ms = pin.expiresAt?.toMillis() - Date.now()
                    const pct = Math.max(0, Math.min(100, (ms / (pin.hours * 3600000)) * 100))
                    return (
                      <div key={pin.id} style={styles.pinCard}>
                        <div style={{ ...styles.planStripe, background: plan.color }} />
                        <div style={styles.pinContent}>
                          <div style={styles.pinTop}>
                            <div>
                              <div style={styles.pinTitle}>{pin.postTitle}</div>
                              <div style={styles.pinMeta}>
                                Post ID: {pin.postId?.substring(0, 12)}…
                              </div>
                            </div>
                            <div style={styles.pinRight}>
                              <span style={{ ...styles.planBadge, color: plan.color, borderColor: plan.color + '55' }}>
                                {plan.label} · {plan.price}
                              </span>
                              <div style={{ ...styles.timeLeft, color: ms < 1800000 ? '#ff4444' : '#00ff88' }}>
                                ⏱ {timeLeft(pin.expiresAt)}
                              </div>
                            </div>
                          </div>
                          <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: pct + '%', background: plan.color }} />
                          </div>
                          <div style={styles.pinFooter}>
                            <span style={styles.pinDate}>
                              {pin.pinnedAt ? new Date(pin.pinnedAt.toMillis()).toLocaleString() : 'Recently pinned'}
                            </span>
                            <button style={styles.removeBtn} onClick={() => removePin(pin.id)}>
                              Remove Pin
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {expired.length > 0 && (
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: '#5a7080' }}>🕰 Expired Pins ({expired.length})</h2>
                <div style={styles.pinsList}>
                  {expired.map(pin => (
                    <div key={pin.id} style={{ ...styles.pinCard, opacity: 0.5 }}>
                      <div style={{ ...styles.planStripe, background: '#1e2d3d' }} />
                      <div style={styles.pinContent}>
                        <div style={styles.pinTop}>
                          <div>
                            <div style={styles.pinTitle}>{pin.postTitle}</div>
                            <div style={{ ...styles.timeLeft, color: '#ff4444' }}>⏱ Expired</div>
                          </div>
                          <button style={styles.removeBtn} onClick={() => removePin(pin.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pins.length === 0 && (
              <div style={styles.empty}>
                No pinned posts yet. Go to Posts Manager to pin a listing.
              </div>
            )}
          </>
        )}

        <div style={styles.helpNote}>
          💡 To pin a post, go to <strong>Posts Manager</strong> → find any post → click the 📌 pin button.
        </div>
      </div>
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff' }

const styles = {
  page: { maxWidth: '900px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  pageSub: { color: C.muted, fontSize: '0.88rem' },
  toast: { background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: C.accent, padding: '10px 18px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' },
  plansRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' },
  planCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '10px', padding: '18px', textAlign: 'center', transition: 'border-color 0.3s',
  },
  planPrice: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' },
  planLabel: { fontSize: '0.85rem', color: C.muted, marginBottom: '8px' },
  planCount: { fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', letterSpacing: '1px' },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  empty: { color: C.muted, padding: '60px 0', textAlign: 'center', fontSize: '1rem' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: C.text, marginBottom: '14px', letterSpacing: '1px' },
  pinsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  pinCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '10px', overflow: 'hidden', display: 'flex',
  },
  planStripe: { width: '4px', flexShrink: 0 },
  pinContent: { flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  pinTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  pinTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  pinMeta: { fontSize: '0.75rem', color: C.muted, fontFamily: "'Share Tech Mono', monospace" },
  pinRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  planBadge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
    border: '1px solid', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '1px',
  },
  timeLeft: { fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Share Tech Mono', monospace" },
  progressBar: { height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '2px', transition: 'width 0.5s ease' },
  pinFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pinDate: { fontSize: '0.75rem', color: C.muted },
  removeBtn: {
    padding: '6px 14px', borderRadius: '6px',
    border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)',
    color: '#ff4444', cursor: 'pointer', fontSize: '0.82rem',
  },
  helpNote: {
    marginTop: '24px', padding: '12px 18px',
    background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: '6px', fontSize: '0.83rem', color: '#5a8090',
  },
}
