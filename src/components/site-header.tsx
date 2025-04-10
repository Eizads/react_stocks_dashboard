"use client"

import { SidebarIcon, Search } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const [isOpen, setIsOpen] = useState(false)
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              Stocks Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="ml-auto">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="top" 
              className="fixed flex items-center justify-center p-5"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Search Stocks</SheetTitle>
                <SheetDescription>
                  Search for stocks by name or symbol
                </SheetDescription>
              </SheetHeader>
              <div className="w-full max-w-6xl px-4">
                <SearchForm 
                  className="w-full" 
                  onSelect={() => setIsOpen(false)}
                  navigateOnSelect={true}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
