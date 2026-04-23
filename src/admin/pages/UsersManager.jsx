import React, { useEffect, useState } from 'react'
import {
  collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where
} from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../components/AdminLayout'
import { useIsMobile } from '../hooks/useIsMobile'
import { extractNameFromEmail, shortUid } from '../utils/formatters'

const DEFAULT_POST_LIMIT = 3

function normalizeUser(user, postCount) {
  const derivedName = user.name || user.displayName || extractNameFromEmail(user.email)
  return {
    ...user,
    derivedName,
    userType: user.isPremium ? 'Premium' : 'Standard',
    postLimit: Number(user.postLimit) || DEFAULT_POST_LIMIT,
    restricted: Boolean(user.restricted || user.banned),
    postCount,
  }
}

export default function UsersManager() {
  const isMobile = useIsMobile()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let postsMap = {}
    const usersUnsub = onSnapshot(collection(db, 'users'), async (snap) => {
      const mapped = snap.docs.map(d => normalizeUser({ id: d.id, ...d.data() }, postsMap[d.id] || 0))
      setUsers(mapped)
      setLoading(false)
    }, async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const mapped = snap.docs.map(d => normalizeUser({ id: d.id, ...d.data() }, postsMap[d.id] || 0))
        setUsers(mapped)
      } catch {
        setUsers([])
      }
      setLoading(false)
    })

    const postsUnsub = onSnapshot(collection(db, 'listings'), (snap) => {
      postsMap = {}
      snap.docs.forEach(d => {
        const uid = d.data().user_id
        if (uid) postsMap[uid] = (postsMap[uid] || 0) + 1
      })
      setUsers(prev => prev.map(user => normalizeUser(user, postsMap[user.id] || 0)))
    })

    return () => {
      usersUnsub()
      postsUnsub()
    }
  }, [])

  function notify(message) {
    setMsg(message)
    setTimeout(() => setMsg(''), 3000)
  }

  async function updateUser(userId, data, message) {
    try {
      await setDoc(doc(db, 'users', userId), data, { merge: true })
      if (message) notify(message)
    } catch (error) {
      console.error('User update failed:', error)
      notify('Action failed')
    }
  }

  async function toggleRestriction(user) {
    const next = !user.restricted
    await updateUser(user.id, {
      restricted: next,
      banned: next,
      restrictionReason: next ? 'Restricted by admin' : '',
      updatedAt: new Date().toISOString(),
    }, next ? `${user.derivedName} restricted` : `${user.derivedName} unrestricted`)
  }

  async function togglePremium(user) {
    await updateUser(user.id, {
      isPremium: !user.isPremium,
      userType: !user.isPremium ? 'premium' : 'standard',
      updatedAt: new Date().toISOString(),
    }, !user.isPremium ? `${user.derivedName} upgraded to premium` : `${user.derivedName} set to standard`)
  }

  async function changePostLimit(user) {
    const nextValue = window.prompt(`Set post limit for ${user.derivedName}`, String(user.postLimit || DEFAULT_POST_LIMIT))
    if (nextValue === null) return
    const limit = Math.max(1, Number(nextValue) || DEFAULT_POST_LIMIT)
    await updateUser(user.id, {
      postLimit: limit,
      updatedAt: new Date().toISOString(),
    }, `${user.derivedName} post limit updated to ${limit}`)
  }

  async function deleteUserProfile(user) {
    if (!window.confirm(`Delete ${user.derivedName}'s user profile and all their posts?`)) return

    try {
      const listingsSnap = await getDocs(query(collection(db, 'listings'), where('user_id', '==', user.id)))
      await Promise.all(listingsSnap.docs.map(item => deleteDoc(doc(db, 'listings', item.id))))
      await deleteDoc(doc(db, 'users', user.id))
      notify(`${user.derivedName} profile deleted`)
    } catch (error) {
      console.error('Delete user failed:', error)
      notify('Failed to delete user')
    }
  }

  const filtered = users.filter(u => {
    if (filter === 'restricted' && !u.restricted) return false
    if (filter === 'premium' && !u.isPremium) return false
    if (filter === 'standard' && u.isPremium) return false
    if (search) {
      const q = search.toLowerCase()
      return u.derivedName.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
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
              {users.length} users · {users.filter(u => u.restricted).length} restricted · {users.filter(u => u.isPremium).length} premium
            </p>
          </div>
        </div>

        {msg && <div style={styles.toast}>{msg}</div>}

        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {[
              { key: 'all', label: 'All' },
              { key: 'premium', label: 'Premium' },
              { key: 'standard', label: 'Standard' },
              { key: 'restricted', label: 'Restricted' },
            ].map(f => (
              <button
                key={f.key}
                style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            style={styles.searchInput}
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.loader}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No users found</div>
        ) : isMobile ? (
          <div style={styles.cardList}>
            {filtered.map(user => (
              <div key={user.id} style={styles.mobileCard}>
                <div style={styles.userCell}>
                  <div style={styles.avatar}>{user.derivedName[0]}</div>
                  <div>
                    <div style={styles.userName}>{user.derivedName}</div>
                    <div style={styles.userId}>{shortUid(user.id)}</div>
                  </div>
                </div>
                <div style={styles.metaLine}>{user.email || '-'}</div>
                <div style={styles.metaGrid}>
                  <span>Posts: {user.postCount}</span>
                  <span>Type: {user.userType}</span>
                  <span>Limit: {user.postLimit}</span>
                  <span>Status: {user.restricted ? 'Restricted' : 'Open'}</span>
                </div>
                <div style={styles.actionWrap}>
                  <button style={styles.actionPrimary} onClick={() => toggleRestriction(user)}>
                    {user.restricted ? 'Unrestrict' : 'Restrict'}
                  </button>
                  <button style={styles.actionSecondary} onClick={() => togglePremium(user)}>
                    {user.isPremium ? 'Make Standard' : 'Upgrade Premium'}
                  </button>
                  <button style={styles.actionSecondary} onClick={() => changePostLimit(user)}>
                    Change Limit
                  </button>
                  <button style={styles.actionDanger} onClick={() => deleteUserProfile(user)}>
                    Delete User
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span>User</span>
              <span>Email</span>
              <span>Posts</span>
              <span>Type</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {filtered.map(user => (
              <div key={user.id} style={styles.tableRow}>
                <div style={styles.userCell}>
                  <div style={styles.avatar}>{user.derivedName[0]}</div>
                  <div>
                    <div style={styles.userName}>{user.derivedName}</div>
                    <div style={styles.userId}>uid: {shortUid(user.id)}</div>
                  </div>
                </div>
                <div style={styles.emailCell}>{user.email || '-'}</div>
                <div style={styles.postCount}>
                  <span style={styles.postNum}>{user.postCount}</span>
                  <span style={styles.postLabel}>limit {user.postLimit}</span>
                </div>
                <div style={styles.typeWrap}>
                  <span style={{ ...styles.typeBadge, color: user.isPremium ? '#ffd700' : '#00e5ff' }}>
                    {user.userType}
                  </span>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  background: user.restricted ? 'rgba(255,68,68,0.12)' : 'rgba(0,255,136,0.12)',
                  color: user.restricted ? '#ff4444' : '#00ff88',
                  border: `1px solid ${user.restricted ? 'rgba(255,68,68,0.3)' : 'rgba(0,255,136,0.3)'}`,
                }}>
                  {user.restricted ? 'Restricted' : 'Open'}
                </span>
                <div style={styles.desktopActions}>
                  <button style={styles.tableBtn} onClick={() => toggleRestriction(user)}>
                    {user.restricted ? 'Unrestrict' : 'Restrict'}
                  </button>
                  <button style={styles.tableBtn} onClick={() => togglePremium(user)}>
                    {user.isPremium ? 'Standard' : 'Premium'}
                  </button>
                  <button style={styles.tableBtn} onClick={() => changePostLimit(user)}>
                    Limit
                  </button>
                  <button style={styles.tableBtnDanger} onClick={() => deleteUserProfile(user)}>
                    Delete
                  </button>
                </div>
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
  page: { maxWidth: '1160px' },
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
  tableHead: { display: 'grid', gridTemplateColumns: '1.7fr 1.7fr 100px 100px 110px 260px', gap: '12px', padding: '8px 16px', color: C.muted, fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '1.7fr 1.7fr 100px 100px 110px 260px', gap: '12px', padding: '14px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', alignItems: 'center' },
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: '0.95rem', fontWeight: 600, color: C.text },
  userId: { fontSize: '0.72rem', color: C.muted },
  emailCell: { fontSize: '0.85rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis' },
  postCount: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  postNum: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: C.accent },
  postLabel: { fontSize: '0.72rem', color: C.muted },
  typeWrap: { display: 'flex', justifyContent: 'center' },
  typeBadge: { fontWeight: 700, fontSize: '0.85rem' },
  statusBadge: { display: 'inline-block', padding: '4px 10px', borderRadius: '100px', fontSize: '0.74rem', textAlign: 'center' },
  desktopActions: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tableBtn: { padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer' },
  tableBtnDanger: { padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)', color: '#ff4444', cursor: 'pointer' },
  cardList: { display: 'grid', gap: '12px' },
  mobileCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  metaLine: { color: C.text, fontSize: '0.88rem' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: C.muted, fontSize: '0.82rem' },
  actionWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  actionPrimary: { padding: '10px 12px', borderRadius: '8px', border: 'none', background: C.accent, color: '#080c10', fontWeight: 700, cursor: 'pointer' },
  actionSecondary: { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer' },
  actionDanger: { padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)', color: '#ff4444', cursor: 'pointer', gridColumn: '1 / -1' },
}
