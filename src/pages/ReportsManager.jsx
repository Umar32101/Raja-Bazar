import React, { useEffect, useState } from 'react'
import {
  collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'

const REASONS = ['Spam', 'Fake price', 'Scam', 'Inappropriate', 'Duplicate', 'Other']

export default function ReportsManager() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [msg, setMsg] = useState('')

  useEffect(() => { loadReports() }, [])

  async function loadReports() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')))
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {
      setReports([
        { id: 'r1', postId: 'p1', postTitle: '32K POP Available', reason: 'Spam', reportedBy: 'user@gmail.com', status: 'pending', createdAt: null },
        { id: 'r2', postId: 'p2', postTitle: 'Need 600 UC', reason: 'Fake price', reportedBy: 'buyer@gmail.com', status: 'pending', createdAt: null },
        { id: 'r3', postId: 'p3', postTitle: 'Conqueror Account', reason: 'Scam', reportedBy: 'player@gmail.com', status: 'resolved', createdAt: null },
      ])
    }
    setLoading(false)
  }

  async function resolveReport(id, action) {
    // action: 'dismiss' | 'delete_post'
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'resolved', action, resolvedAt: Timestamp.now() })
      if (action === 'delete_post') {
        const report = reports.find(r => r.id === id)
        if (report?.postId) {
          try { await deleteDoc(doc(db, 'listings', report.postId)) } catch {}
        }
      }
    } catch {}
    setReports(r => r.map(x => x.id === id ? { ...x, status: 'resolved', action } : x))
    notify(action === 'delete_post' ? 'Post deleted & report resolved' : 'Report dismissed')
  }

  function notify(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const filtered = reports.filter(r => filter === 'all' || r.status === filter)

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Reports</h1>
            <p style={styles.pageSub}>
              {reports.filter(r => r.status === 'pending').length} pending · {reports.filter(r => r.status === 'resolved').length} resolved
            </p>
          </div>
        </div>

        {msg && <div style={styles.toast}>{msg}</div>}

        <div style={styles.toolbar}>
          {[
            { key: 'pending', label: '⏳ Pending' },
            { key: 'resolved', label: '✅ Resolved' },
            { key: 'all', label: 'All' },
          ].map(f => (
            <button key={f.key}
              style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}
              onClick={() => setFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loader}>Loading reports…</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            {filter === 'pending' ? '🎉 No pending reports!' : 'No reports found'}
          </div>
        ) : (
          <div style={styles.reportsList}>
            {filtered.map(report => (
              <div key={report.id} style={{ ...styles.reportCard, opacity: report.status === 'resolved' ? 0.6 : 1 }}>
                <div style={styles.reportTop}>
                  <div>
                    <div style={styles.reportTitle}>"{report.postTitle}"</div>
                    <div style={styles.reportMeta}>
                      Post ID: {report.postId?.substring(0, 12)}… · Reported by: {report.reportedBy}
                    </div>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    background: report.status === 'pending' ? 'rgba(255,215,0,0.12)' : 'rgba(0,255,136,0.12)',
                    color: report.status === 'pending' ? '#ffd700' : '#00ff88',
                    border: `1px solid ${report.status === 'pending' ? 'rgba(255,215,0,0.3)' : 'rgba(0,255,136,0.3)'}`,
                  }}>
                    {report.status === 'pending' ? '⏳ Pending' : '✅ Resolved'}
                  </span>
                </div>

                <div style={styles.reasonWrap}>
                  <span style={styles.reasonLabel}>REASON</span>
                  <span style={styles.reasonTag}>{report.reason}</span>
                </div>

                {report.status === 'pending' && (
                  <div style={styles.reportActions}>
                    <button style={styles.btnDismiss} onClick={() => resolveReport(report.id, 'dismiss')}>
                      👁 Dismiss (Post is fine)
                    </button>
                    <button style={styles.btnDelete} onClick={() => resolveReport(report.id, 'delete_post')}>
                      🗑 Delete Post & Resolve
                    </button>
                  </div>
                )}

                {report.status === 'resolved' && (
                  <div style={styles.resolvedNote}>
                    ✅ {report.action === 'delete_post' ? 'Post was deleted' : 'Report was dismissed'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
  toolbar: { display: 'flex', gap: '8px', marginBottom: '20px' },
  filterBtn: {
    padding: '6px 16px', borderRadius: '100px',
    border: `1px solid ${C.border}`, background: C.card,
    color: C.muted, fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem', cursor: 'pointer',
  },
  filterBtnActive: { borderColor: C.accent, color: C.accent, background: 'rgba(0,229,255,0.08)' },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  empty: { color: C.muted, padding: '60px 0', textAlign: 'center', fontSize: '1.1rem' },
  reportsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  reportCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '10px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '12px',
    borderLeft: '3px solid #ff4444',
  },
  reportTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  reportTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  reportMeta: { fontSize: '0.78rem', color: C.muted, fontFamily: "'Share Tech Mono', monospace" },
  statusBadge: {
    display: 'inline-block', padding: '3px 12px', borderRadius: '100px',
    fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '1px', whiteSpace: 'nowrap',
  },
  reasonWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
  reasonLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: C.muted },
  reasonTag: {
    padding: '3px 12px', borderRadius: '100px',
    background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
    color: '#ff4444', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem',
  },
  reportActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  btnDismiss: {
    padding: '8px 18px', borderRadius: '6px',
    border: `1px solid ${C.border}`, background: 'transparent',
    color: C.muted, fontFamily: "'Exo 2', sans-serif", fontSize: '0.88rem', cursor: 'pointer',
  },
  btnDelete: {
    padding: '8px 18px', borderRadius: '6px',
    border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.1)',
    color: '#ff4444', fontFamily: "'Exo 2', sans-serif", fontSize: '0.88rem', cursor: 'pointer',
  },
  resolvedNote: { fontSize: '0.83rem', color: '#00ff88' },
}
