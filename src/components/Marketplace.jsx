import React, { useState, useMemo } from 'react'
import { useListings } from '../hooks/useListings'
import { useAuth } from '../hooks/useAuth'
import { ListingCard } from './ListingCard'

export function Marketplace() {
  const { listings, loading } = useListings()
  const { currentUser } = useAuth()
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    let result = [...listings]

    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter)
    }

    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(item =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [listings, typeFilter, categoryFilter, searchQuery])

  const handleCategoryToggle = (cat) => {
    setCategoryFilter(categoryFilter === cat ? '' : cat)
  }

  return (
    <section id="marketplace">
      <div className="section-wrap">
        <div className="section-header">
          <div className="section-tag">// marketplace</div>
          <h2>Active Listings</h2>
        </div>

        <div className="filters">
          <button
            className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${typeFilter === 'SELL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('SELL')}
          >
            Selling
          </button>
          <button
            className={`filter-btn ${typeFilter === 'NEED' ? 'active' : ''}`}
            onClick={() => setTypeFilter('NEED')}
          >
            Need
          </button>
          
          {['POP', 'Account', 'UC'].map(cat => (
            <button
              key={cat}
              className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => handleCategoryToggle(cat)}
            >
              {cat}
            </button>
          ))}

          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search listings…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="listings-grid">
          {loading ? (
            <div className="loader">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
              <span>Loading listings…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open"></i>
              <p>No listings found</p>
            </div>
          ) : (
            filtered.map((item, idx) => <ListingCard key={item.id} item={item} idx={idx} isOwner={currentUser?.uid === item.user_id} />)
          )}
        </div>
      </div>
    </section>
  )
}
