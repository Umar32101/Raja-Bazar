import React, { useEffect, useMemo, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where
} from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'
import { useIsMobile } from '../hooks/useIsMobile'
import { extractNameFromEmail, formatDateTime } from '../utils/formatters'

const CATEGORY_COLORS = { POP: '#00e5ff', UC: '#a78bfa', Account: '#ffd700', Other: '#00ff88' }

export default function PostsManager() {
  const isMobile = useIsMobile()
  const [posts, setPosts] = useState([])
  const [reportsByPost, setReportsByPost] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pinModal, setPinModal] = useState(null)
  const [pinHours, setPinHours] = useState(1)
  const [pinning, setPinning] = useState(false)
  const [reportModal, setReportModal] = useState(null)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    const postsRef = query(collection(db, 'listings'), orderBy('timestamp', 'desc'))
    const postsUnsub = onSnapshot(postsRef, async (snap) => {
      try {
        const pinsSnap = await getDocs(collection(db, 'pinnedPosts'))
        const pinnedIds = new Set(
          pinsSnap.docs
            .filter(d => d.data().expiresAt?.toMillis?.() > Date.now())
            .map(d => d.data().postId)
        )

        setPosts(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          isPinned: pinnedIds.has(d.id),
          ownerName: extractNameFromEmail(d.data().poster_email || ''),
        })))
      } finally {
        setLoading(false)
      }
    }, () => setLoading(false))

    const reportsUnsub = onSnapshot(collection(db, 'reports'), (snap) => {
      const grouped = {}
      snap.docs.forEach(d => {
        const data = { id: d.id, ...d.data() }
        if (!data.postId) return
        if (!grouped[data.postId]) grouped[data.postId] = []
        grouped[data.postId].push(data)
      })
      setReportsByPost(grouped)
    })

    return () => {
      postsUnsub()
      reportsUnsub()
    }
  }, [])

  function notify(message) {
    setActionMsg(message)
    setTimeout(() => setActionMsg(''), 3000)
  }

  async function deletePost(id) {
    if (!window.confirm('Permanently delete this post?')) return
    try {
      await deleteDoc(doc(db, 'listings', id))
      notify('Post deleted')
    } catch (error) {
      console.error('Delete post error:', error)
      notify('Failed to delete post')
    }
  }

  async function toggleHide(post) {
    const hidden = !post.hidden
    try {
      await updateDoc(doc(db, 'listings', post.id), { hidden })
      notify(hidden ? 'Post hidden' : 'Post visible again')
    } catch (error) {
      console.error('Hide post error:', error)
      notify('Failed to update post visibility')
    }
  }

  async function pinPost() {
    if (!pinModal) return
    setPinning(true)
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + pinHours * 3600 * 1000))
    try {
      await addDoc(collection(db, 'pinnedPosts'), {
        postId: pinModal.id,
        postTitle: pinModal.title || pinModal.category,
        hours: pinHours,
        expiresAt,
        pinnedAt: Timestamp.now(),
        paidPlan: pinHours <= 1 ? '1hr' : pinHours <= 3 ? '3hr' : pinHours <= 24 ? '24hr' : '72hr',
      })
      notify(`Post pinned for ${pinHours} hour(s)`)
      setPinModal(null)
    } catch (error) {
      console.error('Pin post error:', error)
      notify('Failed to pin post')
    }
    setPinning(false)
  }

  const filtered = useMemo(() => posts.filter(p => {
    if (filter === 'sell' && p.type !== 'SELL') return false
    if (filter === 'need' && p.type !== 'NEED') return false
    if (filter === 'hidden' && !p.hidden) return false
    if (filter === 'pinned' && !p.isPinned) return false
    if (filter === 'reported' && !(reportsByPost[p.id]?.length > 0)) return false
    if (search) {
      const q = search.toLowerCase()
      return (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.poster_email || '').toLowerCase().includes(q)
    }
    return true
  }), [filter, posts, reportsByPost, search])

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Posts Manager</h1>
            <p style={styles.pageSub}>{posts.length} total listings · {Object.keys(reportsByPost).length} reported posts</p>
          </div>
        </div>

        {actionMsg && <div style={styles.toast}>{actionMsg}</div>}

        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {[
              { key: 'all', label: 'All' },
              { key: 'sell', label: 'Selling' },
              { key: 'need', label: 'Need' },
              { key: 'hidden', label: 'Hidden' },
              { key: 'pinned', label: 'Pinned' },
              { key: 'reported', label: 'Reported' },
            ].map(f => (
              <button key={f.key} style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <input style={styles.searchInput} placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={styles.loader}>Loading posts...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No posts found</div>
        ) : isMobile ? (
          <div style={styles.cardList}>
            {filtered.map(post => (
              <div key={post.id} style={styles.mobileCard}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.titleText}>{post.title || `${post.category} Listing`}</div>
                    <div style={styles.subText}>{post.ownerName} · {post.poster_email || '-'}</div>
                  </div>
                  <div style={styles.badges}>
                    <span style={{ ...styles.badge, color: CATEGORY_COLORS[post.category] || '#00e5ff' }}>{post.category}</span>
                    {post.isPinned && <span style={styles.badgeGold}>Pinned</span>}
                  </div>
                </div>
                <div style={styles.metaGrid}>
                  <span>Type: {post.type}</span>
                  <span>Price: {post.price}</span>
                  <span>Status: {post.hidden ? 'Hidden' : 'Visible'}</span>
                  <span>Reports: {reportsByPost[post.id]?.length || 0}</span>
                </div>
                <div style={styles.descText}>{post.description || 'No description provided.'}</div>
                <div style={styles.actionWrap}>
                  <button style={styles.actionSecondary} onClick={() => toggleHide(post)}>{post.hidden ? 'Show' : 'Hide'}</button>
                  {!post.isPinned && <button style={styles.actionSecondary} onClick={() => setPinModal(post)}>Pin</button>}
                  <button style={styles.actionSecondary} onClick={() => setReportModal(post)}>View Reports</button>
                  <button style={styles.actionDanger} onClick={() => deletePost(post.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span>Post</span>
              <span>Owner</span>
              <span>Type</span>
              <span>Price</span>
              <span>Status</span>
              <span>Reports</span>
              <span>Actions</span>
            </div>
            {filtered.map(post => (
              <div key={post.id} style={styles.tableRow}>
                <div>
                  <div style={styles.titleText}>{post.title || `${post.category} Listing`}</div>
                  <div style={styles.subText}>{post.category} · {formatDateTime(post.timestamp)}</div>
                </div>
                <div>
                  <div>{post.ownerName}</div>
                  <div style={styles.subText}>{post.poster_email || '-'}</div>
                </div>
                <span>{post.type}</span>
                <span>{post.price}</span>
                <span style={{ color: post.hidden ? '#ff4444' : '#00ff88' }}>{post.hidden ? 'Hidden' : 'Visible'}</span>
                <button style={styles.tableBtn} onClick={() => setReportModal(post)}>
                  {reportsByPost[post.id]?.length || 0} reports
                </button>
                <div style={styles.desktopActions}>
                  <button style={styles.tableBtn} onClick={() => toggleHide(post)}>{post.hidden ? 'Show' : 'Hide'}</button>
                  {!post.isPinned && <button style={styles.tableBtn} onClick={() => setPinModal(post)}>Pin</button>}
                  <button style={styles.tableBtnDanger} onClick={() => deletePost(post.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pinModal && (
        <div style={styles.modalOverlay} onClick={() => setPinModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Pin This Post</h2>
            <p style={styles.modalSub}>{pinModal.title || pinModal.category}</p>
            <div style={styles.planGrid}>
              {[1, 3, 24, 72].map(hours => (
                <button key={hours} style={{ ...styles.planCard, ...(pinHours === hours ? styles.planCardActive : {}) }} onClick={() => setPinHours(hours)}>
                  <div style={styles.planDuration}>{hours >= 24 ? `${hours / 24} Day${hours > 24 ? 's' : ''}` : `${hours} Hour${hours > 1 ? 's' : ''}`}</div>
                </button>
              ))}
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.modalCancel} onClick={() => setPinModal(null)}>Cancel</button>
              <button style={styles.modalConfirm} onClick={pinPost} disabled={pinning}>{pinning ? 'Pinning...' : 'Confirm Pin'}</button>
            </div>
          </div>
        </div>
      )}

      {reportModal && (
        <div style={styles.modalOverlay} onClick={() => setReportModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Reports for Post</h2>
            <p style={styles.modalSub}>{reportModal.title || reportModal.category}</p>
            {(reportsByPost[reportModal.id] || []).length === 0 ? (
              <div style={styles.emptyReports}>No reports found for this post.</div>
            ) : (
              <div style={styles.reportsList}>
                {reportsByPost[reportModal.id].map(report => (
                  <div key={report.id} style={styles.reportItem}>
                    <div style={styles.reportReason}>{report.reason}</div>
                    <div style={styles.subText}>{report.reportedBy || '-'} · {report.status || 'pending'}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={styles.modalBtns}>
              <button style={styles.modalCancel} onClick={() => setReportModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff', surface: '#0d1117' }

const styles = {
  page: { maxWidth: '1180px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  pageSub: { color: C.muted, fontSize: '0.88rem' },
  toast: { background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: C.accent, padding: '10px 18px', borderRadius: '6px', marginBottom: '16px' },
  toolbar: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' },
  filters: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', borderRadius: '100px', border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: 'pointer' },
  filterBtnActive: { borderColor: C.accent, color: C.accent, background: 'rgba(0,229,255,0.08)' },
  searchInput: { marginLeft: 'auto', padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, width: '240px' },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  empty: { color: C.muted, padding: '60px 0', textAlign: 'center' },
  table: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 80px 100px 90px 100px 210px', gap: '12px', padding: '8px 16px', color: C.muted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 80px 100px 90px 100px 210px', gap: '12px', padding: '14px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', alignItems: 'center' },
  titleText: { fontSize: '0.95rem', fontWeight: 600, color: C.text },
  subText: { fontSize: '0.76rem', color: C.muted, marginTop: '4px' },
  desktopActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tableBtn: { padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer' },
  tableBtnDanger: { padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)', color: '#ff4444', cursor: 'pointer' },
  cardList: { display: 'grid', gap: '12px' },
  mobileCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', gap: '10px' },
  badges: { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'flex-start' },
  badge: { fontSize: '0.75rem', fontWeight: 700 },
  badgeGold: { fontSize: '0.72rem', color: '#ffd700', fontWeight: 700 },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: C.muted, fontSize: '0.82rem' },
  descText: { color: C.text, fontSize: '0.88rem' },
  actionWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  actionSecondary: { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer' },
  actionDanger: { padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)', color: '#ff4444', cursor: 'pointer', gridColumn: '1 / -1' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' },
  modal: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '28px', maxWidth: '560px', width: '100%' },
  modalTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: C.text, marginBottom: '6px' },
  modalSub: { color: C.muted, marginBottom: '18px' },
  planGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  planCard: { padding: '16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', textAlign: 'center' },
  planCardActive: { borderColor: '#ffd700', background: 'rgba(255,215,0,0.08)' },
  planDuration: { fontWeight: 700 },
  modalBtns: { display: 'flex', gap: '10px', marginTop: '16px' },
  modalCancel: { flex: 1, padding: '11px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' },
  modalConfirm: { flex: 2, padding: '11px', borderRadius: '6px', border: 'none', background: '#ffd700', color: '#080c10', fontWeight: 700, cursor: 'pointer' },
  reportsList: { display: 'grid', gap: '10px' },
  reportItem: { padding: '12px', borderRadius: '8px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)' },
  reportReason: { fontWeight: 700, marginBottom: '4px' },
  emptyReports: { color: C.muted, padding: '20px 0' },
}
