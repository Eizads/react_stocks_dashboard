"use client"

import { Home, Minus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { AddStockDialog } from "@/components/add-stock-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useWatchlist } from "@/hooks/use-watchlist"

export function AppSidebar() {
  const pathname = usePathname()
  const { watchlist, toggleStock } = useWatchlist()

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center justify-between gap-2">
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
                <AddStockDialog onToggleStock={toggleStock} />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <div>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Watchlist</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <div className="pl-4">
              {watchlist.map((item) => (
                <SidebarMenuItem key={`${item.symbol}-${item.exchange}`}>
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton asChild className="flex-1">
                      <Link href={`/stocks/${item.symbol}-${item.exchange}`}>
                        <div className="flex items-center gap-2">
                          <span>{item.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.exchange}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => toggleStock(item)}
                    >
                      <Minus className="h-4 w-4" />
                      <span className="sr-only">Remove stock</span>
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))}
            </div>
          </div>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
