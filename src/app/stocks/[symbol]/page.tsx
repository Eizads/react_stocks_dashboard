"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { StockChart } from "@/components/stock-chart"
import { cn } from "@/lib/utils"
import { useStockWebSocket } from "@/hooks/use-stock-websocket"
import { isMarketOpen } from "@/lib/market-status"

interface StockData {
  price: number | null
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
      // Outside market hours, show only actual data points
      return pointDay === currentDay || 
             pointDay === (currentDay === 1 ? 5 : currentDay - 1) // Previous trading day
    }
  })

  // Create array of time points from 9:30 AM to 4:00 PM in 1-minute intervals
  const timePoints = []
  const startTime = 9 * 60 + 30 // 9:30 AM in minutes = 570
  const endTime = 16 * 60 // 4:00 PM in minutes = 960
  const totalPoints = endTime - startTime + 1 // 391 points
  
  for (let minutes = startTime; minutes <= endTime; minutes++) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const date = new Date()
    date.setHours(hours, mins, 0, 0)
    timePoints.push(date.toISOString())
  }

  console.log('Time points analysis:', {
    total: timePoints.length,
    expected: totalPoints,
    first: new Date(timePoints[0]).toLocaleTimeString(),
    last: new Date(timePoints[timePoints.length - 1]).toLocaleTimeString(),
    startTime: `${Math.floor(startTime/60)}:${String(startTime%60).padStart(2, '0')}`,
    endTime: `${Math.floor(endTime/60)}:${String(endTime%60).padStart(2, '0')}`,
    samplePoints: timePoints.slice(0, 5).map(t => new Date(t).toLocaleTimeString())
  })

  // Create a map of timestamp to price for quick lookup
  const priceMap = new Map(
    filteredTimeSeries.map(point => [point.timestamp, point.price])
  )
  console.log('Price Map:', priceMap)

  // Find the last timestamp with actual data
  const lastDataTimestamp = filteredTimeSeries.length > 0 
    ? new Date(filteredTimeSeries[0].timestamp)
    : null

  // For stocks with live updates, use the fixed time points
  // For stocks without live updates, use the actual timestamps
  let pricesArray = new Array(timePoints.length).fill(null)
  
  // Fill pricesArray with prices from filtered time series
 pricesArray = [...priceMap.values()]
  
  // Set the last known price
  if (stockData.price !== null) {
    pricesArray[pricesArray.length - 1] = stockData.price
  }
  
  console.log('Updated Prices:', pricesArray)
  console.log('Last Price:', stockData.price)
  const chartData = marketStatus ? {
    labels: timePoints,
    values: pricesArray
  } : {
    // For non-live stocks, use the full market hours time points
    labels: timePoints,
    values: timePoints.map(timestamp => {
      const currentTimestamp = new Date(timestamp)
      
      // If we have no data or this timestamp is after our last data point, return null
      if (!lastDataTimestamp || currentTimestamp > lastDataTimestamp) {
        return null
      }

      // Format current timestamp to match API timestamp format (minute precision)
      const formattedTimestamp = currentTimestamp.toISOString()

      // Only use exact timestamp matches
      return priceMap.get(formattedTimestamp) ?? null
    })
  }

  console.log('Chart Data analysis:', {
    marketStatus,
    lastDataTimestamp: lastDataTimestamp?.toISOString(),
    totalPoints: timePoints.length,
 
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
            ${currentPrice?.toFixed(2) ?? 'N/A'}
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
          data={chartData as { labels: string[]; values: (number | null)[] }}
          livePrice={marketStatus ? livePrice : null}
          title={marketStatus ? "Today's Price" : isWeekend ? "Last Trading Day" : "Today's Price"}
        />
      </div>
    </div>
  )
} 