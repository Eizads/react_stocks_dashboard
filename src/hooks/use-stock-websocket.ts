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
    }

    ws.onmessage = (event) => {
      try {
        const update: TwelveDataPriceUpdate = JSON.parse(event.data)
        if (update.event === "price" && update.symbol === symbol) {
          setPrice(update.price)
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
        setError("Failed to parse price update")
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      setError("WebSocket connection error")
    }

    ws.onclose = () => {
      setError("WebSocket connection closed")
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