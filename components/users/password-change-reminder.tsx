"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface PasswordChangeReminderProps {
  userId: string
  createdByAdmin?: boolean
  initialPasswordChanged?: boolean
}

export function PasswordChangeReminder({ userId, createdByAdmin, initialPasswordChanged }: PasswordChangeReminderProps) {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    // Solo mostrar si el usuario fue creado por un admin
    if (!createdByAdmin) {
      return
    }

    // No mostrar si ya cambió la contraseña inicial
    if (initialPasswordChanged) {
      return
    }

    // Verificar si el usuario ya eligió no mostrar esto más (permanente)
    const localStorageKey = `password-reminder-${userId}`
    if (localStorage.getItem(localStorageKey)) {
      return
    }

    // Verificar si ya se mostró en esta sesión
    const sessionStorageKey = `password-reminder-shown-${userId}`
    if (sessionStorage.getItem(sessionStorageKey)) {
      return
    }
    
    // Marcar como mostrado en esta sesión
    sessionStorage.setItem(sessionStorageKey, "true")
    
    // Esperar un momento para que la UI cargue
    setTimeout(() => setOpen(true), 1000)
  }, [userId, createdByAdmin, initialPasswordChanged])

  const handleCancel = () => {
    if (dontShowAgain) {
      // Guardar la preferencia en localStorage
      const localStorageKey = `password-reminder-${userId}`
      localStorage.setItem(localStorageKey, "true")
    }
    setOpen(false)
  }

  const handleAccept = () => {
    if (dontShowAgain) {
      // Guardar la preferencia en localStorage
      const localStorageKey = `password-reminder-${userId}`
      localStorage.setItem(localStorageKey, "true")
    }
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <AlertDialogTitle className="text-xl">
              Cambio de Contraseña Recomendado
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <p>
              Tu cuenta fue creada por un administrador y se te asignó una contraseña temporal.
            </p>
            <p className="font-medium text-amber-600">
              Por tu seguridad, te recomendamos cambiar tu contraseña a una personal y segura.
            </p>
            <p className="text-sm text-slate-500">
              Puedes hacerlo en cualquier momento desde tu perfil.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox 
            id="dont-show-again" 
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label 
            htmlFor="dont-show-again" 
            className="text-sm font-normal cursor-pointer"
          >
            No volver a mostrarme esta advertencia
          </Label>
        </div>

        <AlertDialogFooter className="flex gap-4 sm:gap-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Más tarde
          </Button>
          <Button 
            onClick={handleAccept}
            className="w-full sm:w-auto"
          >
            Entendido
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

