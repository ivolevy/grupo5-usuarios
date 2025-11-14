"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
    }
  }, [open])

  // Verificar si el email ya existe (con debounce)
  useEffect(() => {
    // Solo verificar si el diálogo está abierto
    if (!open) {
      return
    }

    const checkEmail = async () => {
      // Limpiar error si el email está vacío o no es válido
      if (!formData.email || !formData.email.includes('@')) {
        setEmailError("")
        return
      }

      setIsCheckingEmail(true)
      try {
        const response = await fetch(`/api/usuarios/check-email?email=${encodeURIComponent(formData.email)}`)
        const data = await response.json()
        
        if (data.success && data.exists) {
          setEmailError("Este email ya está registrado en el sistema")
        } else {
          setEmailError("")
        }
      } catch (error) {
        console.error('Error verificando email:', error)
        setEmailError("")
      } finally {
        setIsCheckingEmail(false)
      }
    }

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(checkEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.email, open])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
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

    if (emailError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El email ingresado ya está registrado. Por favor usa otro email.",
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

    setIsSubmitting(true)
    try {
      await addUser({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        nacionalidad: formData.nacionalidad,
        telefono: formData.telefono || undefined,
        created_by_admin: true,
      })
      
      // Cerrar el diálogo (handleOpenChange se encarga de limpiar el formulario)
      setOpen(false)
      
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast({
        variant: "destructive",
        title: "Error al crear usuario",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    // Limpiar el formulario cuando se cierra el diálogo
    if (!newOpen) {
      setFormData({ 
        nombre_completo: "", 
        email: "", 
        password: "", 
        confirmPassword: "", 
        rol: "usuario", 
        nacionalidad: "", 
        telefono: "" 
      })
      setPasswordError("")
      setEmailError("")
      setIsCheckingEmail(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@example.com"
                required
                disabled={isSubmitting}
                className={emailError ? "border-red-500" : ""}
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
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
              disabled={isSubmitting || !!emailError || isCheckingEmail}
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
