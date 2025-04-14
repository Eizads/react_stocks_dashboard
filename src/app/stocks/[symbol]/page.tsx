"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { StockChart } from "@/components/stock-chart"
import { cn } from "@/lib/utils"
import { useStockWebSocket } from "@/hooks/use-stock-websocket"
import { isMarketOpen } from "@/lib/market-status"
import { Skeleton } from "@/components/ui/skeleton"
import { StockSearchResult } from "@/types/search"

interface StockData {
  price: number | null
  change: number
  changePercent: number
  previousClose: number
  timeSeries: {
    timestamp: string
    price: number
  }[]
  isMarketOpen: boolean
  timeSeriesByDay?: {
    [date: string]: {
      timestamp: string
      price: number
    }[]
  }
}

export default function StockPage() {
  const params = useParams()
  const symbolExchange = params.symbol as string
  const [symbol, exchange] = symbolExchange.split('-')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const { price: livePrice, error: wsError } = useStockWebSocket(symbol)

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const isOpen = isMarketOpen()
        console.log('Market is open:', isOpen)
        
        // Make API calls in parallel
        const [quoteResponse, timeSeriesResponse, searchResponse] = await Promise.all([
          axios.get(`/api/stocks/${symbol}`),
          axios.get(`/api/stocks/${symbol}/intraday`),
          axios.get(`/api/search?query=${symbol}`)
        ])

        // Find the matching stock from search results
        const stockInfo = searchResponse.data.data.find(
          (stock: StockSearchResult) => stock.symbol === symbol && stock.exchange === exchange
        )
        setCompanyName(stockInfo?.instrument_name || "")
        
        console.log('Quote Response:', quoteResponse.data)
        console.log('Time Series Response:', timeSeriesResponse.data)
        console.log('by day response:', timeSeriesResponse.data.timeSeriesByDay)
        
        setStockData({
          ...quoteResponse.data,
          timeSeries: timeSeriesResponse.data.timeSeries,
          timeSeriesByDay: timeSeriesResponse.data.timeSeriesByDay,
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
  }, [symbol, exchange])

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-32" /> {/* Symbol */}
          <Skeleton className="h-4 w-24 mt-1" /> {/* Exchange */}
          <div className="mt-2 flex items-center gap-4">
            <Skeleton className="h-8 w-24" /> {/* Price */}
            <Skeleton className="h-6 w-32" /> {/* Change */}
            <Skeleton className="h-4 w-24" /> {/* Market Status */}
          </div>
        </div>

        <Skeleton className="h-[400px] w-full mb-8" /> {/* Chart */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border">
              <Skeleton className="h-4 w-24 mb-2" /> {/* Label */}
              <Skeleton className="h-6 w-20" /> {/* Value */}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500 p-4 rounded-lg border border-red-200 bg-red-50">
          {error}
        </div>
      </div>
    )
  }

  if (!stockData) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-gray-500 p-4 rounded-lg border">
          Stock not found
        </div>
      </div>
    )
  }

  // Get current date info
  const now = new Date()
  const currentDay = now.getDay()
  const isWeekend = currentDay === 0 || currentDay === 6
  const marketStatus = stockData.isMarketOpen
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTotalMinutes = currentHour * 60 + currentMinutes
  const marketOpenTime = 9 * 60 + 30 // 9:30 AM in minutes

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
      // Outside market hours on a weekday
      if (pointDay === currentDay) {
        // Show all of today's data if it's the current day
        return pointTime >= marketOpenTime && pointTime <= marketCloseTime
      }
      // Show previous day's data if we don't have today's data
      return pointDay === (currentDay === 1 ? 5 : currentDay - 1) // Previous trading day
    }
  })

  // Create array of time points from 9:30 AM to 4:00 PM in 5-minute intervals
  const timePoints: string[] = []
  const startTime = 9 * 60 + 30 // 9:30 AM in minutes = 570
  const endTime = 16 * 60 // 4:00 PM in minutes = 960
  
  for (let minutes = startTime; minutes <= endTime; minutes += 5) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const date = new Date()
    date.setHours(hours, mins, 0, 0)
    timePoints.push(date.toISOString())
  }

  // Create a map of timestamp to price for quick lookup
  const priceMap = new Map(
    filteredTimeSeries.map(point => [point.timestamp, point.price])
  )

  // Find the last timestamp with actual data
  const lastDataTimestamp = filteredTimeSeries.length > 0 
    ? new Date(filteredTimeSeries[0].timestamp)
    : null

  let pricesArray = new Array(timePoints.length).fill(null)
  pricesArray = [...priceMap.values()].reverse()
  
  // Set the last known price
  if (stockData.price !== null) {
    pricesArray[pricesArray.length - 1] = stockData.price
  }

  const chartData = {
    labels: timePoints,
    values: pricesArray
  }

  // Update chart data based on market conditions
  if (!marketStatus && !isWeekend && currentTotalMinutes < marketOpenTime && currentDay === 1) {
    // Before market hours on Monday - show Friday's data
    const lastTradingDate = new Date(now)
    lastTradingDate.setDate(lastTradingDate.getDate() - (currentDay === 1 ? 3 : 1))
    const lastTradingDay = lastTradingDate.toISOString().split('T')[0]
    
    if (stockData.timeSeriesByDay && stockData.timeSeriesByDay[lastTradingDay]) {
      chartData.values = stockData.timeSeriesByDay[lastTradingDay].map(point => point.price).reverse()
      stockData.previousClose = stockData.timeSeriesByDay[lastTradingDay][0].price

    }
  } else if (!marketStatus && !isWeekend && currentTotalMinutes < marketOpenTime) {
    // Before market hours on weekday - show previous day's data
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = yesterday.toISOString().split('T')[0]
    
    if (stockData.timeSeriesByDay && stockData.timeSeriesByDay[yesterdayDate]) {
      chartData.values = stockData.timeSeriesByDay[yesterdayDate].map(point => point.price).reverse()
    }
  } else if (!marketStatus && isWeekend) {
    // Weekend - show last trading day's data
    const lastTradingDate = new Date(now)
    lastTradingDate.setDate(lastTradingDate.getDate() - (currentDay === 0 ? 2 : 1))
    const lastTradingDay = lastTradingDate.toISOString().split('T')[0]
    
    if (stockData.timeSeriesByDay && stockData.timeSeriesByDay[lastTradingDay]) {
      chartData.values = stockData.timeSeriesByDay[lastTradingDay].map(point => point.price).reverse()
    }
  } else if(marketStatus && livePrice){
    console.log('Showing live price data:', {
      livePrice
    })
    pricesArray = [...priceMap.values()].reverse()
    if (stockData.price !== null) {
      pricesArray[pricesArray.length - 1] = stockData.price
    }
    chartData.values = pricesArray
  } else if(marketStatus && !livePrice){
    console.log('Showing current day data (market open, no live price)')
    // For non-live stocks, use the full market hours time points
    pricesArray = [...priceMap.values()].reverse()
    
    // Set the last known price
    if (stockData.price !== null) {
      pricesArray[pricesArray.length - 1] = stockData.price
    }
    
    console.log('Updated Prices:', pricesArray)
    console.log('Last Price:', stockData.price)
    console.log('chartData', chartData.values)

    chartData.values = pricesArray
  }

  console.log('Chart Data analysis:', {
    marketStatus,
    lastDataTimestamp: lastDataTimestamp?.toISOString(),
    totalPoints: timePoints.length,
  })

  // Use live price if available, otherwise use the last known price
  const currentPrice = livePrice ?? stockData.price

  // Calculate high and low prices from filtered time series
  const prices = filteredTimeSeries.map(point => point.price)
  const highPrice = Math.max(...prices)
  const lowPrice = Math.min(...prices)

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        {!symbol ? (
          <>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-24 mt-1" />
          </>
        ) : (
          <>
              <h1 className="text-3xl font-bold">{companyName}</h1>
            <div className="text-md text-muted-foreground mt-2 mb-4">{exchange}: {symbol}</div>
            
          
          </>
        )}
        <div className="mt-2 flex items-center gap-4">
          {currentPrice === null ? (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-32" />
            </>
          ) : (
            <>
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
            </>
          )}
          {marketStatus ? (
            <span className="text-sm text-green-500">Market Open</span>
          ) : (
            <span className="text-sm text-gray-500">Market Closed</span>
          )}
          {(wsError || !livePrice) && (
            <span className="text-sm text-red-500">
              Live updates unavailable
            </span>
          )}
        </div>
      </div>

      {!chartData ? (
        <Skeleton className="h-[400px] w-full mb-8" />
      ) : (
        <div className="h-[400px] w-full mb-8">
          <StockChart 
            data={chartData as { labels: string[]; values: (number | null)[] }}
            livePrice={marketStatus ? livePrice : null}
            title={marketStatus ? "Today's Price" : isWeekend ? "Last Trading Day" : "Today's Price"}
            previousClose={stockData.previousClose}
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {!stockData ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))
        ) : (
          <>
            <div className="p-4 rounded-lg border">
              <div className="text-sm text-gray-500">Previous Close</div>
              <div className="text-lg font-semibold">${stockData.previousClose.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-sm text-gray-500">Day Low</div>
              <div className="text-lg font-semibold">${lowPrice.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-sm text-gray-500">Day High</div>
              <div className="text-lg font-semibold">${highPrice.toFixed(2)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 