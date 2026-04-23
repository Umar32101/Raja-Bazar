import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

export const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null)
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'admins', user.uid))
          if (snap.exists() && snap.data().isadmin === true) {
            setAdminUser(user)
            setAdminData({ uid: user.uid, ...snap.data() })
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

  const adminLogin = async (email, password) => {
    setError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'admins', cred.user.uid))
      if (!snap.exists() || snap.data().isadmin !== true) {
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

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminData, loading, error, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
