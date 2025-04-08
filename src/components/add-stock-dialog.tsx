"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SearchForm } from "@/components/search-form"
import { StockSearchResult } from "@/types/search"

interface WatchlistItem {
  symbol: string
  exchange: string
}

interface AddStockDialogProps {
  onToggleStock: (stock: StockSearchResult) => void
  watchlist: WatchlistItem[]
}

export function AddStockDialog({ onToggleStock, watchlist }: AddStockDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add stock</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Search for a stock to add to your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <SearchForm 
            onSelect={onToggleStock}
            watchlist={watchlist}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 