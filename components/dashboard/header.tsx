"use client"

import { useAuth } from "@/contexts/auth-context"
// Importaciones removidas - ya no se usan Search, Bell, Button, Input

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-xl font-semibold text-slate-900">SkyTrack</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search and notifications removed */}
        </div>
      </div>
    </header>
  )
}
