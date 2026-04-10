import React, { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ListingsProvider } from './context/ListingsContext'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Marketplace } from './components/Marketplace'
import { PostFormSection } from './components/PostFormSection'
import { HowItWorks } from './components/HowItWorks'
import { Trust } from './components/Trust'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'
import { Toast } from './components/Toast'

function AppContent() {
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

  React.useEffect(() => {
    // Make toast function globally available for error handling
    window.showToast = (message, type = 'success') => {
      setToast({ message, type, visible: true })
    }
  }, [])

  return (
    <>
      <Navbar />
      <Hero />
      <Marketplace />
      <PostFormSection />
      <HowItWorks />
      <Trust />
      <CTA />
      <Footer />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        duration={3000}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ListingsProvider>
        <AppContent />
      </ListingsProvider>
    </AuthProvider>
  )
}
