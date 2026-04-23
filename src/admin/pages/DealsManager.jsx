import React, { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, ADMIN_WHATSAPP } from '../../firebase'
import AdminLayout from '../components/AdminLayout'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { formatDateTime } from '../utils/formatters'

const STATUS_COLORS = {
  pending: { bg: 'rgba(255,215,0,0.12)', color: '#ffd700', border: 'rgba(255,215,0,0.3)' },
  accepted: { bg: 'rgba(0,229,255,0.12)', color: '#00e5ff', border: 'rgba(0,229,255,0.3)' },
  completed: { bg: 'rgba(0,255,136,0.12)', color: '#00ff88', border: 'rgba(0,255,136,0.3)' },
  rejected: { bg: 'rgba(255,68,68,0.12)', color: '#ff4444', border: 'rgba(255,68,68,0.3)' },
}

export default function DealsManager() {
  const { adminData } = useAdminAuth()
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const dealsRef = query(collection(db, 'deal_notifications'), orderBy('timestamp', 'desc'))
    const unsubscribe = onSnapshot(dealsRef, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsubscribe
  }, [])

  function notify(message) {
    setMsg(message)
    setTimeout(() => setMsg(''), 3000)
  }

  async function updateRequestStatus(request, status) {
    try {
      await updateDoc(doc(db, 'deal_notifications', request.id), {
        status,
        handledByAdminId: adminData?.uid || '',
        handledByAdminName: adminData?.name || adminData?.email || 'Admin',
        updatedAt: serverTimestamp(),
      })
      notify(`Deal ${status}`)
    } catch (error) {
      console.error('Deal update error:', error)
      notify('Failed to update deal')
    }
  }

  const filtered = useMemo(() => requests.filter(item => filter === 'all' || item.status === filter), [filter, requests])

  const waLink = (request, target) => {
    const phone = target === 'buyer' ? request.buyerPhone : request.sellerPhone || ADMIN_WHATSAPP
    const msgText = encodeURIComponent(
      `Raja Bazar Deal Update\n\nListing: ${request.listingTitle}\nBuyer: ${request.buyerName || request.buyerEmail}\nSeller: ${request.sellerName || request.sellerEmail}\nStatus: ${request.status || 'pending'}`
    )
    return `https://wa.me/${String(phone || ADMIN_WHATSAPP).replace(/\D/g, '')}?text=${msgText}`
  }

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Deal Requests</h1>
            <p style={styles.pageSub}>Real-time incoming deal requests, newest first.</p>
          </div>
        </div>

        {msg && <div style={styles.toast}>{msg}</div>}

        <div style={styles.summaryRow}>
          {['all', 'pending', 'accepted', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              style={{ ...styles.summaryCard, ...(filter === status ? styles.summaryCardActive : {}) }}
              onClick={() => setFilter(status)}
            >
              <span style={styles.summaryCount}>{status === 'all' ? requests.length : requests.filter(item => item.status === status).length}</span>
              <span style={styles.summaryLabel}>{status}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loader}>Loading deal requests...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No deal requests found</div>
        ) : (
          <div style={styles.dealsList}>
            {filtered.map(request => {
              const status = request.status || 'pending'
              const sc = STATUS_COLORS[status] || STATUS_COLORS.pending
              return (
                <div key={request.id} style={styles.dealCard}>
                  <div style={styles.dealTop}>
                    <div>
                      <div style={styles.dealItem}>{request.listingTitle || 'Untitled listing'}</div>
                      <div style={styles.subLine}>{request.dealType === 'admin' ? 'Admin-protected deal' : 'Direct deal request'} · {request.price || '-'}</div>
                    </div>
                    <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {status}
                    </span>
                  </div>

                  <div style={styles.peopleGrid}>
                    <div style={styles.personCard}>
                      <div style={styles.personLabel}>Buyer</div>
                      <div style={styles.personName}>{request.buyerName || request.buyerEmail || '-'}</div>
                      <div style={styles.personMeta}>{request.buyerEmail || '-'}</div>
                    </div>
                    <div style={styles.personCard}>
                      <div style={styles.personLabel}>Seller</div>
                      <div style={styles.personName}>{request.sellerName || request.sellerEmail || '-'}</div>
                      <div style={styles.personMeta}>{request.sellerEmail || '-'}</div>
                    </div>
                  </div>

                  <div style={styles.bottomRow}>
                    <div style={styles.metaBlock}>
                      <span>Requested: {formatDateTime(request.timestamp || request.createdAt)}</span>
                      <span>Handled by: {request.handledByAdminName || 'Unassigned'}</span>
                    </div>
                    <div style={styles.linkWrap}>
                      <a style={styles.linkBtn} href={waLink(request, 'seller')} target="_blank" rel="noopener noreferrer">Message Seller</a>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    {status !== 'accepted' && status !== 'completed' && (
                      <button style={styles.btnAccept} onClick={() => updateRequestStatus(request, 'accepted')}>Accept</button>
                    )}
                    {status !== 'rejected' && status !== 'completed' && (
                      <button style={styles.btnReject} onClick={() => updateRequestStatus(request, 'rejected')}>Reject</button>
                    )}
                    {status !== 'completed' && (
                      <button style={styles.btnComplete} onClick={() => updateRequestStatus(request, 'completed')}>Complete</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff' }

const styles = {
  page: { maxWidth: '1080px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  pageSub: { color: C.muted, fontSize: '0.88rem' },
  toast: { background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: C.accent, padding: '10px 18px', borderRadius: '6px', marginBottom: '18px' },
  summaryRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' },
  summaryCard: { padding: '10px 16px', borderRadius: '8px', background: C.card, color: C.muted, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' },
  summaryCardActive: { borderColor: C.accent, color: C.accent },
  summaryCount: { fontSize: '1.2rem', fontWeight: 700 },
  summaryLabel: { textTransform: 'capitalize', fontSize: '0.8rem' },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  empty: { color: C.muted, padding: '60px 0', textAlign: 'center' },
  dealsList: { display: 'grid', gap: '14px' },
  dealCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  dealTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  dealItem: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: C.text },
  subLine: { color: C.muted, fontSize: '0.82rem', marginTop: '4px' },
  statusBadge: { padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', textTransform: 'capitalize' },
  peopleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  personCard: { padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}` },
  personLabel: { color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' },
  personName: { fontSize: '0.98rem', fontWeight: 700, color: C.text },
  personMeta: { fontSize: '0.82rem', color: C.muted, marginTop: '4px' },
  bottomRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  metaBlock: { display: 'flex', flexDirection: 'column', gap: '4px', color: C.muted, fontSize: '0.8rem' },
  linkWrap: { display: 'flex', gap: '8px' },
  linkBtn: { padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25d366', textDecoration: 'none' },
  actionRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  btnAccept: { padding: '9px 14px', borderRadius: '8px', border: 'none', background: C.accent, color: '#080c10', fontWeight: 700, cursor: 'pointer' },
  btnReject: { padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)', color: '#ff4444', cursor: 'pointer' },
  btnComplete: { padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.08)', color: '#00ff88', cursor: 'pointer' },
}
