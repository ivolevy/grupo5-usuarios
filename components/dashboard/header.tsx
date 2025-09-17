"use client"

import { useAuth } from "@/contexts/auth-context"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-xl font-semibold text-slate-900">SkyTrack</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar..." className="pl-10 w-64 h-9 border-slate-200 focus:border-blue-500" />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

        </div>
      </div>
    </header>
  )
}
