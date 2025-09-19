"use client"

import { useState } from "react"
import { useUsers, type User } from "@/contexts/users-context"
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
import { MoreHorizontal, Trash2, UserCheck, UserX, Edit } from "lucide-react"

interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { updateUser, deleteUser } = useUsers()

  const handleVerificationToggle = () => {
    updateUser(user.id, { email_verified: !user.email_verified })
  }

  const handleDelete = () => {
    deleteUser(user.id)
    setShowDeleteDialog(false)
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
          {/* Solo mostrar editar para usuarios admin/moderador */}
          {user.rol !== 'usuario' && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Usuario
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleVerificationToggle}>
            {user.email_verified ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Marcar como no verificado
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Marcar como verificado
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
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
