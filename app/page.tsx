"use client"

// Force dynamic rendering to avoid build errors
export const dynamic = 'force-dynamic'

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, TrendingUp, Settings, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirigir al login si no hay usuario autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar loading mientras redirige
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  // Si hay usuario, usar el layout con sidebar
  return (
    <div className="h-screen bg-slate-50 flex px-4 py-4 gap-4">
      <div className="flex-shrink-0 h-full">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden h-full">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Welcome message */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Bienvenido, {user?.nombre_completo || user?.email}
              </h2>
              <p className="text-slate-600">Aquí tienes acceso a todas las funcionalidades del sistema según tu rol.</p>
            </div>

            {/* User Actions Section */}
            <div className="max-w-5xl mx-auto">
              {user.rol === 'admin' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {/* Gestión de Usuarios Card */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Gestión de Usuarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Administra usuarios, roles y permisos del sistema
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard/users')}
                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Gestionar Usuarios
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Tu Perfil Card */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-emerald-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Tu Perfil
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Gestiona tu información personal y configuración de cuenta
                      </p>
                      <p className="text-xs text-slate-500">
                        Rol actual: <span className="font-semibold capitalize">{user.rol}</span>
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard/profile')}
                        className="w-full bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 shadow-sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Ver Perfil
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {/* Tu Perfil Card */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-emerald-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Tu Perfil
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Gestiona tu información personal y configuración de cuenta
                      </p>
                      <p className="text-xs text-slate-500">
                        Rol actual: <span className="font-semibold capitalize">{user.rol}</span>
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard/profile')}
                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Ver Perfil
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Estado del Sistema Card */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Estado del Sistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-2">
                        Tu rol actual: <span className="font-semibold capitalize">{user.rol}</span>
                      </p>
                      <p className="text-sm text-slate-500">
                        Tienes acceso a las funcionalidades básicas del sistema. 
                        Para acceso administrativo, contacta con tu administrador.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
