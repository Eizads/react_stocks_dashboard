"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { StockChart } from "@/components/stock-chart"
import { cn } from "@/lib/utils"
import { useStockWebSocket } from "@/hooks/use-stock-websocket"
import { isMarketOpen } from "@/lib/market-status"

interface StockData {
  price: number
  change: number
  changePercent: number
  timeSeries: {
    timestamp: string
    price: number
  }[]
  isMarketOpen: boolean
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
        const isOpen = isMarketOpen()
        console.log('Market is open:', isOpen)
        
        // Always fetch current price data
        const quoteResponse = await axios.get(`/api/stocks/${symbol}`)
        console.log('Quote Response:', quoteResponse.data)
        
        // Fetch appropriate time series data based on market status
        const timeSeriesResponse = await axios.get(
          isOpen 
            ? `/api/stocks/${symbol}/intraday`  // Intraday data during market hours
            : `/api/stocks/${symbol}/daily`     // Daily data outside market hours
        )
        console.log('Time Series Response:', timeSeriesResponse.data)
        
        setStockData({
          ...quoteResponse.data,
          timeSeries: timeSeriesResponse.data.timeSeries,
          isMarketOpen: isOpen
        })
        setError(null)
      } catch (err) {
        console.error("Error fetching stock data:", err)
        setError("Failed to fetch stock data. Please try again later.")
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

  // Filter data based on market status and current day
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const isWeekend = currentDay === 0 || currentDay === 6
  const marketStatus = stockData.isMarketOpen

  // Filter time series data based on market status and day
  const filteredTimeSeries = stockData.timeSeries.filter(point => {
    const pointDate = new Date(point.timestamp)
    const pointDay = pointDate.getDay()
    const pointHour = pointDate.getHours()
    const pointMinutes = pointDate.getMinutes()
    const pointTime = pointHour * 60 + pointMinutes

    // Market hours: 9:30 AM to 4:00 PM ET
    const marketOpenTime = 9 * 60 + 30 // 9:30 AM
    const marketCloseTime = 16 * 60 // 4:00 PM

    if (isWeekend) {
      // On weekends, show all data from the last trading day
      return pointDay === (currentDay === 0 ? 5 : currentDay - 1) // Friday or Saturday
    } else if (marketStatus) {
      // During market hours, show today's data
      return pointDay === currentDay && 
             pointTime >= marketOpenTime && 
             pointTime <= marketCloseTime
    } else {
      // Outside market hours, show today's data if it exists, otherwise show last trading day
      if (pointDay === currentDay) {
        return pointTime >= marketOpenTime && pointTime <= marketCloseTime
      } else {
        return pointDay === (currentDay === 1 ? 5 : currentDay - 1) // Previous trading day
      }
    }
  })

  // Reverse the arrays since the most recent data point is at index 0
  const chartData = {
    labels: [...filteredTimeSeries].reverse().map(point => point.timestamp),
    values: [...filteredTimeSeries].reverse().map(point => point.price),
  }
  
  console.log('Filtered Chart Data:', {
    isWeekend,
    marketStatus,
    currentDay,
    dataPoints: filteredTimeSeries.length,
    firstPoint: filteredTimeSeries[filteredTimeSeries.length - 1]?.timestamp, // Most recent point
    lastPoint: filteredTimeSeries[0]?.timestamp // Oldest point
  })

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
          {marketStatus ? (
            <span className="text-sm text-green-500">Market Open</span>
          ) : (
            <span className="text-sm text-gray-500">Market Closed</span>
          )}
          {wsError && (
            <span className="text-sm text-red-500">
              Live updates unavailable
            </span>
          )}
        </div>
      </div>

      <div className="h-[400px] w-full">
        <StockChart 
          data={chartData} 
          livePrice={marketStatus ? livePrice : null}
          title={marketStatus ? "Today's Price" : isWeekend ? "Last Trading Day" : "Today's Price"}
        />
      </div>
    </div>
  )
} 