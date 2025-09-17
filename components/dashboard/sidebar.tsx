"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Home, Users, LogOut, Menu, X, Shield, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { hasPermission, Permission } from "@/lib/permissions"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, permission: null },
  { name: "Usuarios", href: "/dashboard/users", icon: Users, permission: Permission.ADMIN_DASHBOARD },
]

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:relative lg:z-auto lg:h-full lg:flex lg:flex-col lg:rounded-lg lg:shadow-lg lg:w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-roboto-bold text-dark-gray">UADE</h2>
                <p className="text-xs text-gray-500 font-roboto-regular">v1.0</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation
              .filter((item) => {
                // Si no requiere permiso, mostrar siempre
                if (!item.permission) return true
                // Si requiere permiso, verificar que el usuario lo tenga
                return user && hasPermission(user.rol, item.permission)
              })
              .map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-roboto-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-primary-blue border border-primary-blue"
                      : "text-gray-600 hover:bg-gray-50 hover:text-dark-gray",
                  )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-roboto-medium text-dark-gray">
                    {user?.nombre_completo || user?.email}
                  </p>
                  <span
                    className={cn(
                      "inline-block px-2 py-1 text-xs rounded-full mt-1 font-roboto-regular",
                      user?.rol === "admin"
                        ? "bg-red-100 text-red-700"
                        : user?.rol === "moderador"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700",
                    )}
                  >
                    {user?.rol}
                  </span>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Configurar perfil"
                >
                  <Settings className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                </Link>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-gray-600 hover:text-red-600 hover:border-red-200 bg-transparent font-roboto-regular"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
