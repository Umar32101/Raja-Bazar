import React, { createContext, useState, useEffect } from 'react'
import { auth, db, ADMIN_WHATSAPP } from '../firebase'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const provider = new GoogleAuthProvider()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
      console.log('Auth state changed:', user ? `Logged in as ${user.email}` : 'Not logged in')
    })
    return unsubscribe
  }, [])

  // Logout on tab close (if user enabled this setting)
  useEffect(() => {
    if (!currentUser) return

    const handleBeforeUnload = (event) => {
      const logoutOnClose = localStorage.getItem('logout_on_close')
      if (logoutOnClose === 'true') {
        // Logout when tab closes
        firebaseSignOut(auth).catch(err => console.error('Logout error:', err))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [currentUser])

  // Email/Password Sign Up
  const signup = async (email, password, phone = '') => {
    try {
      console.log('Attempting signup with email:', email)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Store phone number in localStorage for user profile
      if (phone) {
        const userProfile = {
          uid: result.user.uid,
          email: result.user.email,
          phone: phone,
          createdAt: new Date().toISOString()
        }
        localStorage.setItem(`user_${result.user.uid}`, JSON.stringify(userProfile))
      }
      
      console.log('Signup successful:', result.user.email)
      return result.user
    } catch (error) {
      console.error('Signup error:', error.code, error.message)
      throw error
    }
  }

  // Email/Password Sign In
  const loginWithEmail = async (email, password) => {
    try {
      console.log('Attempting login with email:', email)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Login successful:', result.user.email)
      return result.user
    } catch (error) {
      console.error('Login error:', error.code, error.message)
      throw error
    }
  }

  // Google Sign In (Popup)
  const login = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      throw error
    }
  }

  // Forget Password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Password reset error:', error.code, error.message)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, loginWithEmail, signup, logout, resetPassword, ADMIN_WHATSAPP, db }}>
      {children}
    </AuthContext.Provider>
  )
}
