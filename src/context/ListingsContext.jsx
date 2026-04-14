import React, { createContext, useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

export const ListingsContext = createContext()

const DEMO_LISTINGS = [
  { id: 'd1', type: 'SELL', category: 'POP', price: '500 PKR', title: '32K POP Available',
    description: 'High quality POP for quick sale. Fast delivery guaranteed. Negotiable price.',
    user_id: 'demo', timestamp: null },
  { id: 'd2', type: 'NEED', category: 'UC', price: '1200 PKR', title: 'Need 600 UC',
    description: 'Looking to buy 600 UC at a fair rate. Trusted buyer, have done multiple deals.',
    user_id: 'demo', timestamp: null },
  { id: 'd3', type: 'SELL', category: 'Account', price: '8000 PKR', title: 'Level 70 Conqueror Account',
    description: 'Season 21 Conqueror account with rare outfits. Original email included.',
    user_id: 'demo', timestamp: null },
  { id: 'd4', type: 'SELL', category: 'POP', price: '1200 PKR', title: '100K POP Bulk Deal',
    description: 'Selling 100K POP in bulk. Best price for resellers. Instant transfer.',
    user_id: 'demo', timestamp: null },
  { id: 'd5', type: 'NEED', category: 'Account', price: '3000 PKR', title: 'Need Diamond Account',
    description: 'Looking for a Diamond-ranked account with good KD ratio. Budget 3000-5000 PKR.',
    user_id: 'demo', timestamp: null },
  { id: 'd6', type: 'SELL', category: 'UC', price: '2200 PKR', title: '1800 UC for Sale',
    description: 'Selling 1800 UC at low rates. Quick and safe delivery via admin deal.',
    user_id: 'demo', timestamp: null },
]

const STORAGE_KEY = 'raja_bazar_listings'

export function ListingsProvider({ children }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListings()
  }, [])

  async function loadListings() {
    try {
      // Try to load from Firestore first
      const q = query(collection(db, 'listings'), orderBy('timestamp', 'desc'))
      const snap = await getDocs(q)
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setListings(loaded)
    } catch (e) {
      // Firestore not available - load from localStorage
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setListings(JSON.parse(stored))
        } catch {
          // If localStorage is corrupted, use demo
          setListings([...DEMO_LISTINGS])
        }
      } else {
        // First time - use demo listings
        setListings([...DEMO_LISTINGS])
      }
    }
    setLoading(false)
  }

  const addListing = async (data) => {
    try {
      // Try Firestore first
      const docRef = await addDoc(collection(db, 'listings'), {
        ...data,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      })
      const newListing = {
        id: docRef.id,
        ...data,
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      }
      const updatedListings = [newListing, ...listings]
      setListings(updatedListings)
      return docRef.id
    } catch (err) {
      console.error('Firebase error:', err)
      // Fallback to localStorage
      const newId = 'local_' + Date.now()
      const newListing = {
        id: newId,
        ...data,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        source: 'local'
      }
      const updatedListings = [newListing, ...listings]
      setListings(updatedListings)
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedListings))
      } catch (storageErr) {
        console.error('localStorage error:', storageErr)
      }
      
      return newId
    }
  }

  const deleteListing = async (id) => {
    try {
      // Try Firestore first
      await deleteDoc(doc(db, 'listings', id))
      const updatedListings = listings.filter(l => l.id !== id)
      setListings(updatedListings)
    } catch (e) {
      // Fallback to localStorage
      const updatedListings = listings.filter(l => l.id !== id)
      setListings(updatedListings)
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedListings))
      } catch (storageErr) {
        console.error('localStorage error:', storageErr)
      }
    }
  }

  return (
    <ListingsContext.Provider value={{ listings, loading, addListing, deleteListing, loadListings }}>
      {children}
    </ListingsContext.Provider>
  )
}
