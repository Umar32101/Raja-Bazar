import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useListings } from '../hooks/useListings'
import { useNavigate } from 'react-router-dom'

export function PostForm({ onSuccess }) {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { addListing } = useListings()
  const [loading, setLoading] = useState(false)

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target

    // Get poster's phone from localStorage
    const userProfile = localStorage.getItem(`user_${currentUser.uid}`)
    let posterPhone = ''
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile)
        posterPhone = profile.phone || ''
      } catch (err) {
        console.error('Error parsing user profile:', err)
      }
    }

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
