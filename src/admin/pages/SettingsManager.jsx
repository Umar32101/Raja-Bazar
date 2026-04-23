import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import AdminLayout from '../components/AdminLayout'

const DEFAULT_SETTINGS = {
  adminWhatsApp: '',
  defaultPostLimit: 3,
}

export default function SettingsManager() {
  const { ADMIN_WHATSAPP } = useAuth()
  const [settings, setSettings] = useState({
    adminWhatsApp: ADMIN_WHATSAPP,
    defaultPostLimit: 3,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [ADMIN_WHATSAPP])

  async function loadSettings() {
    setLoading(true)
    try {
      const ref = doc(db, 'appSettings', 'general')
      const snap = await getDoc(ref)
      const merged = {
        adminWhatsApp: ADMIN_WHATSAPP,
        defaultPostLimit: 3,
        ...(snap.exists() ? snap.data() : DEFAULT_SETTINGS),
      }
      setSettings({
        adminWhatsApp: merged.adminWhatsApp || ADMIN_WHATSAPP,
        defaultPostLimit: Number(merged.defaultPostLimit) || 3,
      })

      await setDoc(ref, {
        adminWhatsApp: merged.adminWhatsApp || ADMIN_WHATSAPP,
        defaultPostLimit: Number(merged.defaultPostLimit) || 3,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (error) {
      console.error('Settings load error:', error)
      setSettings({
        adminWhatsApp: ADMIN_WHATSAPP,
        defaultPostLimit: 3,
      })
    }
    setLoading(false)
  }

  async function saveSettings(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'appSettings', 'general'), {
        adminWhatsApp: settings.adminWhatsApp.trim() || ADMIN_WHATSAPP,
        defaultPostLimit: Math.max(1, Number(settings.defaultPostLimit) || 3),
        updatedAt: serverTimestamp(),
      }, { merge: true })
      setMessage('Settings saved')
    } catch (error) {
      console.error('Settings save error:', error)
      setMessage('Failed to save settings')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Settings</h1>
            <p style={styles.pageSub}>Configure global admin controls and posting defaults.</p>
          </div>
        </div>

        {message && <div style={styles.toast}>{message}</div>}

        {loading ? (
          <div style={styles.loader}>Loading settings...</div>
        ) : (
          <form style={styles.card} onSubmit={saveSettings}>
            <div style={styles.field}>
              <label style={styles.label}>Admin WhatsApp Number</label>
              <input
                style={styles.input}
                value={settings.adminWhatsApp}
                onChange={(e) => setSettings((prev) => ({ ...prev, adminWhatsApp: e.target.value }))}
                placeholder="923001234567"
              />
              <small style={styles.help}>Used in buyer-facing WhatsApp actions and admin deal contact links.</small>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Default Post Limit</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                value={settings.defaultPostLimit}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultPostLimit: e.target.value }))}
              />
              <small style={styles.help}>Applied to new users automatically and used as fallback for missing profiles.</small>
            </div>

            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  )
}

const C = { card: '#111820', border: '#1e2d3d', text: '#e0e8f0', muted: '#5a7080', accent: '#00e5ff', bg: '#080c10' }

const styles = {
  page: { maxWidth: '760px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: C.text, marginBottom: '4px' },
  pageSub: { color: C.muted, fontSize: '0.9rem' },
  loader: { color: C.muted, padding: '40px 0', textAlign: 'center' },
  toast: { background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: C.accent, padding: '10px 18px', borderRadius: '6px', marginBottom: '16px' },
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600 },
  input: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 14px', color: C.text, fontSize: '0.95rem' },
  help: { color: C.muted, fontSize: '0.8rem' },
  saveBtn: { alignSelf: 'flex-start', padding: '11px 18px', background: C.accent, color: C.bg, border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },
}
