import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ListingsProvider } from './context/ListingsContext'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
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
  const { currentUser, loading } = useAuth()

  React.useEffect(() => {
    // Make toast function globally available for error handling
    window.showToast = (message, type = 'success') => {
      setToast({ message, type, visible: true })
    }
  }, [])

  if (loading) {
    return <div className="loading-spinner">Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/" /> : <SignupPage />} />
      <Route
        path="/*"
        element={
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
        }
      />
    </Routes>
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
