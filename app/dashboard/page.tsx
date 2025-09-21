"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { AccessDenied } from "@/components/ui/access-denied"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Verificar si el usuario está cargando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Verificar si el usuario no está autenticado
  if (!user) {
    router.push('/login')
    return null
  }

  // Verificar si el usuario no es administrador
  if (user.rol !== 'admin') {
    return <AccessDenied 
      title="Acceso Denegado - Dashboard Administrativo"
      description="Solo los administradores pueden acceder al dashboard. Tu rol actual no tiene permisos suficientes."
      showBackButton={false}
    />
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Bienvenido al Dashboard, {user?.nombre_completo || user?.email}
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Panel de administración del sistema. Utiliza la navegación lateral para acceder a las diferentes funciones administrativas.
        </p>
      </div>
    </div>
  )
}
