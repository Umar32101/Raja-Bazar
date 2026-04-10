import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useListings } from '../hooks/useListings'

export function PostForm({ onSuccess }) {
  const { currentUser, login } = useAuth()
  const { addListing } = useListings()
  const [loading, setLoading] = useState(false)

  const handleLoginClick = async () => {
    try {
      await login()
    } catch (e) {
      console.error('Login error:', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target

    const data = {
      type: form.type.value,
      category: form.category.value,
      title: form.title.value.trim(),
      price: form.price.value.trim(),
      description: form.description.value.trim(),
      user_id: currentUser.uid,
    }

    if (!data.title || !data.price || !data.description) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      await addListing(data)
      form.reset()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Submit error:', err)
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
            Login with Google
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
              placeholder="Describe your listing in detail…"
              required
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
