"use client"

import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { PasswordChangeReminder } from "./password-change-reminder"
export function PasswordReminderWrapper() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // NO mostrar en páginas de autenticación públicas
  const isPublicAuthPage = pathname?.startsWith('/login') || 
                           pathname?.startsWith('/register') || 
                           pathname?.startsWith('/forgot-password') ||
                           pathname?.startsWith('/reset-password') ||
                           pathname?.startsWith('/verify-code')
  
  // No mostrar el popup en páginas públicas de autenticación
  if (isPublicAuthPage) {
    return null
  }
  
  if (!user) {
    return null
  }

  return (
    <PasswordChangeReminder 
      userId={user.id} 
      createdByAdmin={user.created_by_admin} 
      initialPasswordChanged={user.initial_password_changed} 
    />
  )
}

