"use client"

import { useState } from "react"
import { useUsers, type User as UsersContextUser } from "@/contexts/users-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("admin-moderator")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    role: "all",
    activityStatus: "all",
    verificationStatus: "all",
    nationality: "all",
    dateRange: { from: undefined, to: undefined },
    searchTerm: ""
  })
  const [selectedUnverifiedUser, setSelectedUnverifiedUser] = useState<UsersContextUser | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isVerifyingUser, setIsVerifyingUser] = useState(false)
  const { getAdminModeratorUsers, getNormalUsers, getUniqueNationalities, loading, error, toggleEmailVerification } = useUsers()
  const { user } = useAuth()
  const { toast } = useToast()

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
  const usuariosNoVerificados = usuariosNormales.filter((usuario) => !usuario.email_verified)
  
  // Filtrar usuarios según la pestaña activa
  const currentUsers = activeTab === "admin-moderator" ? usuariosAdminModerador : usuariosNormales
  
  // Obtener nacionalidades únicas desde LDAP
  const uniqueNationalities = getUniqueNationalities()
  
  // Función de filtrado avanzado
  const applyAdvancedFilters = (users: typeof currentUsers) => {
    let filtered = users.filter((user) => {
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

      // Filtro por verificación - Solo para usuarios normales
      const matchesVerification = activeTab === "admin-moderator" || filters.verificationStatus === "all" ||
        (filters.verificationStatus === "verified" && user.email_verified) ||
        (filters.verificationStatus === "unverified" && !user.email_verified)

      // Filtro por fecha de creación
      const userCreatedAt = new Date(user.created_at)
      const matchesDateRange = (!filters.dateRange.from || userCreatedAt >= filters.dateRange.from) &&
        (!filters.dateRange.to || userCreatedAt <= filters.dateRange.to)

      // Filtro por nacionalidad
      const matchesNationality = filters.nationality === "all" ||
        (filters.nationality === "Sin especificar" && (!user.nacionalidad || user.nacionalidad === "")) ||
        (user.nacionalidad && user.nacionalidad === filters.nationality)

      return matchesSearch && matchesRole && matchesActivity && matchesDateRange && matchesNationality && matchesVerification
    })

    // Ordenar para que el usuario actual aparezca primero
    if (user) {
      filtered = filtered.sort((a, b) => {
        if (a.email === user.email) return -1
        if (b.email === user.email) return 1
        return 0
      })
    }

    return filtered
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
      verificationStatus: "all",
      nationality: "all",
      dateRange: { from: undefined, to: undefined },
      searchTerm: ""
    })
    setSearchTerm("")
  }

  const handleSelectUnverifiedUser = (usuario: UsersContextUser) => {
    setSelectedUnverifiedUser(usuario)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedUnverifiedUser(null)
    setIsVerifyingUser(false)
  }

  const handleVerifySelectedUser = async () => {
    if (!selectedUnverifiedUser) return
    setIsVerifyingUser(true)
    try {
      await toggleEmailVerification(selectedUnverifiedUser.id, selectedUnverifiedUser.email_verified)
      toast({
        title: "Usuario verificado",
        description: `El usuario ${selectedUnverifiedUser.email} ha sido verificado.`
      })
      handleCloseDetails()
    } catch (error) {
      toast({
        title: "Error al verificar",
        description: error instanceof Error ? error.message : "No se pudo verificar el usuario",
        variant: "destructive"
      })
    } finally {
      setIsVerifyingUser(false)
    }
  }

  const renderUserTable = (showActions: boolean = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Nombre Completo</TableHead>
          <TableHead className="text-xs">Email</TableHead>
          <TableHead className="text-xs">Email Verificado</TableHead>
          <TableHead className="text-xs">Rol</TableHead>
          <TableHead className="text-xs">Nacionalidad</TableHead>
          <TableHead className="text-xs">Teléfono</TableHead>
          <TableHead className="text-xs">Fecha Creación</TableHead>
          <TableHead className="text-xs">Creado por Admin</TableHead>
          {showActions && <TableHead className="text-center text-xs">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={showActions ? 9 : 8} className="text-center py-8 text-sm">
              Cargando usuarios...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={showActions ? 9 : 8} className="text-center py-8 text-red-600 text-sm">
              Error: {error}
            </TableCell>
          </TableRow>
        ) : filteredUsers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 9 : 8} className="text-center py-8 text-sm">
              No se encontraron usuarios
            </TableCell>
          </TableRow>
        ) : (
          filteredUsers.map((currentUser) => (
            <TableRow key={currentUser.email}>
              <TableCell className="font-roboto-medium text-xs">
                {currentUser.nombre_completo || "Sin nombre"}
                {user && currentUser.email === user.email && (
                  <span className="ml-2 text-blue-600 font-roboto-regular text-xs">(Tú)</span>
                )}
              </TableCell>
              <TableCell className="font-roboto-medium text-xs">{currentUser.email}</TableCell>
              <TableCell className="text-center">
                {currentUser.email_verified ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                    <X className="w-3 h-3 mr-1" />
                    No verificado
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize text-xs", getRoleBadge(currentUser.rol))}>
                  {currentUser.rol}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600 font-roboto-regular text-xs">
                {currentUser.nacionalidad || "No especificada"}
              </TableCell>
              <TableCell className="text-gray-600 font-roboto-regular text-xs">
                {currentUser.telefono || "No especificado"}
              </TableCell>
              <TableCell className="text-gray-600 font-roboto-regular text-xs">
                {new Date(currentUser.created_at).toLocaleDateString('es-ES')}
              </TableCell>
              <TableCell className="text-center">
                {currentUser.created_by_admin ? (
                  <Check className="w-4 h-4 text-gray-700 mx-auto" />
                ) : (
                  <X className="w-4 h-4 text-gray-400 mx-auto" />
                )}
              </TableCell>
              {showActions && (
                <TableCell className="text-center">
                  <UserActions user={currentUser} />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Internos</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{totalStats.internoes}</p>
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
      </div>

      {/* Unverified users summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-roboto-bold">Usuarios no verificados</CardTitle>
              <CardDescription className="font-roboto-regular">
                {usuariosNoVerificados.length > 0
                  ? `Hay ${usuariosNoVerificados.length} usuarios normales pendientes de verificación`
                  : "Todos los usuarios normales están verificados."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usuariosNoVerificados.length === 0 ? (
            <p className="text-sm text-gray-600 font-roboto-regular">
              No hay usuarios normales pendientes de verificación.
            </p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-auto pr-1">
              {usuariosNoVerificados.map((usuario) => (
                <button
                  key={usuario.id}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary-blue hover:bg-blue-50"
                  onClick={() => handleSelectUnverifiedUser(usuario)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-roboto-medium text-dark-gray truncate">
                        {usuario.nombre_completo || "Sin nombre"}
                      </p>
                      <p className="text-sm text-gray-600 font-roboto-regular truncate">{usuario.email}</p>
                      <p className="text-xs text-gray-500 font-roboto-regular">
                        Registrado el {new Date(usuario.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                        No verificado
                      </Badge>
                      <p className="text-xs text-gray-500 font-roboto-regular">
                        {usuario.nacionalidad || "Nacionalidad no indicada"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              availableNationalities={uniqueNationalities}
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

      <Sheet
        open={isDetailsOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetails()
          } else {
            setIsDetailsOpen(true)
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-2xl flex h-full flex-col p-8">
          <SheetHeader className="px-0 pb-6">
            <SheetTitle>Detalles del usuario</SheetTitle>
            <SheetDescription>
              Información completa del usuario pendiente de verificación.
            </SheetDescription>
          </SheetHeader>
          {selectedUnverifiedUser ? (
            <div className="flex-1 overflow-y-auto px-0 space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500 font-roboto-regular">Nombre completo</p>
                <p className="text-2xl font-roboto-bold text-dark-gray">
                  {selectedUnverifiedUser.nombre_completo || "Sin nombre"}
                </p>
                <p className="mt-3 text-sm text-gray-500 font-roboto-regular">Email</p>
                <p className="text-base font-roboto-medium text-dark-gray break-all">
                  {selectedUnverifiedUser.email}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-roboto-regular uppercase tracking-wide">Rol</p>
                  <Badge
                    variant="outline"
                    className={cn("capitalize mt-2 w-fit", getRoleBadge(selectedUnverifiedUser.rol))}
                  >
                    {selectedUnverifiedUser.rol}
                  </Badge>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-roboto-regular uppercase tracking-wide">Fecha de registro</p>
                  <p className="mt-2 font-roboto-medium text-dark-gray">
                    {new Date(selectedUnverifiedUser.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-roboto-regular uppercase tracking-wide">Último acceso</p>
                  <p className="mt-2 font-roboto-medium text-dark-gray">
                    {selectedUnverifiedUser.last_login_at
                      ? new Date(selectedUnverifiedUser.last_login_at).toLocaleDateString("es-ES")
                      : "Nunca"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-roboto-regular uppercase tracking-wide">Creado por admin</p>
                  <p className="mt-2 font-roboto-medium text-dark-gray">
                    {selectedUnverifiedUser.created_by_admin ? "Sí" : "No"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-roboto-regular uppercase tracking-wide">Nacionalidad</p>
                  <p className="mt-2 font-roboto-medium text-dark-gray">
                    {selectedUnverifiedUser.nacionalidad || "No especificada"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-roboto-regular uppercase tracking-wide">Teléfono</p>
                  <p className="mt-2 font-roboto-medium text-dark-gray">
                    {selectedUnverifiedUser.telefono || "No especificado"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-600 font-roboto-regular flex-1">
              Selecciona un usuario para ver los detalles.
            </p>
          )}
          <SheetFooter className="mt-8 pt-6 px-0 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleCloseDetails}>
              Cancelar
            </Button>
            <Button
              onClick={handleVerifySelectedUser}
              disabled={!selectedUnverifiedUser || isVerifyingUser}
              className="bg-primary-blue hover:bg-blue-700 text-white"
            >
              {isVerifyingUser ? "Verificando..." : "Verificar usuario"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}