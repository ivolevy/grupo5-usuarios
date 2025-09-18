"use client"

import { useAuth } from "@/contexts/auth-context"
import { useUsers } from "@/contexts/users-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Activity, TrendingUp, UserCheck, UserX, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { AccessDenied } from "@/components/ui/access-denied"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { users, loading } = useUsers()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    adminUsers: 0,
    moderatorUsers: 0,
    normalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersThisMonth: 0,
    newUsersLastMonth: 0,
  })

  // Calcular estadísticas cuando cambien los usuarios
  useEffect(() => {
    if (users.length > 0) {
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const newStats = {
        totalUsers: users.length,
        verifiedUsers: users.filter(u => u.email_verified).length,
        unverifiedUsers: users.filter(u => !u.email_verified).length,
        adminUsers: users.filter(u => u.rol === 'admin').length,
        moderatorUsers: users.filter(u => u.rol === 'moderador').length,
        normalUsers: users.filter(u => u.rol === 'usuario').length,
        activeUsers: users.filter(u => {
          if (!u.last_login_at) return false
          const lastLogin = new Date(u.last_login_at)
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
          return lastLogin >= thirtyDaysAgo
        }).length,
        inactiveUsers: users.filter(u => {
          if (!u.last_login_at) return true
          const lastLogin = new Date(u.last_login_at)
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
          return lastLogin < thirtyDaysAgo
        }).length,
        newUsersThisMonth: users.filter(u => new Date(u.created_at) >= thisMonth).length,
        newUsersLastMonth: users.filter(u => {
          const created = new Date(u.created_at)
          return created >= lastMonth && created <= lastMonthEnd
        }).length,
      }
      setStats(newStats)
    }
  }, [users])

  // Calcular crecimiento mensual
  const monthlyGrowth = stats.newUsersLastMonth > 0 
    ? Math.round(((stats.newUsersThisMonth - stats.newUsersLastMonth) / stats.newUsersLastMonth) * 100)
    : stats.newUsersThisMonth > 0 ? 100 : 0

  // Datos para los charts - Paleta azul
  const roleData = [
    { name: 'Administradores', value: stats.adminUsers, color: '#1e40af' }, // Azul oscuro
    { name: 'Moderadores', value: stats.moderatorUsers, color: '#3b82f6' }, // Azul medio
    { name: 'Usuarios', value: stats.normalUsers, color: '#60a5fa' } // Azul claro
  ]

  const statusData = [
    { name: 'Verificados', value: stats.verifiedUsers, color: '#1d4ed8' }, // Azul fuerte
    { name: 'No Verificados', value: stats.unverifiedUsers, color: '#93c5fd' } // Azul muy claro
  ]

  const activityData = [
    { name: 'Activos', value: stats.activeUsers, color: '#2563eb' }, // Azul vibrante
    { name: 'Inactivos', value: stats.inactiveUsers, color: '#94a3b8' } // Azul gris
  ]

  // Datos para gráfico de crecimiento mensual
  const growthData = [
    { name: 'Mes Anterior', usuarios: stats.newUsersLastMonth },
    { name: 'Este Mes', usuarios: stats.newUsersThisMonth }
  ]

  const statsCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers.toString(),
      description: `${stats.newUsersThisMonth} nuevos este mes`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Usuarios Verificados",
      value: stats.verifiedUsers.toString(),
      description: `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100) || 0}% del total`,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Usuarios Activos",
      value: stats.activeUsers.toString(),
      description: `${Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}% del total`,
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Administradores",
      value: stats.adminUsers.toString(),
      description: `${stats.moderatorUsers} moderadores`,
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Usuarios Normales",
      value: stats.normalUsers.toString(),
      description: `${Math.round((stats.normalUsers / stats.totalUsers) * 100) || 0}% del total`,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Crecimiento",
      value: `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth}%`,
      description: "Comparado con el mes anterior",
      icon: TrendingUp,
      color: monthlyGrowth >= 0 ? "text-green-600" : "text-red-600",
      bgColor: monthlyGrowth >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ]

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
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Bienvenido, {user?.nombre_completo || user?.email}
        </h2>
        <p className="text-slate-600">Aquí tienes un resumen de la actividad de tu sistema.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${stat.bgColor} rounded-lg flex-shrink-0`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-roboto-medium text-gray-600 leading-tight">{stat.title}</p>
                    <p className="text-xl font-roboto-bold text-dark-gray leading-tight">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight break-words">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Roles */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Distribución por Roles</CardTitle>
            <CardDescription>Usuarios categorizados por su rol en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Estado de Verificación y Actividad */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Estado de Usuarios</CardTitle>
            <CardDescription>Verificación y actividad de los usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[...statusData, ...activityData]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {[...statusData, ...activityData].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crecimiento Mensual */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Crecimiento Mensual</CardTitle>
            <CardDescription>Comparación de nuevos usuarios registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="usuarios" 
                    stroke="#1d4ed8" 
                    strokeWidth={3}
                    dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Actividad Reciente</CardTitle>
            <CardDescription>Últimos usuarios registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              // Loading skeleton for activity
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : users.length > 0 ? (
              // Mostrar los últimos 3 usuarios registrados
              users
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 3)
                .map((user, index) => {
                  const createdDate = new Date(user.created_at)
                  const now = new Date()
                  const diffInMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60))
                  const diffInHours = Math.floor(diffInMinutes / 60)
                  const diffInDays = Math.floor(diffInHours / 24)

                  let timeAgo = ""
                  if (diffInMinutes < 60) {
                    timeAgo = `Hace ${diffInMinutes} minutos`
                  } else if (diffInHours < 24) {
                    timeAgo = `Hace ${diffInHours} horas`
                  } else {
                    timeAgo = `Hace ${diffInDays} días`
                  }

                  const colors = ["bg-green-500", "bg-blue-500", "bg-orange-500"]
                  const color = colors[index % colors.length]

                  return (
                    <div key={user.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 ${color} rounded-full mt-2`}></div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {user.nombre_completo || user.email} se registró
                        </p>
                        <p className="text-xs text-slate-500">{timeAgo}</p>
                      </div>
                    </div>
                  )
                })
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No hay usuarios registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
