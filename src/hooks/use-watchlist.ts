"use client"

import { useState, useEffect, useCallback } from 'react'
import { StockSearchResult } from '@/types/search'

export const WATCHLIST_STORAGE_KEY = 'stocks-dashboard-watchlist'

export interface WatchlistItem {
  symbol: string
  exchange: string
}

// Custom event for watchlist updates
const WATCHLIST_UPDATE_EVENT = 'watchlist-update'

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])

  // Load watchlist from localStorage
  useEffect(() => {
    const loadWatchlist = () => {
      const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY)
      if (savedWatchlist) {
        try {
          const parsedWatchlist = JSON.parse(savedWatchlist)
          setWatchlist(parsedWatchlist)
        } catch (error) {
          console.error('Failed to parse watchlist from localStorage:', error)
        }
      }
    }

    // Load initial data
    loadWatchlist()

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === WATCHLIST_STORAGE_KEY) {
        loadWatchlist()
      }
    }

    // Listen for custom events from other components
    const handleCustomEvent = () => loadWatchlist()

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(WATCHLIST_UPDATE_EVENT, handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(WATCHLIST_UPDATE_EVENT, handleCustomEvent)
    }
  }, [])

  const toggleStock = useCallback((stock: StockSearchResult | WatchlistItem) => {
    const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY)
    let currentWatchlist: WatchlistItem[] = []
    
    if (savedWatchlist) {
      try {
        currentWatchlist = JSON.parse(savedWatchlist)
      } catch (error) {
        console.error('Failed to parse watchlist from localStorage:', error)
      }
    }

    const exists = currentWatchlist.some(
      item => item.symbol === stock.symbol && item.exchange === stock.exchange
    )

    const newWatchlist = exists
      ? currentWatchlist.filter(
          item => !(item.symbol === stock.symbol && item.exchange === stock.exchange)
        )
      : [...currentWatchlist, { symbol: stock.symbol, exchange: stock.exchange }]

    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist))
    setWatchlist(newWatchlist)

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event(WATCHLIST_UPDATE_EVENT))
  }, [])

  const isInWatchlist = useCallback((symbol: string, exchange: string) => {
    return watchlist.some(
      item => item.symbol === symbol && item.exchange === exchange
    )
  }, [watchlist])

  return {
    watchlist,
    toggleStock,
    isInWatchlist,
  }
} 