import { NextResponse } from "next/server"
import axios from "axios"

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY
const TWELVE_DATA_API_URL = "https://api.twelvedata.com"

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    // Extract symbol from symbol-exchange format
    const symbol = params.symbol.split('-')[0]

    // Get current price and change data
    const quoteResponse = await axios.get(`${TWELVE_DATA_API_URL}/quote`, {
      params: {
        symbol: symbol,
        apikey: TWELVE_DATA_API_KEY,
      },
    })

    const quote = quoteResponse.data

    return NextResponse.json({
      price: parseFloat(quote.close),
      change: parseFloat(quote.change),
      changePercent: parseFloat(quote.percent_change),
      previousClose: parseFloat(quote.previous_close),
    })
  } catch (error) {
    console.error("Error fetching stock quote:", error)
    return NextResponse.json(
      { error: "Failed to fetch stock quote" },
      { status: 500 }
    )
  }
} 