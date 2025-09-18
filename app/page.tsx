"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, Users, Shield, TrendingUp, LogIn, UserPlus, Settings, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

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

  // Si no hay usuario, mostrar página de landing sin sidebar
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900">
        {/* Header para usuarios no autenticados */}
        <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm">
                  <img 
                    src="/images/skytrack-icon.png" 
                    alt="SkyTrack" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">SkyTrack</h1>
                  <p className="text-sm text-blue-200">Sistema de Gestión de Vuelos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button className="bg-slate-800/80 text-white border border-slate-600 hover:bg-slate-700 hover:border-slate-500 backdrop-blur-sm font-medium shadow-lg transition-all duration-200">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 font-medium transition-all duration-200">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Registrarse
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section con imagen de fondo */}
        <div 
          className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('https://revistasumma.com/wp-content/uploads/2022/11/aeropuerto.jpg')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/30"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Bienvenido a{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  SkyTrack
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                La plataforma integral para la gestión de vuelos y usuarios. 
                Controla, analiza y optimiza todas las operaciones de tu sistema con tecnología de vanguardia.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-12 py-4 rounded-full shadow-2xl shadow-blue-500/40 transform hover:scale-105 transition-all duration-300 font-bold border-2 border-white/20">
                    <UserPlus className="w-6 h-6 mr-3" />
                    Comenzar Ahora
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" className="bg-slate-900/90 text-white border-2 border-slate-600 hover:bg-slate-800 hover:border-slate-400 backdrop-blur-md shadow-2xl shadow-slate-900/50 transform hover:scale-105 transition-all duration-300 font-bold text-lg px-12 py-4 rounded-full">
                    <LogIn className="w-6 h-6 mr-3" />
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-blue-200 text-sm md:text-base">Disponibilidad</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">100%</div>
                  <div className="text-blue-200 text-sm md:text-base">Seguridad</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">∞</div>
                  <div className="text-blue-200 text-sm md:text-base">Escalabilidad</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">⚡</div>
                  <div className="text-blue-200 text-sm md:text-base">Velocidad</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-slate-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Funcionalidades Avanzadas
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Descubre todas las herramientas que SkyTrack pone a tu disposición para revolucionar la gestión aeroportuaria
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 mb-3">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white mb-6">
              ¿Listo para despegar?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Únete a miles de profesionales que ya confían en SkyTrack para gestionar sus operaciones aeroportuarias
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-10 py-4 shadow-xl transform hover:scale-105 transition-all duration-200">
                <UserPlus className="w-6 h-6 mr-3" />
                Crear Cuenta Gratuita
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-blue-600">
                  <img 
                    src="/images/skytrack-icon.png" 
                    alt="SkyTrack" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">SkyTrack</h3>
                  <p className="text-sm text-slate-400">Sistema de Gestión de Vuelos</p>
                </div>
              </div>
              <div className="text-slate-400 text-center md:text-right">
                <p>&copy; 2024 SkyTrack. Todos los derechos reservados.</p>
                <p className="text-sm mt-1">Tecnología aeroportuaria de vanguardia</p>
              </div>
            </div>
          </div>
        </footer>
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
