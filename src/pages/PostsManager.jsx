import React, { useEffect, useState } from 'react'
import {
  collection, getDocs, deleteDoc, doc, updateDoc,
  query, orderBy, addDoc, Timestamp, getDoc
} from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'

const CATEGORY_COLORS = { POP: '#00e5ff', UC: '#a78bfa', Account: '#ffd700', Other: '#00ff88' }

export default function PostsManager() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pinModal, setPinModal] = useState(null) // post to pin
  const [pinHours, setPinHours] = useState(1)
  const [pinning, setPinning] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    setLoading(true)
    try {
      const q = query(collection(db, 'listings'), orderBy('timestamp', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Check which are pinned
      const pinsSnap = await getDocs(collection(db, 'pinnedPosts'))
      const pinnedIds = new Set(pinsSnap.docs.filter(d => d.data().expiresAt?.toMillis() > Date.now()).map(d => d.data().postId))
      setPosts(data.map(p => ({ ...p, isPinned: pinnedIds.has(p.id) })))
    } catch {
      // Demo data
      setPosts([
        { id: '1', type: 'SELL', category: 'POP', title: '32K POP Available', price: '500', description: 'Fast delivery, bulk available.', user_id: 'u1', timestamp: null, hidden: false, isPinned: false },
        { id: '2', type: 'NEED', category: 'UC', title: 'Need 600 UC', price: '1200', description: 'Looking for reliable seller.', user_id: 'u2', timestamp: null, hidden: false, isPinned: true },
        { id: '3', type: 'SELL', category: 'Account', title: 'Conqueror Account', price: '8000', description: 'Season 21 with rare outfits.', user_id: 'u3', timestamp: null, hidden: true, isPinned: false },
      ])
    }
    setLoading(false)
  }

  async function deletePost(id) {
    if (!window.confirm('Permanently delete this post?')) return
    try {
      await deleteDoc(doc(db, 'listings', id))
      setPosts(p => p.filter(x => x.id !== id))
      notify('Post deleted')
    } catch {
      setPosts(p => p.filter(x => x.id !== id))
      notify('Post deleted (demo)')
    }
  }

  async function toggleHide(post) {
    const newVal = !post.hidden
    try {
      await updateDoc(doc(db, 'listings', post.id), { hidden: newVal })
    } catch {}
    setPosts(p => p.map(x => x.id === post.id ? { ...x, hidden: newVal } : x))
    notify(newVal ? 'Post hidden from marketplace' : 'Post visible again')
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
      setPosts(p => p.map(x => x.id === pinModal.id ? { ...x, isPinned: true } : x))
      notify(`Post pinned for ${pinHours} hour(s)`)
      setPinModal(null)
    } catch {
      notify('Pinned (demo mode)')
      setPosts(p => p.map(x => x.id === pinModal.id ? { ...x, isPinned: true } : x))
      setPinModal(null)
    }
    setPinning(false)
  }

  function notify(msg) {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(''), 3000)
  }

  const filtered = posts.filter(p => {
    if (filter === 'sell' && p.type !== 'SELL') return false
    if (filter === 'need' && p.type !== 'NEED') return false
    if (filter === 'hidden' && !p.hidden) return false
    if (filter === 'pinned' && !p.isPinned) return false
    if (search) {
      const q = search.toLowerCase()
      return (p.title || '').toLowerCase().includes(q) ||
             (p.description || '').toLowerCase().includes(q) ||
             (p.category || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Posts Manager</h1>
            <p style={styles.pageSub}>{posts.length} total listings</p>
          </div>
        </div>

        {actionMsg && <div style={styles.toast}>{actionMsg}</div>}

        {/* Filters */}
        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {[
              { key: 'all', label: 'All' },
              { key: 'sell', label: '💰 Selling' },
              { key: 'need', label: '🛒 Need' },
              { key: 'hidden', label: '🙈 Hidden' },
              { key: 'pinned', label: '📌 Pinned' },
            ].map(f => (
              <button key={f.key}
                style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))}
          </div>
          <input
            style={styles.searchInput}
            placeholder="🔍 Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.loader}>Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No posts found</div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span>Title</span>
              <span>Type</span>
              <span>Category</span>
              <span>Price</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {filtered.map(post => (
              <div key={post.id} style={{ ...styles.tableRow, opacity: post.hidden ? 0.5 : 1 }}>
                <div style={styles.postTitle}>
                  {post.isPinned && <span style={styles.pinBadge}>📌</span>}
                  <div>
                    <div style={styles.titleText}>{post.title || post.category + ' Listing'}</div>
                    <div style={styles.descText}>{(post.description || '').substring(0, 60)}…</div>
                  </div>
                </div>
                <span style={{
                  ...styles.typeBadge,
                  background: post.type === 'SELL' ? 'rgba(0,255,136,0.12)' : 'rgba(255,123,0,0.12)',
                  color: post.type === 'SELL' ? '#00ff88' : '#ff7b00',
                  border: `1px solid ${post.type === 'SELL' ? 'rgba(0,255,136,0.3)' : 'rgba(255,123,0,0.3)'}`,
                }}>{post.type}</span>
                <span style={{ ...styles.catBadge, color: CATEGORY_COLORS[post.category] || '#00e5ff' }}>
                  {post.category}
                </span>
                <span style={styles.price}>{post.price} PKR</span>
                <span style={{ fontSize: '0.8rem', color: post.hidden ? '#ff4444' : '#00ff88' }}>
                  {post.hidden ? '🙈 Hidden' : '👁 Visible'}
                </span>
                <div style={styles.actions}>
                  <button style={styles.btnHide} onClick={() => toggleHide(post)} title={post.hidden ? 'Show' : 'Hide'}>
                    {post.hidden ? '👁' : '🙈'}
                  </button>
                  {!post.isPinned && (
                    <button style={styles.btnPin} onClick={() => setPinModal(post)} title="Pin this post">
                      📌
                    </button>
                  )}
                  <button style={styles.btnDelete} onClick={() => deletePost(post.id)} title="Delete">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pin Modal */}
      {pinModal && (
        <div style={styles.modalOverlay} onClick={() => setPinModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>📌 Pin This Post</h2>
            <p style={styles.modalSub}>"{pinModal.title || pinModal.category}"</p>
            <p style={{ color: '#5a7080', fontSize: '0.85rem', marginBottom: '20px' }}>
              Select how long to pin at the top of the marketplace:
            </p>
            <div style={styles.planGrid}>
              {[
                { hours: 1, label: '1 Hour', price: 'Rs. 50' },
                { hours: 3, label: '3 Hours', price: 'Rs. 120' },
                { hours: 24, label: '24 Hours', price: 'Rs. 500' },
                { hours: 72, label: '3 Days', price: 'Rs. 1200' },
              ].map(plan => (
                <button
                  key={plan.hours}
                  style={{ ...styles.planCard, ...(pinHours === plan.hours ? styles.planCardActive : {}) }}
                  onClick={() => setPinHours(plan.hours)}
                >
                  <div style={styles.planDuration}>{plan.label}</div>
                  <div style={styles.planPrice}>{plan.price}</div>
                </button>
              ))}
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.modalCancel} onClick={() => setPinModal(null)}>Cancel</button>
              <button style={styles.modalConfirm} onClick={pinPost} disabled={pinning}>
                {pinning ? 'Pinning…' : '📌 Confirm Pin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff', surface: '#0d1117' }

const styles = {
  page: { maxWidth: '1100px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, letterSpacing: '1px', color: C.text, marginBottom: '4px' },
  pageSub: { color: C.muted, fontSize: '0.88rem' },
  toast: {
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
    color: C.accent, padding: '10px 18px', borderRadius: '6px',
    marginBottom: '16px', fontSize: '0.9rem',
  },
  toolbar: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' },
  filters: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '6px 14px', borderRadius: '100px',
    border: `1px solid ${C.border}`, background: C.card,
    color: C.muted, fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  filterBtnActive: { borderColor: C.accent, color: C.accent, background: 'rgba(0,229,255,0.08)' },
  searchInput: {
    marginLeft: 'auto', padding: '7px 14px',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '6px', color: C.text,
    fontFamily: "'Exo 2', sans-serif", fontSize: '0.9rem',
    outline: 'none', width: '200px',
  },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  empty: { color: C.muted, padding: '60px 0', textAlign: 'center', fontSize: '1.1rem' },
  table: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tableHead: {
    display: 'grid', gridTemplateColumns: '2fr 80px 90px 100px 90px 120px',
    gap: '12px', padding: '8px 16px',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.7rem', letterSpacing: '2px', color: C.muted, textTransform: 'uppercase',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '2fr 80px 90px 100px 90px 120px',
    gap: '12px', padding: '14px 16px',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '8px', alignItems: 'center',
    transition: 'border-color 0.2s',
  },
  postTitle: { display: 'flex', alignItems: 'center', gap: '8px' },
  pinBadge: { fontSize: '1rem', flexShrink: 0 },
  titleText: { fontSize: '0.9rem', fontWeight: 600, color: C.text, marginBottom: '2px' },
  descText: { fontSize: '0.75rem', color: C.muted },
  typeBadge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
    fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '1px',
    textAlign: 'center',
  },
  catBadge: { fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Rajdhani', sans-serif" },
  price: { fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: '#ffd700' },
  actions: { display: 'flex', gap: '6px' },
  btnHide: {
    padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`,
    background: 'transparent', cursor: 'pointer', fontSize: '0.9rem',
    transition: 'background 0.2s',
  },
  btnPin: {
    padding: '6px 10px', borderRadius: '6px',
    border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.08)',
    cursor: 'pointer', fontSize: '0.9rem',
  },
  btnDelete: {
    padding: '6px 10px', borderRadius: '6px',
    border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)',
    cursor: 'pointer', fontSize: '0.9rem',
  },
  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: '20px',
  },
  modal: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '12px', padding: '36px', maxWidth: '480px', width: '100%',
  },
  modalTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1.5rem', fontWeight: 700, color: C.text, marginBottom: '6px',
  },
  modalSub: { color: C.accent, fontSize: '0.9rem', marginBottom: '12px' },
  planGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' },
  planCard: {
    padding: '16px', borderRadius: '8px',
    border: `1px solid ${C.border}`, background: C.surface,
    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
  },
  planCardActive: {
    borderColor: '#ffd700', background: 'rgba(255,215,0,0.08)',
  },
  planDuration: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  planPrice: { fontSize: '0.85rem', color: '#ffd700', fontWeight: 600 },
  modalBtns: { display: 'flex', gap: '10px' },
  modalCancel: {
    flex: 1, padding: '11px', borderRadius: '6px',
    border: `1px solid ${C.border}`, background: 'transparent',
    color: C.muted, fontFamily: "'Exo 2', sans-serif", cursor: 'pointer',
  },
  modalConfirm: {
    flex: 2, padding: '11px', borderRadius: '6px',
    border: 'none', background: '#ffd700', color: '#080c10',
    fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', letterSpacing: '1px',
  },
}
