"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { StockChart } from "@/components/stock-chart"
import { cn } from "@/lib/utils"
import { useStockWebSocket } from "@/hooks/use-stock-websocket"

interface StockData {
  price: number
  change: number
  changePercent: number
  timeSeries: {
    timestamp: string
    price: number
  }[]
}

export default function StockPage() {
  const params = useParams()
  const symbolExchange = params.symbol as string
  const [symbol, exchange] = symbolExchange.split('-')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { price: livePrice, error: wsError } = useStockWebSocket(symbol)

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const { data } = await axios.get<StockData>(`/api/stocks/${symbol}`)
        setStockData(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching stock data:", err)
        setError("Failed to fetch stock data")
      } finally {
        setLoading(false)
      }
    }

    if (symbol) {
      fetchStockData()
    }
  }, [symbol])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!stockData) {
    return <div>Stock not found</div>
  }

  const chartData = {
    labels: stockData.timeSeries.map((point) => 
      new Date(point.timestamp).toLocaleDateString()
    ),
    values: stockData.timeSeries.map((point) => point.price),
  }

  // Use live price if available, otherwise use the last known price
  const currentPrice = livePrice ?? stockData.price

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{symbol}</h1>
        <div className="text-sm text-muted-foreground">{exchange}</div>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-2xl font-semibold">
            ${currentPrice.toFixed(2)}
          </span>
          <span
            className={cn(
              "text-lg",
              stockData.change >= 0 ? "text-green-500" : "text-red-500"
            )}
          >
            {stockData.change >= 0 ? "+" : ""}
            {stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
          </span>
          {wsError && (
            <span className="text-sm text-red-500">
              Live updates unavailable
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <StockChart
          data={chartData}
          title={`${symbol} Price History`}
        />
      </div>
    </div>
  )
} 