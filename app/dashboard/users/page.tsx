"use client"

import { useState } from "react"
import { useUsers } from "@/contexts/users-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddUserDialog } from "@/components/users/add-user-dialog"
import { UserActions } from "@/components/users/user-actions"
import { AdvancedFilters, type FilterOptions } from "@/components/users/advanced-filters"
import { AccessDenied } from "@/components/ui/access-denied"
import { Search, Users, UserCheck, UserX, Shield, Settings, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { hasPermission, Permission } from "@/lib/permissions"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("admin-moderator")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    role: "all",
    activityStatus: "all",
    nationality: "all",
    dateRange: { from: undefined, to: undefined },
    searchTerm: ""
  })
  const { getAdminModeratorUsers, getNormalUsers, loading, error } = useUsers()
  const { user } = useAuth()

  // Verificar si el usuario tiene permisos de administrador
  if (!user || !hasPermission(user.rol, Permission.ADMIN_DASHBOARD)) {
    return (
      <AccessDenied 
        title="Acceso Restringido"
        description="Solo los administradores pueden acceder a la gestión de usuarios."
      />
    )
  }

  // Obtener usuarios por tipo
  const usuariosAdminModerador = getAdminModeratorUsers()
  const usuariosNormales = getNormalUsers()
  
  // Filtrar usuarios según la pestaña activa
  const currentUsers = activeTab === "admin-moderator" ? usuariosAdminModerador : usuariosNormales
  
  // Función de filtrado avanzado
  const applyAdvancedFilters = (users: typeof currentUsers) => {
    return users.filter((user) => {
      // Filtro por búsqueda de texto
      const matchesSearch = searchTerm === "" || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nombre_completo && user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.nacionalidad && user.nacionalidad.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtro por rol - Solo aplicar si estamos en la pestaña de admin-moderator
      const matchesRole = activeTab === "normal-users" || filters.role === "all" || user.rol === filters.role

      // Filtro por actividad - Solo para usuarios normales
      const matchesActivity = activeTab === "admin-moderator" || filters.activityStatus === "all" || 
        (filters.activityStatus === "active" && user.last_login_at && 
          (new Date().getTime() - new Date(user.last_login_at).getTime()) < (30 * 24 * 60 * 60 * 1000)) ||
        (filters.activityStatus === "inactive" && user.last_login_at && 
          (new Date().getTime() - new Date(user.last_login_at).getTime()) >= (30 * 24 * 60 * 60 * 1000)) ||
        (filters.activityStatus === "never" && !user.last_login_at)

      // Filtro por fecha de creación
      const userCreatedAt = new Date(user.created_at)
      const matchesDateRange = (!filters.dateRange.from || userCreatedAt >= filters.dateRange.from) &&
        (!filters.dateRange.to || userCreatedAt <= filters.dateRange.to)

      // Filtro por nacionalidad
      const matchesNationality = filters.nationality === "all" ||
        (filters.nationality === "Sin especificar" && (!user.nacionalidad || user.nacionalidad === "")) ||
        (user.nacionalidad && user.nacionalidad === filters.nationality)

      return matchesSearch && matchesRole && matchesActivity && matchesDateRange && matchesNationality
    })
  }
  
  const filteredUsers = applyAdvancedFilters(currentUsers)

  // Estadísticas generales
  const totalStats = {
    total: usuariosAdminModerador.length + usuariosNormales.length,
    adminModerator: usuariosAdminModerador.length,
    normal: usuariosNormales.length,
    verified: [...usuariosAdminModerador, ...usuariosNormales].filter((u) => u.email_verified).length,
    unverified: [...usuariosAdminModerador, ...usuariosNormales].filter((u) => !u.email_verified).length,
    admins: usuariosAdminModerador.filter((u) => u.rol === "admin").length,
    internoes: usuariosAdminModerador.filter((u) => u.rol === "interno").length,
  }

  const getRoleBadge = (rol: string) => {
    const variants = {
      admin: "bg-red-100 text-red-700 border-red-200",
      interno: "bg-yellow-100 text-yellow-700 border-yellow-200",
      usuario: "bg-green-100 text-green-700 border-green-200",
    }
    return variants[rol as keyof typeof variants] || variants.usuario
  }

  const getVerifiedBadge = (verified: boolean) => {
    return verified
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-700 border-gray-200"
  }

  // Funciones para manejar filtros
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({
      role: "all",
      activityStatus: "all",
      nationality: "all",
      dateRange: { from: undefined, to: undefined },
      searchTerm: ""
    })
    setSearchTerm("")
  }

  const renderUserTable = (showActions: boolean = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Nacionalidad</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Fecha Creación</TableHead>
          <TableHead>Creado por Admin</TableHead>
          {showActions && <TableHead className="text-center">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8">
              Cargando usuarios...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8 text-red-600">
              Error: {error}
            </TableCell>
          </TableRow>
        ) : filteredUsers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8">
              No se encontraron usuarios
            </TableCell>
          </TableRow>
        ) : (
          filteredUsers.map((user) => (
            <TableRow key={user.email}>
              <TableCell className="font-roboto-medium">
                {user.nombre_completo || "Sin nombre"}
              </TableCell>
              <TableCell className="font-roboto-medium">{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", getRoleBadge(user.rol))}>
                  {user.rol}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600 font-roboto-regular">
                {user.nacionalidad || "No especificada"}
              </TableCell>
              <TableCell className="text-gray-600 font-roboto-regular">
                {user.telefono || "No especificado"}
              </TableCell>
              <TableCell className="text-gray-600 font-roboto-regular">
                {new Date(user.created_at).toLocaleDateString('es-ES')}
              </TableCell>
              <TableCell className="text-center">
                {user.created_by_admin ? (
                  <Check className="w-5 h-5 text-gray-700 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                )}
              </TableCell>
              {showActions && (
                <TableCell className="text-center">
                  <UserActions user={user} />
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-roboto-bold text-dark-gray">Gestión de Usuarios</h2>
          <p className="text-gray-600 font-roboto-regular">Administra todos los usuarios del sistema</p>
        </div>
        <AddUserDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Total</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{totalStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Admin/Interno</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{totalStats.adminModerator}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Usuarios</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{totalStats.normal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Verificados</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{totalStats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <UserX className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Sin verificar</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{totalStats.unverified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Settings className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Admins</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{totalStats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-2">
            <TabsTrigger 
              value="admin-moderator" 
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Administradores y Usuarios Internos
            </TabsTrigger>
            <TabsTrigger 
              value="normal-users" 
              className="flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Usuarios Normales
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-roboto-regular"
              />
            </div>
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
              isOpen={isFiltersOpen}
              onToggle={() => setIsFiltersOpen(!isFiltersOpen)}
              activeTab={activeTab}
            />
          </div>
        </div>

        <TabsContent value="admin-moderator" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-roboto-bold">Administradores y Usuarios Internos</CardTitle>
                  <CardDescription className="font-roboto-regular">
                    {filteredUsers.length} de {usuariosAdminModerador.length} usuarios con permisos especiales
                    {Object.values(filters).some(value => 
                      typeof value === 'string' ? value !== '' && value !== 'all' : 
                      typeof value === 'object' && value !== null ? 
                        Object.values(value).some(v => v !== undefined && v !== '') : false
                    ) && (
                      <span className="text-blue-600 ml-2">• Filtros activos</span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderUserTable(true)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="normal-users" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-roboto-bold">Usuarios Normales</CardTitle>
                  <CardDescription className="font-roboto-regular">
                    {filteredUsers.length} de {usuariosNormales.length} usuarios del sistema
                    {Object.values(filters).some(value => 
                      typeof value === 'string' ? value !== '' && value !== 'all' : 
                      typeof value === 'object' && value !== null ? 
                        Object.values(value).some(v => v !== undefined && v !== '') : false
                    ) && (
                      <span className="text-blue-600 ml-2">• Filtros activos</span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderUserTable(true)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}