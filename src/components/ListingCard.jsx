import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useListings } from '../hooks/useListings'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

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
  const navigate = useNavigate()
  const { ADMIN_WHATSAPP, currentUser, db } = useAuth()
  const { deleteListing } = useListings()

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return
    try {
      await deleteListing(item.id)
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const handleDealClick = (dealType) => {
    // Require user to be logged in
    if (!currentUser) {
      if (window.showToast) {
        window.showToast('Please sign in to make a deal', 'error')
      }
      navigate('/login')
      return
    }

    // Create deal notification object
    const notification = {
      buyerId: currentUser.uid,
      buyerEmail: currentUser.email,
      sellerId: item.user_id,
      sellerEmail: item.poster_email,
      sellerPhone: item.poster_phone,
      listingId: item.id,
      listingTitle: item.title,
      price: item.price,
      dealType: dealType, // 'direct' or 'admin'
      timestamp: new Date().toISOString(),
      status: 'initiated'
    }
    
    // Save to Firestore (PRIMARY)
    if (db) {
      (async () => {
        try {
          const docRef = await addDoc(collection(db, 'deal_notifications'), {
            ...notification,
            timestamp: serverTimestamp()
          })
          console.log('✅ Deal notification saved to Firestore:', docRef.id)
        } catch (err) {
          console.warn('⚠️ Firestore failed, using localStorage backup:', err.message)
          // Fallback to localStorage
          try {
            const notifications = JSON.parse(localStorage.getItem('admin_deal_notifications') || '[]')
            notifications.unshift(notification)
            localStorage.setItem('admin_deal_notifications', JSON.stringify(notifications.slice(0, 100)))
          } catch (storageErr) {
            console.error('Both Firestore and localStorage failed:', storageErr)
          }
        }
      })()
    } else {
      // If db not available, use localStorage
      try {
        const notifications = JSON.parse(localStorage.getItem('admin_deal_notifications') || '[]')
        notifications.unshift(notification)
        localStorage.setItem('admin_deal_notifications', JSON.stringify(notifications.slice(0, 100)))
      } catch (err) {
        console.error('Error saving notification:', err)
      }
    }

    // Show confirmation
    if (window.showToast) {
      window.showToast('✓ Deal request sent! Admin will contact you soon.', 'success')
    }
  }

  // Get poster's phone or fallback to admin number
  const posterPhone = item.poster_phone ? item.poster_phone.replace(/\D/g, '') : ADMIN_WHATSAPP
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
        {currentUser ? (
          <>
            <a
              className="btn-wa"
              href={`https://wa.me/${posterPhone}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleDealClick('direct')}
            >
              <i className="fab fa-whatsapp"></i> Direct Deal
            </a>
            <a
              className="btn-admin"
              href={`https://wa.me/${ADMIN_WHATSAPP}?text=${adminMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleDealClick('admin')}
            >
              <i className="fas fa-shield-halved"></i> Admin Deal
            </a>
          </>
        ) : (
          <>
            <button
              className="btn-wa"
              onClick={() => handleDealClick('direct')}
              style={{ textDecoration: 'none', display: 'inline-block', cursor: 'pointer' }}
            >
              <i className="fab fa-whatsapp"></i> Direct Deal
            </button>
            <button
              className="btn-admin"
              onClick={() => handleDealClick('admin')}
              style={{ textDecoration: 'none', display: 'inline-block', cursor: 'pointer' }}
            >
              <i className="fas fa-shield-halved"></i> Admin Deal
            </button>
          </>
        )}
        {isOwner && (
          <button className="btn-delete" onClick={handleDelete}>
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </div>
  )
}
