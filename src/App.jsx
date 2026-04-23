import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './admin/context/AdminAuthContext'
import { ListingsProvider } from './context/ListingsContext'
import { useAuth } from './hooks/useAuth'
import { useAdminAuth } from './admin/hooks/useAdminAuth'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import AdminLoginPage from './admin/pages/AdminLoginPage'
import AdminDashboard from './admin/pages/AdminDashboard'
import UsersManager from './admin/pages/UsersManager'
import ReportsManager from './admin/pages/ReportsManager'
import PostsManager from './admin/pages/PostsManager'
import PinnedPostsManager from './admin/pages/PinnedPostsManager'
import DealsManager from './admin/pages/DealsManager'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Marketplace } from './components/Marketplace'
import { PostFormSection } from './components/PostFormSection'
import { HowItWorks } from './components/HowItWorks'
import { Trust } from './components/Trust'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'
import { Toast } from './components/Toast'
import { SessionIndicator } from './components/SessionIndicator'

function ProtectedAdminRoute({ children }) {
  const { loading: authLoading, currentUser } = useAuth()
  const { loading: adminLoading, adminData } = useAdminAuth()

  if (authLoading || adminLoading) {
    return <div className="loading-spinner">Loading...</div>
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />
  }

  if (adminData?.isadmin !== true) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppContent() {
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })
  const { currentUser, loading } = useAuth()
  const { adminData, loading: adminLoading } = useAdminAuth()

  React.useEffect(() => {
    window.showToast = (message, type = 'success') => {
      setToast({ message, type, visible: true })
    }
  }, [])

  if (loading || adminLoading) {
    return <div className="loading-spinner">Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route
        path="/admin/login"
        element={adminData?.isadmin === true ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedAdminRoute>
            <UsersManager />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedAdminRoute>
            <ReportsManager />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/posts"
        element={
          <ProtectedAdminRoute>
            <PostsManager />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/pinned"
        element={
          <ProtectedAdminRoute>
            <PinnedPostsManager />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/deals"
        element={
          <ProtectedAdminRoute>
            <DealsManager />
          </ProtectedAdminRoute>
        }
      />
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
            <SessionIndicator />
          </>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ListingsProvider>
          <AppContent />
        </ListingsProvider>
      </AdminAuthProvider>
    </AuthProvider>
  )
}
