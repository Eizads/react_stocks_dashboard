"use client"

import { useEffect, useRef, useState } from "react"

const TWELVE_DATA_API_KEY = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY

interface TwelveDataPriceUpdate {
  event: string
  symbol: string
  price: number
  timestamp: number
}

export function useStockWebSocket(symbol: string) {
  const [price, setPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!TWELVE_DATA_API_KEY) {
      setError("API key is not configured")
      return
    }

    const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVE_DATA_API_KEY}`)
    
    ws.onopen = () => {
      // Subscribe to the symbol
      ws.send(JSON.stringify({
        action: "subscribe",
        params: {
          symbols: symbol
        }
      }))
      setError(null) // Clear any previous errors on successful connection
    }

    ws.onmessage = (event) => {
      try {
        const update: TwelveDataPriceUpdate = JSON.parse(event.data)
        if (update.event === "price" && update.symbol === symbol) {
          setPrice(update.price)
          setError(null) // Clear any previous errors on successful message
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
        // Don't set error for parsing issues, just log them
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      // Don't set error for connection issues, just log them
    }

    ws.onclose = () => {
      // Only set error if we're in market hours and the connection was closed unexpectedly
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const isMarketHours = (hours > 9 || (hours === 9 && minutes >= 30)) && hours < 16
      
      if (isMarketHours) {
        setError("WebSocket connection closed")
      }
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [symbol])

  return { price, error }
} 