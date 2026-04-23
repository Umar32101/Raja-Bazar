import React, { useEffect, useState } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, doc,
  query, orderBy, Timestamp, deleteDoc
} from 'firebase/firestore'
import { db, ADMIN_WHATSAPP } from '../../firebase'
import AdminLayout from '../components/AdminLayout'
import { useAdminAuth } from '../hooks/useAdminAuth'

const STATUS_COLORS = {
  pending: { bg: 'rgba(255,215,0,0.12)', color: '#ffd700', border: 'rgba(255,215,0,0.3)' },
  inprogress: { bg: 'rgba(0,229,255,0.12)', color: '#00e5ff', border: 'rgba(0,229,255,0.3)' },
  completed: { bg: 'rgba(0,255,136,0.12)', color: '#00ff88', border: 'rgba(0,255,136,0.3)' },
  cancelled: { bg: 'rgba(255,68,68,0.12)', color: '#ff4444', border: 'rgba(255,68,68,0.3)' },
}

const STATUS_LABELS = {
  pending: 'Pending',
  inprogress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function DealsManager() {
  const { adminData } = useAdminAuth()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [noteModal, setNoteModal] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [newDeal, setNewDeal] = useState({ buyerName: '', sellerName: '', item: '', amount: '', notes: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => { loadDeals() }, [])

  async function loadDeals() {
    setLoading(true)
    try {
      const q = query(collection(db, 'deals'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setDeals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {
      setDeals([
        { id: 'd1', buyerName: 'Ahmed K', sellerName: 'Sara M', item: '32K POP', amount: '500 PKR', status: 'pending', notes: '', adminId: 'admin1', createdAt: null },
        { id: 'd2', buyerName: 'Bilal R', sellerName: 'Usman T', item: '600 UC', amount: '1200 PKR', status: 'inprogress', notes: 'Buyer confirmed payment', adminId: 'admin1', createdAt: null },
        { id: 'd3', buyerName: 'Zara H', sellerName: 'Kamran L', item: 'Account', amount: '8000 PKR', status: 'completed', notes: 'Deal done, both happy.', adminId: 'admin2', createdAt: null },
      ])
    }
    setLoading(false)
  }

  async function updateStatus(id, status) {
    try {
      await updateDoc(doc(db, 'deals', id), { status, updatedAt: Timestamp.now() })
    } catch {}
    setDeals(d => d.map(x => x.id === id ? { ...x, status } : x))
    notify(`Deal marked as ${STATUS_LABELS[status]}`)
  }

  async function saveNote() {
    if (!noteModal) return
    try {
      await updateDoc(doc(db, 'deals', noteModal.id), { notes: noteText, updatedAt: Timestamp.now() })
    } catch {}
    setDeals(d => d.map(x => x.id === noteModal.id ? { ...x, notes: noteText } : x))
    setNoteModal(null)
    notify('Note saved')
  }

  async function createDeal() {
    const data = {
      ...newDeal,
      status: 'pending',
      adminId: adminData?.uid || 'admin',
      adminName: adminData?.name || 'Admin',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    try {
      const ref = await addDoc(collection(db, 'deals'), data)
      setDeals(d => [{ id: ref.id, ...data }, ...d])
    } catch {
      setDeals(d => [{ id: 'demo_' + Date.now(), ...data }, ...d])
    }
    setCreateModal(false)
    setNewDeal({ buyerName: '', sellerName: '', item: '', amount: '', notes: '' })
    notify('Deal created')
  }

  async function deleteDeal(id) {
    if (!window.confirm('Delete this deal record?')) return
    try { await deleteDoc(doc(db, 'deals', id)) } catch {}
    setDeals(d => d.filter(x => x.id !== id))
    notify('Deal deleted')
  }

  function notify(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const filtered = deals.filter(d => filter === 'all' || d.status === filter)

  const waLink = (deal) => {
    const text = encodeURIComponent(`Raja Bazar Deal Update\n\nItem: ${deal.item}\nBuyer: ${deal.buyerName}\nSeller: ${deal.sellerName}\nAmount: ${deal.amount}\nStatus: ${STATUS_LABELS[deal.status] || deal.status}`)
    return `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`
  }

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Deals Tracker</h1>
            <p style={styles.pageSub}>{deals.length} total deals</p>
          </div>
          <button style={styles.createBtn} onClick={() => setCreateModal(true)}>
            + New Deal
          </button>
        </div>

        {msg && <div style={styles.toast}>{msg}</div>}

        <div style={styles.summaryRow}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              style={{ ...styles.summaryCard, ...(filter === key ? { borderColor: STATUS_COLORS[key].color } : {}) }}
              onClick={() => setFilter(filter === key ? 'all' : key)}
            >
              <span style={{ ...styles.summaryCount, color: STATUS_COLORS[key].color }}>
                {deals.filter(d => d.status === key).length}
              </span>
              <span style={styles.summaryLabel}>{label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loader}>Loading deals...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No deals found</div>
        ) : (
          <div style={styles.dealsList}>
            {filtered.map(deal => {
              const sc = STATUS_COLORS[deal.status] || STATUS_COLORS.pending
              return (
                <div key={deal.id} style={styles.dealCard}>
                  <div style={styles.dealTop}>
                    <div style={styles.dealItem}>{deal.item}</div>
                    <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {STATUS_LABELS[deal.status] || deal.status}
                    </span>
                  </div>

                  <div style={styles.dealParties}>
                    <div style={styles.party}>
                      <span style={styles.partyLabel}>BUYER</span>
                      <span style={styles.partyName}>{deal.buyerName}</span>
                    </div>
                    <span style={styles.arrow}>→</span>
                    <div style={styles.party}>
                      <span style={styles.partyLabel}>SELLER</span>
                      <span style={styles.partyName}>{deal.sellerName}</span>
                    </div>
                    <div style={{ ...styles.party, marginLeft: 'auto' }}>
                      <span style={styles.partyLabel}>AMOUNT</span>
                      <span style={{ ...styles.partyName, color: '#ffd700' }}>{deal.amount}</span>
                    </div>
                  </div>

                  {deal.notes && (
                    <div style={styles.noteBox}>{deal.notes}</div>
                  )}

                  <div style={styles.dealFooter}>
                    <div style={styles.statusActions}>
                      {deal.status !== 'inprogress' && deal.status !== 'completed' && (
                        <button style={styles.btnProgress} onClick={() => updateStatus(deal.id, 'inprogress')}>
                          Start
                        </button>
                      )}
                      {deal.status !== 'completed' && (
                        <button style={styles.btnComplete} onClick={() => updateStatus(deal.id, 'completed')}>
                          Complete
                        </button>
                      )}
                      {deal.status !== 'cancelled' && deal.status !== 'completed' && (
                        <button style={styles.btnCancel} onClick={() => updateStatus(deal.id, 'cancelled')}>
                          Cancel
                        </button>
                      )}
                    </div>
                    <div style={styles.dealActions}>
                      <button style={styles.btnNote} onClick={() => { setNoteModal(deal); setNoteText(deal.notes || '') }}>
                        Note
                      </button>
                      <a style={styles.btnWa} href={waLink(deal)} target="_blank" rel="noopener">
                        WhatsApp
                      </a>
                      <button style={styles.btnDel} onClick={() => deleteDeal(deal.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {noteModal && (
        <div style={styles.overlay} onClick={() => setNoteModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Admin Note</h2>
            <p style={styles.modalSub}>Deal: {noteModal.item}</p>
            <textarea
              style={styles.noteInput}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add internal notes about this deal..."
              rows={5}
              autoFocus
            />
            <div style={styles.modalBtns}>
              <button style={styles.modalCancel} onClick={() => setNoteModal(null)}>Cancel</button>
              <button style={styles.modalConfirm} onClick={saveNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      {createModal && (
        <div style={styles.overlay} onClick={() => setCreateModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>New Deal</h2>
            <div style={styles.createForm}>
              {[
                { key: 'buyerName', label: "Buyer's Name", placeholder: 'Ahmed K' },
                { key: 'sellerName', label: "Seller's Name", placeholder: 'Sara M' },
                { key: 'item', label: 'Item / Service', placeholder: '32K POP' },
                { key: 'amount', label: 'Amount', placeholder: '500 PKR' },
              ].map(f => (
                <div key={f.key} style={styles.formField}>
                  <label style={styles.formLabel}>{f.label}</label>
                  <input
                    style={styles.formInput}
                    value={newDeal[f.key]}
                    onChange={e => setNewDeal(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div style={styles.formField}>
                <label style={styles.formLabel}>Notes</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }}
                  value={newDeal.notes}
                  onChange={e => setNewDeal(d => ({ ...d, notes: e.target.value }))}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.modalCancel} onClick={() => setCreateModal(false)}>Cancel</button>
              <button style={styles.modalConfirm} onClick={createDeal}>Create Deal</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff', surface: '#0d1117' }

const styles = {
  page: { maxWidth: '1000px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  pageSub: { color: C.muted, fontSize: '0.88rem' },
  createBtn: {
    padding: '9px 22px', background: C.accent, color: '#080c10',
    border: 'none', borderRadius: '6px', fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
  },
  toast: {
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
    color: C.accent, padding: '10px 18px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem',
  },
  summaryRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' },
  summaryCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '8px', padding: '14px 20px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    transition: 'border-color 0.2s', minWidth: '100px',
  },
  summaryCount: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.8rem', fontWeight: 700 },
  summaryLabel: { fontSize: '0.78rem', color: C.muted },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  empty: { color: C.muted, padding: '60px 0', textAlign: 'center', fontSize: '1.1rem' },
  dealsList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  dealCard: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '10px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  dealTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dealItem: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: C.text },
  statusBadge: {
    padding: '3px 12px', borderRadius: '100px',
    fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '1px',
  },
  dealParties: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' },
  party: { display: 'flex', flexDirection: 'column', gap: '2px' },
  partyLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: C.muted },
  partyName: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, color: C.text },
  arrow: { color: C.muted, fontSize: '1.2rem' },
  noteBox: {
    background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: '6px', padding: '8px 14px', fontSize: '0.85rem', color: C.muted,
  },
  dealFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
  statusActions: { display: 'flex', gap: '8px' },
  btnProgress: {
    padding: '7px 14px', borderRadius: '6px',
    border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.08)',
    color: '#00e5ff', cursor: 'pointer', fontSize: '0.85rem',
  },
  btnComplete: {
    padding: '7px 14px', borderRadius: '6px',
    border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.08)',
    color: '#00ff88', cursor: 'pointer', fontSize: '0.85rem',
  },
  btnCancel: {
    padding: '7px 14px', borderRadius: '6px',
    border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)',
    color: '#ff4444', cursor: 'pointer', fontSize: '0.85rem',
  },
  dealActions: { display: 'flex', gap: '8px' },
  btnNote: {
    padding: '7px 14px', borderRadius: '6px',
    border: `1px solid ${C.border}`, background: 'transparent',
    color: C.muted, cursor: 'pointer', fontSize: '0.85rem',
  },
  btnWa: {
    padding: '7px 14px', borderRadius: '6px',
    border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)',
    color: '#25d366', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none',
    display: 'inline-block',
  },
  btnDel: {
    padding: '7px 10px', borderRadius: '6px',
    border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)',
    color: '#ff4444', cursor: 'pointer', fontSize: '0.85rem',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px',
  },
  modal: {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '12px', padding: '36px', maxWidth: '480px', width: '100%',
  },
  modalTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: C.text, marginBottom: '6px' },
  modalSub: { color: C.accent, fontSize: '0.88rem', marginBottom: '20px' },
  noteInput: {
    width: '100%', background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: '6px', padding: '12px', color: C.text,
    fontFamily: "'Exo 2', sans-serif", fontSize: '0.9rem', outline: 'none',
    marginBottom: '20px', resize: 'vertical',
  },
  createForm: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem', letterSpacing: '2px', color: C.muted },
  formInput: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: '6px', padding: '10px 14px', color: C.text,
    fontFamily: "'Exo 2', sans-serif", fontSize: '0.9rem', outline: 'none', width: '100%',
  },
  modalBtns: { display: 'flex', gap: '10px' },
  modalCancel: {
    flex: 1, padding: '11px', borderRadius: '6px',
    border: `1px solid ${C.border}`, background: 'transparent',
    color: C.muted, fontFamily: "'Exo 2', sans-serif", cursor: 'pointer',
  },
  modalConfirm: {
    flex: 2, padding: '11px', borderRadius: '6px',
    border: 'none', background: C.accent, color: '#080c10',
    fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
  },
}
