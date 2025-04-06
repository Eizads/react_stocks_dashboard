import { StockSearchResult } from "@/types/search"

interface StockPageProps {
  params: {
    symbol: string
  }
}

export default async function StockPage({ params }: StockPageProps) {
  const { symbol } = await Promise.resolve(params)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="col-span-3">
          <h1 className="text-2xl font-bold">Stock Details</h1>
          <p className="text-muted-foreground">Symbol: {symbol}</p>
        </div>
      </div>
    </div>
  )
} 