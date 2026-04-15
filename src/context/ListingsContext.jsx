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
      // Load from Firestore (Cloud - PRIMARY)
      const q = query(collection(db, 'listings'), orderBy('timestamp', 'desc'))
      const snap = await getDocs(q)
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setListings(loaded)
      console.log('✅ Loaded', loaded.length, 'listings from Firestore')
    } catch (error) {
      console.log('⚠️  Firestore unavailable, loading from localStorage:', error.message)
      // Fallback to localStorage if Firestore fails
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const backupListings = JSON.parse(stored)
          setListings(backupListings)
          console.log('✅ Loaded', backupListings.length, 'listings from localStorage backup')
        } catch {
          setListings([...DEMO_LISTINGS])
        }
      } else {
        setListings([...DEMO_LISTINGS])
        console.log('ℹ️  Using demo listings')
      }
    }
    setLoading(false)
  }

  const addListing = async (data) => {
    try {
      // Save to Firestore FIRST (PRIMARY)
      const docRef = await addDoc(collection(db, 'listings'), {
        ...data,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      })
      
      // Create listing object with Firestore document ID
      const newListing = {
        id: docRef.id,
        ...data,
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      }

      // Update UI
      const updatedListings = [newListing, ...listings]
      setListings(updatedListings)

      // Also backup to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedListings))
      } catch (storageErr) {
        console.warn('localStorage backup failed:', storageErr)
      }

      console.log('✅ Listing saved to Firestore:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('❌ Failed to add listing:', error.message)
      throw error
    }
  }

  const deleteListing = async (id) => {
    try {
      // Delete from Firestore FIRST (PRIMARY)
      if (!id.startsWith('local_')) {
        await deleteDoc(doc(db, 'listings', id))
        console.log('✅ Listing deleted from Firestore:', id)
      }

      // Delete from UI
      const updatedListings = listings.filter(l => l.id !== id)
      setListings(updatedListings)

      // Also update localStorage backup
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedListings))
      } catch (storageErr) {
        console.warn('localStorage backup failed:', storageErr)
      }
    } catch (error) {
      console.error('❌ Failed to delete listing:', error.message)
      throw error
    }
  }

  return (
    <ListingsContext.Provider value={{ listings, loading, addListing, deleteListing, loadListings }}>
      {children}
    </ListingsContext.Provider>
  )
}
