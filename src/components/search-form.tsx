"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"

import { useDebounce } from "@/hooks/use-debounce"
import axios from "axios"
import { cn } from "@/lib/utils"

import { StockSearchResult, SearchResponse } from "@/types/search"

export function SearchForm({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    const fetchStocks = async () => {
      if (!debouncedSearchQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await axios.get<SearchResponse>(
          `/api/search?query=${encodeURIComponent(debouncedSearchQuery)}`
        )
        setResults(response.data.data)
      } catch {
        setError("Failed to fetch stocks. Please try again.")
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchStocks()
  }, [debouncedSearchQuery])

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      {(isLoading || results.length > 0 || error) && (
        <div className="absolute left-0 right-0 top-20 max-h-[60vh] overflow-y-auto rounded-md border bg-background shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-destructive">{error}</div>
          ) : (
            <div className="divide-y">
              {results.map((stock) => (
                <div
                  key={`${stock.symbol}-${stock.exchange}`}
                  className="flex items-center justify-between p-4 hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {stock.instrument_name}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stock.exchange}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
