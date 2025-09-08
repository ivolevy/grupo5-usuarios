"use client"

import { useState } from "react"
import { useUsers, type User } from "@/contexts/users-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { MoreHorizontal, Trash2, UserCheck, UserX } from "lucide-react"

interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { updateUser, deleteUser } = useUsers()

  const handleRoleChange = (newRole: User["role"]) => {
    updateUser(user.id, { role: newRole })
  }

  const handleStatusToggle = () => {
    const newStatus = user.status === "active" ? "inactive" : "active"
    updateUser(user.id, { status: newStatus })
  }

  const handleDelete = () => {
    deleteUser(user.id)
    setShowDeleteDialog(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Role selector */}
      <Select value={user.role} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">Usuario</SelectItem>
          <SelectItem value="moderator">Moderador</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleStatusToggle}>
            {user.status === "active" ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Desactivar
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Activar
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario <strong>{user.name}</strong> del
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
    </div>
  )
}
