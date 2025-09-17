"use client"

import { useState } from "react"
import { useUsers } from "@/contexts/users-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddUserDialog } from "@/components/users/add-user-dialog"
import { UserActions } from "@/components/users/user-actions"
import { AccessDenied } from "@/components/ui/access-denied"
import { Search, Users, UserCheck, UserX, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { hasPermission, Permission } from "@/lib/permissions"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { users, loading, error } = useUsers()
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

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nombre_completo && user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.email_verified).length,
    unverified: users.filter((u) => !u.email_verified).length,
    admins: users.filter((u) => u.rol === "admin").length,
  }

  const getRoleBadge = (rol: string) => {
    const variants = {
      admin: "bg-red-100 text-red-700 border-red-200",
      moderador: "bg-yellow-100 text-yellow-700 border-yellow-200",
      usuario: "bg-green-100 text-green-700 border-green-200",
    }
    return variants[rol as keyof typeof variants] || variants.usuario
  }

  const getVerifiedBadge = (verified: boolean) => {
    return verified
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-700 border-gray-200"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-roboto-bold text-dark-gray">Gestión de Usuarios</h2>
          <p className="text-gray-600 font-roboto-regular">Administra los usuarios del sistema</p>
        </div>
        <AddUserDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Total</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{stats.total}</p>
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
                <p className="text-sm font-roboto-medium text-gray-600">Verificados</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{stats.verified}</p>
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
                <p className="text-xl font-roboto-bold text-dark-gray">{stats.unverified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-roboto-medium text-gray-600">Admins</p>
                <p className="text-xl font-roboto-bold text-dark-gray">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-roboto-bold">Lista de Usuarios</CardTitle>
              <CardDescription className="font-roboto-regular">
                {filteredUsers.length} de {users.length} usuarios
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-roboto-regular"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-red-600">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-roboto-medium">
                      {user.nombre_completo || "Sin nombre"}
                    </TableCell>
                    <TableCell className="font-roboto-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getRoleBadge(user.rol))}>
                        {user.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getVerifiedBadge(user.email_verified))}>
                        {user.email_verified ? "Verificado" : "Sin verificar"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 font-roboto-regular">
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-gray-600 font-roboto-regular">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('es-ES') : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions user={user} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
