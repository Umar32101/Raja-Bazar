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

export function ListingsProvider({ children }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListings()
  }, [])

  async function loadListings() {
    try {
      const q = query(collection(db, 'listings'), orderBy('timestamp', 'desc'))
      const snap = await getDocs(q)
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setListings(loaded)
    } catch (e) {
      // Firebase not configured yet — use demo listings
      setListings([...DEMO_LISTINGS])
    }
    setLoading(false)
  }

  const addListing = async (data) => {
    try {
      const docRef = await addDoc(collection(db, 'listings'), {
        ...data,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      })
      // Optimistically update UI with new listing
      const newListing = {
        id: docRef.id,
        ...data,
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      }
      setListings([newListing, ...listings])
      return docRef.id
    } catch (err) {
      console.error('Firebase error:', err)
      // Demo mode fallback
      const newId = 'demo_' + Date.now()
      const newListing = {
        id: newId,
        ...data,
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      }
      setListings([newListing, ...listings])
      return newId
    }
  }

  const deleteListing = async (id) => {
    try {
      await deleteDoc(doc(db, 'listings', id))
      setListings(listings.filter(l => l.id !== id))
    } catch (e) {
      // Demo mode
      setListings(listings.filter(l => l.id !== id))
    }
  }

  return (
    <ListingsContext.Provider value={{ listings, loading, addListing, deleteListing, loadListings }}>
      {children}
    </ListingsContext.Provider>
  )
}
