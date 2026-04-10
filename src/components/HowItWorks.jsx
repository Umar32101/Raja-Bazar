import React from 'react'

export function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: 'Browse or Post',
      desc: 'View all active listings freely, or sign in and post your own ad in seconds.'
    },
    {
      num: 2,
      title: 'Chat & Negotiate',
      desc: 'Connect directly with the buyer or seller via WhatsApp. Agree on the deal privately.'
    },
    {
      num: 3,
      title: 'Admin Safe Deal',
      desc: 'Use the admin as a trusted middleman to ensure a secure and scam-free transaction.'
    }
  ]

  return (
    <section id="how-it-works">
      <div className="section-wrap">
        <div className="section-header">
          <div className="section-tag">// process</div>
          <h2>How It Works</h2>
        </div>
        <div className="steps-grid">
          {steps.map(step => (
            <div key={step.num} className="step-card">
              <div className="step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
