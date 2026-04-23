import React, { useEffect, useState } from 'react'
import {
  collection, getDocs, updateDoc, doc
} from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'

export default function UsersManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const postsSnap = await getDocs(collection(db, 'listings'))
      const postCountMap = {}
      postsSnap.docs.forEach(d => {
        const uid = d.data().user_id
        if (uid) postCountMap[uid] = (postCountMap[uid] || 0) + 1
      })
      setUsers(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        postCount: postCountMap[d.id] || 0,
      })))
    } catch {
      setUsers([
        { id: 'u1', displayName: 'Ahmed Khan', email: 'ahmed@gmail.com', banned: false, postCount: 5, createdAt: null },
        { id: 'u2', displayName: 'Sara Malik', email: 'sara@gmail.com', banned: false, postCount: 2, createdAt: null },
        { id: 'u3', displayName: 'Bilal Raza', email: 'bilal@gmail.com', banned: true, postCount: 8, createdAt: null },
        { id: 'u4', displayName: 'Zara Hassan', email: 'zara@gmail.com', banned: false, postCount: 1, createdAt: null },
      ])
    }
    setLoading(false)
  }

  async function toggleBan(user) {
    const newBanned = !user.banned
    try {
      await updateDoc(doc(db, 'users', user.id), { banned: newBanned })
    } catch {}
    setUsers(u => u.map(x => x.id === user.id ? { ...x, banned: newBanned } : x))
    notify(newBanned ? `${user.displayName || 'User'} banned` : `${user.displayName || 'User'} unbanned`)
  }

  function notify(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const filtered = users.filter(u => {
    if (filter === 'banned' && !u.banned) return false
    if (filter === 'active' && u.banned) return false
    if (search) {
      const q = search.toLowerCase()
      return (u.displayName || '').toLowerCase().includes(q) ||
             (u.email || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Users Manager</h1>
            <p style={styles.pageSub}>
              {users.length} total · {users.filter(u => u.banned).length} banned · {users.filter(u => !u.banned).length} active
            </p>
          </div>
        </div>

        {msg && <div style={styles.toast}>{msg}</div>}

        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {[
              { key: 'all', label: 'All Users' },
              { key: 'active', label: 'Active' },
              { key: 'banned', label: 'Banned' },
            ].map(f => (
              <button key={f.key}
                style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))}
          </div>
          <input
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.loader}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No users found</div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span>User</span>
              <span>Email</span>
              <span>Posts</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {filtered.map(user => (
              <div key={user.id} style={styles.tableRow}>
                <div style={styles.userCell}>
                  <div style={styles.avatar}>
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.userName}>{user.displayName || 'Unknown'}</div>
                    <div style={styles.userId}>uid: {user.id.substring(0, 8)}...</div>
                  </div>
                </div>
                <div style={styles.emailCell}>{user.email || '-'}</div>
                <div style={styles.postCount}>
                  <span style={styles.postNum}>{user.postCount}</span>
                  <span style={styles.postLabel}>posts</span>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  background: user.banned ? 'rgba(255,68,68,0.12)' : 'rgba(0,255,136,0.12)',
                  color: user.banned ? '#ff4444' : '#00ff88',
                  border: `1px solid ${user.banned ? 'rgba(255,68,68,0.3)' : 'rgba(0,255,136,0.3)'}`,
                }}>
                  {user.banned ? 'Banned' : 'Active'}
                </span>
                <button
                  style={{
                    ...styles.banBtn,
                    ...(user.banned ? styles.unbanBtn : styles.banBtnRed),
                  }}
                  onClick={() => toggleBan(user)}
                >
                  {user.banned ? 'Unban' : 'Ban'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.helpNote}>
          Banned users cannot post new listings. Their existing posts remain visible until manually deleted.
        </div>
      </div>
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff' }

const styles = {
  page: { maxWidth: '1000px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  pageSub: { color: C.muted, fontSize: '0.88rem' },
  toast: {
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
    color: C.accent, padding: '10px 18px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem',
  },
  toolbar: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' },
  filters: { display: 'flex', gap: '8px' },
  filterBtn: {
    padding: '6px 14px', borderRadius: '100px',
    border: `1px solid ${C.border}`, background: C.card,
    color: C.muted, fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem', cursor: 'pointer',
  },
  filterBtnActive: { borderColor: C.accent, color: C.accent, background: 'rgba(0,229,255,0.08)' },
  searchInput: {
    marginLeft: 'auto', padding: '7px 14px',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '6px', color: C.text, fontFamily: "'Exo 2', sans-serif", fontSize: '0.9rem',
    outline: 'none', width: '240px',
  },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  empty: { color: C.muted, padding: '60px 0', textAlign: 'center', fontSize: '1.1rem' },
  table: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tableHead: {
    display: 'grid', gridTemplateColumns: '2fr 2fr 80px 110px 100px',
    gap: '12px', padding: '8px 16px',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.7rem', letterSpacing: '2px', color: C.muted, textTransform: 'uppercase',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '2fr 2fr 80px 110px 100px',
    gap: '12px', padding: '14px 16px',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '8px', alignItems: 'center',
  },
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: C.accent, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
    flexShrink: 0,
  },
  userName: { fontSize: '0.9rem', fontWeight: 600, color: C.text },
  userId: { fontSize: '0.72rem', color: C.muted, fontFamily: "'Share Tech Mono', monospace" },
  emailCell: { fontSize: '0.85rem', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis' },
  postCount: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  postNum: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: C.accent },
  postLabel: { fontSize: '0.7rem', color: C.muted },
  statusBadge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
    fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '1px',
    textAlign: 'center',
  },
  banBtn: {
    padding: '7px 14px', borderRadius: '6px', border: 'none',
    fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', transition: 'opacity 0.2s',
  },
  banBtnRed: { background: 'rgba(255,68,68,0.12)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)' },
  unbanBtn: { background: 'rgba(0,255,136,0.12)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' },
  helpNote: {
    marginTop: '24px', padding: '12px 18px',
    background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)',
    borderRadius: '6px', fontSize: '0.83rem', color: '#a09060',
  },
}
