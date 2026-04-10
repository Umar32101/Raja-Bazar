import { useContext } from 'react'
import { ListingsContext } from '../context/ListingsContext'

export function useListings() {
  const context = useContext(ListingsContext)
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider')
  }
  return context
}
