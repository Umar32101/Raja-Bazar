import React from 'react'
import { useAuth } from '../hooks/useAuth'

export function CTA() {
  const { ADMIN_WHATSAPP } = useAuth()
  const ctaLink = `https://wa.me/${ADMIN_WHATSAPP}?text=Hi+Admin%2C+I+want+to+start+a+safe+deal+on+Raja+Bazar`

  return (
    <section id="cta">
      <div className="section-tag">// start trading</div>
      <h2>Ready to Trade?</h2>
      <p>Join Raja Bazar and buy or sell your PUBG assets safely today.</p>
      <div className="cta-btns">
        <a href={ctaLink} className="btn-primary" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-whatsapp"></i> Contact Admin on WhatsApp
        </a>
        <a href="#marketplace" className="btn-outline">Browse Listings</a>
      </div>
    </section>
  )
}
