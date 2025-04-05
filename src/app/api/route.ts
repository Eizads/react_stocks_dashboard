import { NextResponse } from 'next/server';

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const TWELVE_DATA_API_URL = 'https://api.twelvedata.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!TWELVE_DATA_API_KEY) {
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
    //   `${TWELVE_DATA_API_URL}/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${TWELVE_DATA_API_KEY}`
      `${TWELVE_DATA_API_URL}/stocks`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch data from Twelve Data API');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
} 