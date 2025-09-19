"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, Users, Shield, TrendingUp, Settings, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const features = [
    {
      icon: Plane,
      title: "Gestión de Vuelos",
      description: "Administra y controla todos los aspectos de tus vuelos de manera eficiente."
    },
    {
      icon: Users,
      title: "Gestión de Usuarios",
      description: "Sistema completo de usuarios con roles y permisos personalizables."
    },
    {
      icon: BarChart3,
      title: "Análisis y Reportes",
      description: "Visualiza estadísticas y métricas importantes de tu sistema."
    },
    {
      icon: Shield,
      title: "Seguridad Avanzada",
      description: "Protección robusta con autenticación y autorización por roles."
    }
  ]

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

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* User Actions Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Tu Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Gestiona tu información personal y configuración de cuenta
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Rol actual: <span className="font-semibold capitalize">{user.rol}</span>
                  </p>
                  <Button 
                    onClick={() => router.push('/dashboard/profile')}
                    className="w-full"
                    variant="outline"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Ver Perfil
                  </Button>
                </CardContent>
              </Card>

              {user.rol === 'admin' && (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Dashboard Admin
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Accede a métricas, estadísticas y análisis del sistema
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ir al Dashboard
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Gestión de Usuarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Administra usuarios, roles y permisos del sistema
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard/users')}
                        className="w-full"
                        variant="outline"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Gestionar Usuarios
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {user.rol !== 'admin' && (
                <Card className="border-0 shadow-sm md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Estado del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Tu rol actual: <span className="font-semibold capitalize">{user.rol}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Tienes acceso a las funcionalidades básicas del sistema. 
                      Para acceso administrativo, contacta con tu administrador.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
