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
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [appSettings, setAppSettings] = useState({
    adminWhatsApp: ADMIN_WHATSAPP,
    defaultPostLimit: 3,
  })
  const [loading, setLoading] = useState(true)
  const provider = new GoogleAuthProvider()

  useEffect(() => {
    const settingsRef = doc(db, 'appSettings', 'general')
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      const data = snap.exists() ? snap.data() : {}
      setAppSettings({
        adminWhatsApp: data.adminWhatsApp || ADMIN_WHATSAPP,
        defaultPostLimit: Number.isFinite(Number(data.defaultPostLimit)) ? Number(data.defaultPostLimit) : 3,
      })
    }, () => {
      setAppSettings({
        adminWhatsApp: ADMIN_WHATSAPP,
        defaultPostLimit: 3,
      })
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
      console.log('Auth state changed:', user ? `Logged in as ${user.email}` : 'Not logged in')
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setCurrentUserProfile(null)
      return undefined
    }

    const userRef = doc(db, 'users', currentUser.uid)
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setCurrentUserProfile({ id: snap.id, ...snap.data() })
      } else {
        setCurrentUserProfile({
          uid: currentUser.uid,
          email: currentUser.email,
          phone: '',
          isPremium: false,
          restricted: false,
          postLimit: appSettings.defaultPostLimit || 3,
        })
      }
    }, () => {
      setCurrentUserProfile({
        uid: currentUser.uid,
        email: currentUser.email,
        phone: '',
        isPremium: false,
        restricted: false,
        postLimit: appSettings.defaultPostLimit || 3,
      })
    })

    return unsubscribe
  }, [currentUser, appSettings.defaultPostLimit])

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
      
      // Save user profile to Firestore
      const userProfile = {
        uid: result.user.uid,
        email: result.user.email,
        phone: phone || '',
        displayName: '',
        isPremium: false,
        restricted: false,
        restrictionReason: '',
        postLimit: appSettings.defaultPostLimit || 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      try {
        await setDoc(doc(db, 'users', result.user.uid), userProfile)
        console.log('✅ User profile saved to Firestore')
      } catch (dbErr) {
        console.warn('⚠️ Failed to save to Firestore, using localStorage:', dbErr.message)
        // Fallback: save to localStorage
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

  const refreshUserProfile = async () => {
    if (!currentUser) return null
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists()) {
        const profile = { id: snap.id, ...snap.data() }
        setCurrentUserProfile(profile)
        return profile
      }

      const fallbackProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        phone: '',
        isPremium: false,
        restricted: false,
        postLimit: appSettings.defaultPostLimit || 3,
      }
      setCurrentUserProfile(fallbackProfile)
      return fallbackProfile
    } catch (error) {
      console.error('Refresh profile error:', error)
      return null
    }
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      currentUserProfile,
      appSettings,
      loading,
      login,
      loginWithEmail,
      signup,
      logout,
      resetPassword,
      refreshUserProfile,
      ADMIN_WHATSAPP: appSettings.adminWhatsApp || ADMIN_WHATSAPP,
      db,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
