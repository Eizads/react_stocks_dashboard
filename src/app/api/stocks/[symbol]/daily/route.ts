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

    // Get daily time series data
    const timeSeriesResponse = await axios.get<TwelveDataTimeSeries>(`${TWELVE_DATA_API_URL}/time_series`, {
      params: {
        symbol: symbol,
        interval: "1day",
        outputsize: 365, // 1 year of daily data
        timezone: "America/New_York",
        apikey: TWELVE_DATA_API_KEY,
      },
    })

    const timeSeries = timeSeriesResponse.data

    // Transform the data
    const stockData = {
      timeSeries: timeSeries.values.map((point) => ({
        timestamp: point.datetime,
        price: parseFloat(point.close),
      })),
      // Group by month for easier access
      byMonth: timeSeries.values.reduce((acc, point) => {
        const date = new Date(point.datetime)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
        
        if (!acc[monthKey]) {
          acc[monthKey] = []
        }
        
        acc[monthKey].push({
          timestamp: point.datetime,
          price: parseFloat(point.close),
        })
        
        return acc
      }, {} as Record<string, Array<{ timestamp: string; price: number }>>)
    }

    console.log('stockData daily:', stockData)
    return NextResponse.json(stockData)
  } catch (error) {
    console.error("Error fetching daily stock data:", error)
    return NextResponse.json(
      { error: "Failed to fetch daily stock data" },
      { status: 500 }
    )
  }
} 