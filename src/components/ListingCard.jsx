import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useListings } from '../hooks/useListings'

function timeAgo(ts) {
  if (!ts) return 'Recently posted'
  const milliseconds = ts.toMillis ? ts.toMillis() : ts.getTime?.() || ts
  const secs = Math.floor((Date.now() - milliseconds) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return Math.floor(secs / 60) + 'm ago'
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago'
  return Math.floor(secs / 86400) + 'd ago'
}

function escapeHtml(text) {
  if (!text) return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
  return String(text).replace(/[&<>"]/g, m => map[m])
}

export function ListingCard({ item, idx, isOwner }) {
  const { ADMIN_WHATSAPP } = useAuth()
  const { deleteListing } = useListings()

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return
    try {
      await deleteListing(item.id)
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const waMsg = encodeURIComponent(`Hi! I saw your listing "${item.title || item.category}" on Raja Bazar. Is it still available?`)
  const adminMsg = encodeURIComponent(`Hi Admin, I want to start a safe deal for: "${item.title || item.category}" — Price: ${item.price}`)

  return (
    <div className={`listing-card type-${item.type}`} style={{ animationDelay: `${idx * 0.06}s` }}>
      <div className="card-top">
        <div className="card-title">{escapeHtml(item.title || item.category + ' Listing')}</div>
        <div className="badges">
          <span className={`badge badge-${item.type === 'SELL' ? 'sell' : 'need'}`}>
            {item.type}
          </span>
          <span className="badge badge-cat">{escapeHtml(item.category)}</span>
        </div>
      </div>
      <div className="card-price">
        {escapeHtml(item.price)} <span>PKR</span>
      </div>
      <div className="card-desc">
        {escapeHtml(item.description || 'No description provided.')}
      </div>
      <div className="card-meta">
        <i className="fas fa-clock"></i> {timeAgo(item.timestamp)}
      </div>
      <div className="card-btns">
        <a
          className="btn-wa"
          href={`https://wa.me/${ADMIN_WHATSAPP}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fab fa-whatsapp"></i> Contact Seller
        </a>
        <a
          className="btn-admin"
          href={`https://wa.me/${ADMIN_WHATSAPP}?text=${adminMsg}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fas fa-shield-halved"></i> Admin Deal
        </a>
        {isOwner && (
          <button className="btn-delete" onClick={handleDelete}>
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </div>
  )
}
