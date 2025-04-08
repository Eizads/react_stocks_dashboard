import { NextResponse } from "next/server"
import axios from "axios"

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY
const TWELVE_DATA_API_URL = "https://api.twelvedata.com"

interface TwelveDataQuote {
  close: string
  change: string
  percent_change: string
}

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

    // Get real-time quote
    const quoteResponse = await axios.get<TwelveDataQuote>(`${TWELVE_DATA_API_URL}/quote`, {
      params: {
        symbol: symbol,
        apikey: TWELVE_DATA_API_KEY,
      },
    })

    // Get time series data
    const timeSeriesResponse = await axios.get<TwelveDataTimeSeries>(`${TWELVE_DATA_API_URL}/time_series`, {
      params: {
        symbol: params.symbol,
        interval: "1day",
        outputsize: 30,
        apikey: TWELVE_DATA_API_KEY,
      },
    })

    const quote = quoteResponse.data
    const timeSeries = timeSeriesResponse.data

    // Transform the data to match our StockData interface
    const stockData = {
      price: parseFloat(quote.close),
      change: parseFloat(quote.change),
      changePercent: parseFloat(quote.percent_change),
      timeSeries: timeSeries.values.map((point) => ({
        timestamp: point.datetime,
        price: parseFloat(point.close),
      })),
    }

    return NextResponse.json(stockData)
  } catch (error) {
    console.error("Error fetching stock data:", error)
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    )
  }
} 