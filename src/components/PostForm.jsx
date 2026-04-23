import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useListings } from '../hooks/useListings'
import { useNavigate } from 'react-router-dom'

export function PostForm({ onSuccess }) {
  const { currentUser, currentUserProfile, appSettings } = useAuth()
  const navigate = useNavigate()
  const { addListing, listings } = useListings()
  const [loading, setLoading] = useState(false)

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target

    const postLimit = Number(currentUserProfile?.postLimit ?? appSettings?.defaultPostLimit ?? 3)
    const userPostCount = listings.filter(item => item.user_id === currentUser.uid).length

    if (currentUserProfile?.restricted) {
      if (window.showToast) {
        window.showToast(currentUserProfile.restrictionReason || 'Your posting access is currently restricted', 'error')
      }
      return
    }

    if (userPostCount >= postLimit) {
      if (window.showToast) {
        window.showToast(`Post limit reached (${postLimit}). Contact admin for an upgrade.`, 'error')
      }
      return
    }

    const posterPhone = currentUserProfile?.phone || ''

    if (!posterPhone) {
      if (window.showToast) {
        window.showToast('Please complete your profile with phone number', 'error')
      }
      return
    }

    const data = {
      type: form.type.value,
      category: form.category.value,
      title: form.title.value.trim(),
      price: form.price.value.trim(),
      description: form.description.value.trim(),
      user_id: currentUser.uid,
      poster_email: currentUser.email,
      poster_phone: posterPhone,
    }

    if (!data.title || !data.price) {
      if (window.showToast) {
        window.showToast('Please fill in title and price', 'error')
      }
      return
    }

    setLoading(true)
    try {
      await addListing(data)
      form.reset()
      if (window.showToast) {
        window.showToast('✓ Ad posted successfully!', 'success')
      }
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Submit error:', err)
      if (window.showToast) {
        window.showToast('Failed to post ad. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="form-card">
        <div className="login-prompt">
          <i className="fas fa-user-lock"></i>
          <p>You need to be logged in to post an ad.</p>
          <button className="btn-primary" onClick={handleLoginClick}>
            Sign In to Post
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-card">
      <div style={{ marginBottom: '14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Active posts: {listings.filter(item => item.user_id === currentUser.uid).length} / {Number(currentUserProfile?.postLimit ?? appSettings?.defaultPostLimit ?? 3)}
        {currentUserProfile?.isPremium ? ' · Premium user' : ''}
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label>Ad Type</label>
            <select name="type" required>
              <option value="SELL">SELL — I'm selling</option>
              <option value="NEED">NEED — I'm buying</option>
            </select>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" required>
              <option value="POP">POP (Popularity)</option>
              <option value="UC">UC</option>
              <option value="Account">Account</option>
              <option value="Other">Other / Custom</option>
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              type="text"
              placeholder="e.g. 32K POP Available"
              required
            />
          </div>
          <div className="form-group">
            <label>Price (PKR)</label>
            <input
              name="price"
              type="text"
              placeholder="e.g. 500"
              required
            />
          </div>
          <div className="form-group full">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe your listing in detail… (optional)"
            ></textarea>
          </div>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '13px' }}
            disabled={loading}
          >
            {loading ? 'Posting…' : '📢 Post Ad'}
          </button>
        </div>
      </form>
    </div>
  )
}
