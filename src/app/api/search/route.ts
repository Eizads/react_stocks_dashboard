import { NextResponse } from 'next/server';
import axios from 'axios';
import { SearchResponse } from '@/types/search';

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const TWELVE_DATA_API_URL = 'https://api.twelvedata.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!TWELVE_DATA_API_KEY) {
    console.error('TWELVE_DATA_API_KEY is not configured');
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
  }

  try {
    console.log('Searching for:', query);
    const response = await axios.get<SearchResponse>(`${TWELVE_DATA_API_URL}/symbol_search`, {
      params: {
        symbol: query,
        apikey: TWELVE_DATA_API_KEY
      }
    });

    console.log('Search response:', response.data);

    // Sort results to prioritize NASDAQ stocks
    const sortedData = {
      ...response.data,
      data: response.data.data.sort((a, b) => {
        // Put NASDAQ stocks first
        if (a.exchange === 'NASDAQ' && b.exchange !== 'NASDAQ') return -1;
        if (a.exchange !== 'NASDAQ' && b.exchange === 'NASDAQ') return 1;
        return 0;
      })
    };

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch stock data' },
        { status: error.response?.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
} 