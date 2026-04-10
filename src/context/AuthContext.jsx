import React, { createContext, useState, useEffect } from 'react'
import { auth, db, ADMIN_WHATSAPP } from '../firebase'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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
    })
    return unsubscribe
  }, [])

  // Email/Password Sign Up
  const signup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      throw error
    }
  }

  // Email/Password Sign In
  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
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

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, loginWithEmail, signup, logout, ADMIN_WHATSAPP, db }}>
      {children}
    </AuthContext.Provider>
  )
}
