import { NextResponse } from "next/server"
import axios from "axios"

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY
const TWELVE_DATA_API_URL = "https://api.twelvedata.com"

interface TwelveDataTimeSeriesPoint {
  datetime: string
  close: string
}

interface TwelveDataTimeSeries {
  values: TwelveDataTimeSeriesPoint[]
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    // Extract symbol from symbol-exchange format
    const symbol = params.symbol.split('-')[0]

    // Get intraday time series data
    const timeSeriesResponse = await axios.get<TwelveDataTimeSeries>(`${TWELVE_DATA_API_URL}/time_series`, {
      params: {
        symbol: symbol,
        interval: "1min",
        outputsize: 1170, // 3 days of 1-minute data (390 * 3)
        timezone: "America/New_York",
        apikey: TWELVE_DATA_API_KEY,
      },
    })

    const timeSeries = timeSeriesResponse.data

    // Group data by day
    const groupedByDay = timeSeries.values.reduce((acc, point) => {
      const date = new Date(point.datetime)
      const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
      
      if (!acc[dayKey]) {
        acc[dayKey] = []
      }
      
      acc[dayKey].push({
        timestamp: point.datetime,
        price: parseFloat(point.close),
      })
      
      return acc
    }, {} as Record<string, Array<{ timestamp: string; price: number }>>)

    // Transform the data to match our StockData interface
    const stockData = {
      timeSeries: timeSeries.values.map((point) => ({
        timestamp: point.datetime,
        price: parseFloat(point.close),
      })),
      byDay: groupedByDay
    }

    console.log('stockData intraday:', stockData)
    return NextResponse.json(stockData)
  } catch (error) {
    console.error("Error fetching intraday stock data:", error)
    return NextResponse.json(
      { error: "Failed to fetch intraday stock data" },
      { status: 500 }
    )
  }
} 