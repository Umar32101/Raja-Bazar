import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { extractNameFromEmail } from '../utils/formatters'

export const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null)
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const updatePresence = async (user, online) => {
    if (!user) return
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email || '',
        name: extractNameFromEmail(user.email || ''),
        onlinestatus: online,
        lastSeenAt: serverTimestamp(),
      }, { merge: true })
    } catch (presenceError) {
      console.error('Admin presence error:', presenceError)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'admins', user.uid))
          if (snap.exists()) {
            await updatePresence(user, true)
            setAdminUser(user)
            setAdminData({ uid: user.uid, ...snap.data(), isadmin: true })
          } else {
            setAdminUser(null)
            setAdminData(null)
          }
        } catch {
          setAdminUser(null)
          setAdminData(null)
        }
      } else {
        setAdminUser(null)
        setAdminData(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!adminUser) return undefined

    const handleVisibility = () => {
      updatePresence(adminUser, document.visibilityState === 'visible')
    }

    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', () => {
      updatePresence(adminUser, false)
    })

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [adminUser])

  const adminLogin = async (email, password) => {
    setError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'admins', cred.user.uid))
      if (!snap.exists()) {
        await signOut(auth)
        throw new Error('Access denied. This account is not an admin.')
      }
      return true
    } catch (e) {
      setError(e.message)
      throw e
    }
  }

  const adminLogout = () => signOut(auth)

  const logoutAndMarkOffline = async () => {
    await updatePresence(adminUser, false)
    return signOut(auth)
  }

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminData, loading, error, adminLogin, adminLogout: logoutAndMarkOffline }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
