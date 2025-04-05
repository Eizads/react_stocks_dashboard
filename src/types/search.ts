export interface StockSearchResult {
  symbol: string
  instrument_name: string
  exchange: string
  currency: string
}

export interface SearchResponse {
  data: StockSearchResult[]
  status: string
} 