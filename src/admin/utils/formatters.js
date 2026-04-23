export function extractNameFromEmail(email = '') {
  if (!email) return 'Unknown User'
  const local = email.split('@')[0] || ''
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || email
}

export function formatDateTime(value) {
  if (!value) return 'Recently'
  const date = value.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleString()
}

export function shortUid(uid = '') {
  if (!uid) return '-'
  return `${uid.slice(0, 8)}...`
}

export function safeNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}
