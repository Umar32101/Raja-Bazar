import React from 'react'

export function Trust() {
  const trustItems = [
    { icon: 'fa-shield-halved', title: 'Admin Controlled Deals', desc: 'Every deal can be handled through our verified admin for complete peace of mind.' },
    { icon: 'fa-lock', title: 'Safe & Secure Trading', desc: 'No middleman scams. Admin holds the assets until both parties confirm the deal.' },
    { icon: 'fa-star', title: 'Trusted Marketplace', desc: 'Built on the existing WhatsApp community — now organized and centralized.' }
  ]

  const testimonials = [
    { text: 'Sold 50K POP within 2 hours. The admin deal feature is a game changer — no stress!', name: '★★★★★ — Ahmed K.' },
    { text: 'Bought a UC package safely. Admin held the deal the whole time. Fully trusted platform.', name: '★★★★★ — Sara M.' },
    { text: 'Finally a proper marketplace instead of random WhatsApp groups. Clean and organized.', name: '★★★★★ — Bilal R.' }
  ]

  return (
    <section id="trust">
      <div className="section-wrap">
        <div className="section-header">
          <div className="section-tag">// safety</div>
          <h2>Why Trust Raja Bazar?</h2>
        </div>
        <div className="trust-grid">
          {trustItems.map((item, idx) => (
            <div key={idx} className="trust-card">
              <i className={`fas ${item.icon}`}></i>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="section-header" style={{ marginTop: '48px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem' }}>What Traders Say</h2>
        </div>
        <div className="testimonials">
          {testimonials.map((tm, idx) => (
            <div key={idx} className="testimonial">
              <p>"{tm.text}"</p>
              <div className="testimonial-name">{tm.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
