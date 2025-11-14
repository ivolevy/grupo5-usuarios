"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useUsers, type User } from "@/contexts/users-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { countries } from "@/lib/countries"

export function AddUserDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "usuario" as User["rol"],
    nacionalidad: "",
    telefono: "",
  })
  const { addUser } = useUsers()
  const { toast } = useToast()

  // Limpiar errores cuando se abra el diálogo
  useEffect(() => {
    if (open) {
      setPasswordError("")
      setEmailError("")
      setFormData({
        nombre_completo: "",
        email: "",
        password: "",
        confirmPassword: "",
        rol: "usuario",
        nacionalidad: "",
        telefono: "",
      })
    }
  }, [open])

  // Verificar si el email existe en la base de datos
  const checkEmailExists = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return false
    }

    try {
      const response = await fetch('/api/usuarios/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      return data.success && data.exists === true
    } catch (error) {
      console.error('Error al verificar email:', error)
      return false
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error de email cuando el usuario modifica el campo
    if (field === "email") {
      setEmailError("")
    }
    
    // Validar contraseñas en tiempo real
    if (field === "password" || field === "confirmPassword") {
      const password = field === "password" ? value : formData.password
      const confirmPassword = field === "confirmPassword" ? value : formData.confirmPassword
      
      if (confirmPassword && password !== confirmPassword) {
        setPasswordError("Las contraseñas no coinciden")
      } else {
        setPasswordError("")
      }
    }
  }

  // Validar email en tiempo real con debounce
  useEffect(() => {
    const email = formData.email.trim()
    
    // Solo validar si el email tiene formato válido y no está vacío
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("")
      return
    }

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(async () => {
      setIsCheckingEmail(true)
      const exists = await checkEmailExists(email)
      setIsCheckingEmail(false)
      
      if (exists) {
        setEmailError("Este email ya está registrado en el sistema")
      } else {
        setEmailError("")
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.email, checkEmailExists])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre_completo || !formData.email || !formData.password || !formData.nacionalidad) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
      })
      return
    }

    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailError("Por favor ingresa un email válido")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un email válido.",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden.",
      })
      return
    }

    // Verificar si el email existe antes de enviar
    setIsCheckingEmail(true)
    const emailExists = await checkEmailExists(formData.email)
    setIsCheckingEmail(false)

    if (emailExists) {
      setEmailError("Este email ya está registrado en el sistema")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Este email ya está registrado en el sistema. Por favor usa otro email.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await addUser({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        nacionalidad: formData.nacionalidad,
        telefono: formData.telefono || undefined,
        created_by_admin: true, // Este usuario fue creado por un admin
      })
      
      setFormData({ nombre_completo: "", email: "", password: "", confirmPassword: "", rol: "usuario", nacionalidad: "", telefono: "" })
      setPasswordError("")
      setEmailError("")
      setOpen(false)
      
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      })
    } catch (error) {
      // Manejar errores específicos del backend
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      
      // Si el error es sobre email duplicado, actualizar el estado
      if (errorMessage.includes("email") || errorMessage.includes("existe")) {
        setEmailError("Este email ya está registrado en el sistema")
      }
      
      toast({
        variant: "destructive",
        title: "Error al crear usuario",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>Completa la información para crear un nuevo usuario en el sistema.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo</Label>
            <Input
              id="nombre_completo"
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              placeholder="Nombre completo del usuario"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="usuario@example.com"
                required
                disabled={isSubmitting || isCheckingEmail}
                className={emailError ? "border-red-500" : ""}
              />
              {isCheckingEmail && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            {emailError && (
              <p className="text-sm text-red-600 mt-1">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Contraseña segura"
              required
              disabled={isSubmitting}
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Repetir contraseña"
              required
              disabled={isSubmitting}
              minLength={8}
            />
            {passwordError && (
              <p className="text-sm text-red-600 mt-1">{passwordError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select
              value={formData.rol}
              onValueChange={(value: User["rol"]) => setFormData({ ...formData, rol: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">Usuario</SelectItem>
                <SelectItem value="interno">Interno</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nacionalidad">Nacionalidad</Label>
            <Select
              value={formData.nacionalidad}
              onValueChange={(value) => setFormData({ ...formData, nacionalidad: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nacionalidad" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono <span className="text-gray-400 text-sm">(Opcional)</span></Label>
            <Input
              id="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
