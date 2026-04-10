import React from 'react'

export function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-logo">⚔ Raja <span>Bazar</span></div>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#how-it-works">How It Works</a>
        </div>
        <div className="footer-social">
          <a href="#" title="WhatsApp"><i className="fab fa-whatsapp"></i></a>
          <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
          <a href="#" title="Telegram"><i className="fab fa-telegram"></i></a>
        </div>
        <div className="footer-copy">© 2025 Raja Bazar. All rights reserved. Made for the PUBG community.</div>
      </div>
    </footer>
  )
}
