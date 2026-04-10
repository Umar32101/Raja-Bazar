import React, { createContext, useState, useEffect } from 'react'
import { auth, db, ADMIN_WHATSAPP } from '../firebase'
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const provider = new GoogleAuthProvider()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

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

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, ADMIN_WHATSAPP, db }}>
      {children}
    </AuthContext.Provider>
  )
}
