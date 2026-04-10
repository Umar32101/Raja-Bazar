import React from 'react'
import { useListings } from '../hooks/useListings'

export function Hero() {
  const { listings } = useListings()

  return (
    <section id="hero">
      <div className="hero-bg"></div>
      <div className="hero-content">
        <div className="hero-badge">🟢 MARKETPLACE LIVE</div>
        <h1 className="hero-title">Buy & Sell <span className="hl">PUBG Assets</span> Safely</h1>
        <p className="hero-sub">POP, Accounts, UC — Fast &amp; Trusted Deals through Admin-Verified Transactions</p>
        <div className="hero-btns">
          <a href="#marketplace" className="btn-primary">🛒 Browse Marketplace</a>
          <a href="#post-section" className="btn-outline">📢 Post Ad</a>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">{listings.length}</div>
            <div className="stat-label">Active Listings</div>
          </div>
          <div className="stat">
            <div className="stat-num">100%</div>
            <div className="stat-label">Admin Verified</div>
          </div>
          <div className="stat">
            <div className="stat-num">0%</div>
            <div className="stat-label">Scam Rate</div>
          </div>
        </div>
      </div>
    </section>
  )
}
