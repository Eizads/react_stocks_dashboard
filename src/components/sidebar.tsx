"use client"

import { Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { AddStockDialog } from "@/components/add-stock-dialog"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-[52px] items-center justify-between px-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 text-lg font-semibold",
            pathname === "/" && "text-primary"
          )}
        >
          <Home className="h-6 w-6" />
          <span className="hidden lg:inline-block">Dashboard</span>
        </Link>
        <AddStockDialog />
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start gap-2 px-2 text-sm font-medium">
          {/* Add your navigation items here */}
        </nav>
      </div>
    </div>
  )
} 