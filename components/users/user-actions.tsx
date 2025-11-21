"use client"

import { useState } from "react"
import { useUsers, type User } from "@/contexts/users-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditUserDialog } from "@/components/users/edit-user-dialog"
import { MoreHorizontal, Trash2, Edit, ShieldCheck, ShieldX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isTogglingVerification, setIsTogglingVerification] = useState(false)
  const { deleteUser, toggleEmailVerification } = useUsers()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  
  // Verificar si el usuario actual está intentando eliminarse a sí mismo
  const isCurrentUser = currentUser?.id === user.id
  
  // Verificar si el usuario es admin o interno (para mostrar opción de eliminar)
  const isAdminOrInterno = user.rol === 'admin' || user.rol === 'interno'

  const handleDelete = () => {
    deleteUser(user.id)
    setShowDeleteDialog(false)
  }

  const handleToggleVerification = async () => {
    setIsTogglingVerification(true)
    try {
      await toggleEmailVerification(user.id, user.email_verified)
      toast({
        title: "Estado actualizado",
        description: `El email ha sido marcado como ${!user.email_verified ? 'verificado' : 'no verificado'}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el estado de verificación",
        variant: "destructive",
      })
    } finally {
      setIsTogglingVerification(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Mostrar editar para todos los usuarios */}
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Usuario
          </DropdownMenuItem>
          {/* Solo mostrar cambiar verificación para usuarios normales */}
          {user.rol === 'usuario' && (
            <DropdownMenuItem 
              onClick={handleToggleVerification} 
              disabled={isTogglingVerification}
              className={user.email_verified ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
            >
              {user.email_verified ? (
                <>
                  <ShieldX className="mr-2 h-4 w-4" />
                  Marcar como no verificado
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Marcar como verificado
                </>
              )}
            </DropdownMenuItem>
          )}
          {/* Eliminar: 
              - Para admin e internos: SIEMPRE mostrar la opción de eliminar (excepto si es el usuario actual)
              - Para usuarios normales: también mostrar (excepto si es el usuario actual)
          */}
          {!isCurrentUser && (
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario <strong>{user.nombre_completo || user.email}</strong> del
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit user dialog */}
      <EditUserDialog
        user={user}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  )
}
