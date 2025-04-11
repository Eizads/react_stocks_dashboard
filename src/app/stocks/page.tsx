"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function StocksPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to a default stock (e.g., AAPL-NASDAQ)
    router.push("/stocks/AAPL-NASDAQ")
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-24 mt-1" />
        <div className="mt-2 flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <Skeleton className="h-[400px] w-full mb-8" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
} 