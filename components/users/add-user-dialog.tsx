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
import { Plus, Loader2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { countries } from "@/lib/countries"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AddUserDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])

  const handleInputChange = (field: string, value: string) => {
    // Validar nombre: solo letras y espacios, máximo 35 caracteres
    if (field === "nombre_completo") {
      // Solo permitir letras, espacios y caracteres acentuados
      const lettersOnly = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
      // Limitar a 35 caracteres
      const limited = lettersOnly.slice(0, 35)
      setFormData(prev => ({ ...prev, [field]: limited }))
      return
    }
    
    // Validar contraseña: máximo 30 caracteres
    if (field === "password" || field === "confirmPassword") {
      const limited = value.slice(0, 30)
      setFormData(prev => ({ ...prev, [field]: limited }))
      // Validar contraseñas en tiempo real
      if (field === "password" || field === "confirmPassword") {
        const password = field === "password" ? limited : formData.password
        const confirmPassword = field === "confirmPassword" ? limited : formData.confirmPassword
        
        if (confirmPassword && password !== confirmPassword) {
          setPasswordError("Las contraseñas no coinciden")
        } else {
          setPasswordError("")
        }
      }
      return
    }
    
    // Validar email: solo letras, números, puntos, @, - y _
    if (field === "email") {
      // Solo permitir letras, números, puntos, @, - y _
      const cleaned = value.replace(/[^a-zA-Z0-9.@\-_]/g, "")
      // Limitar a 30 caracteres
      const limited = cleaned.slice(0, 30)
      setFormData(prev => ({ ...prev, [field]: limited }))
      setEmailError("")
      return
    }
    
    // Validar teléfono: validación por patrón (internacional vs local)
    if (field === "telefono") {
      // Permitir solo números, +, espacios, guiones, paréntesis
      let cleaned = value.replace(/[^0-9+\s\-()]/g, "")
      
      // Detectar si es formato internacional (empieza con +)
      const isInternational = cleaned.startsWith('+')
      
      if (isInternational) {
        // Formato internacional: +[1-3 dígitos código país] [resto]
        // Asegurar que solo haya un + y esté al inicio
        cleaned = '+' + cleaned.replace(/\+/g, '')
        
        // Extraer código de país (1-3 dígitos después del +)
        const afterPlus = cleaned.slice(1)
        const countryCodeMatch = afterPlus.match(/^(\d{1,3})/)
        const countryCode = countryCodeMatch ? countryCodeMatch[1] : ''
        const restOfNumber = afterPlus.slice(countryCode.length)
        
        // Limpiar el resto del número (solo dígitos, espacios, guiones, paréntesis)
        let cleanedRest = restOfNumber.replace(/[^0-9\s\-()]/g, "")
        
        // Prevenir múltiples caracteres especiales consecutivos
        cleanedRest = cleanedRest
          .replace(/\s{2,}/g, ' ') // Múltiples espacios -> un solo espacio
          .replace(/-{2,}/g, '-') // Múltiples guiones -> un solo guion
          .replace(/\({2,}/g, '(') // Múltiples paréntesis abiertos -> uno solo
          .replace(/\){2,}/g, ')') // Múltiples paréntesis cerrados -> uno solo
          .replace(/\(\)/g, '') // Eliminar paréntesis vacíos
        
        // Contar dígitos totales (código país + resto)
        const allDigits = (countryCode + cleanedRest).replace(/[^0-9]/g, "")
        
        // Limitar a 15 dígitos totales
        if (allDigits.length > 15) {
          let result = '+'
          let digitCount = 0
          let lastChar = '+'
          
          // Agregar código de país (máximo 3 dígitos)
          for (let i = 0; i < Math.min(countryCode.length, 3); i++) {
            result += countryCode[i]
            digitCount++
            lastChar = countryCode[i]
          }
          
          // Agregar resto del número hasta llegar a 15 dígitos
          for (let char of cleanedRest) {
            if (/[0-9]/.test(char)) {
              if (digitCount < 15) {
                result += char
                digitCount++
                lastChar = char
              }
            } else if (/[\s\-()]/.test(char)) {
              // Prevenir caracteres especiales consecutivos
              if (!/[\s\-()]/.test(lastChar)) {
                result += char
                lastChar = char
              }
            }
          }
          
          // Limpiar espacios/guiones/paréntesis al final
          result = result.replace(/[\s\-()]+$/, '')
          
          // Limitar longitud total a 25 caracteres
          const finalResult = result.slice(0, 25)
          setFormData(prev => ({ ...prev, [field]: finalResult }))
        } else {
          // Limpiar espacios/guiones/paréntesis al final
          cleanedRest = cleanedRest.replace(/[\s\-()]+$/, '')
          // Limitar longitud total a 25 caracteres
          const finalResult = ('+' + countryCode + cleanedRest).slice(0, 25)
          setFormData(prev => ({ ...prev, [field]: finalResult }))
        }
      } else {
        // Formato local: sin +, más flexible
        // Eliminar cualquier +
        cleaned = cleaned.replace(/\+/g, '')
        
        // Prevenir múltiples caracteres especiales consecutivos
        cleaned = cleaned
          .replace(/\s{2,}/g, ' ') // Múltiples espacios -> un solo espacio
          .replace(/-{2,}/g, '-') // Múltiples guiones -> un solo guion
          .replace(/\({2,}/g, '(') // Múltiples paréntesis abiertos -> uno solo
          .replace(/\){2,}/g, ')') // Múltiples paréntesis cerrados -> uno solo
          .replace(/\(\)/g, '') // Eliminar paréntesis vacíos
          .replace(/^[\s\-()]+|[\s\-()]+$/g, '') // Eliminar espacios/guiones/paréntesis al inicio/final
        
        // Contar solo los dígitos numéricos
        const digitsOnly = cleaned.replace(/[^0-9]/g, "")
        
        // Si tiene más de 15 dígitos, truncar
        if (digitsOnly.length > 15) {
          let result = ""
          let digitCount = 0
          let lastChar = ""
          for (let char of cleaned) {
            if (/[0-9]/.test(char)) {
              if (digitCount < 15) {
                result += char
                digitCount++
                lastChar = char
              }
            } else if (/[\s\-()]/.test(char)) {
              // Prevenir caracteres especiales consecutivos
              if (!/[\s\-()]/.test(lastChar)) {
                result += char
                lastChar = char
              }
            }
          }
          // Limpiar espacios/guiones/paréntesis al final
          result = result.replace(/[\s\-()]+$/, '')
          // Limitar longitud total a 20 caracteres
          const finalResult = result.slice(0, 20)
          setFormData(prev => ({ ...prev, [field]: finalResult }))
        } else {
          // Limitar longitud total a 20 caracteres
          const finalResult = cleaned.slice(0, 20)
          setFormData(prev => ({ ...prev, [field]: finalResult }))
        }
      }
      return
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error de email cuando se cambia el email
    if (field === "email") {
      setEmailError("")
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
    setEmailError("")
    setPasswordError("")
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
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      
      // Verificar si es un error de email duplicado
      if (errorMessage.includes("email") || errorMessage.includes("Email") || errorMessage.includes("ya existe")) {
        setEmailError(errorMessage)
      } else {
        // Para otros errores, mostrar en toast
        toast({
          variant: "destructive",
          title: "Error al crear usuario",
          description: errorMessage,
        })
      }
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
              onChange={(e) => handleInputChange("nombre_completo", e.target.value)}
              placeholder="Nombre completo del usuario"
              required
              maxLength={35}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="usuario@example.com"
              required
              maxLength={30}
              disabled={isSubmitting}
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <Alert className="border-red-200 bg-red-50 py-2">
                <AlertDescription className="text-red-700 text-sm">{emailError}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Contraseña segura"
                required
                disabled={isSubmitting}
                minLength={8}
                maxLength={30}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Repetir contraseña"
                required
                disabled={isSubmitting}
                minLength={8}
                maxLength={30}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordError && (
              <Alert className="border-red-200 bg-red-50 py-2">
                <AlertDescription className="text-red-700 text-sm">{passwordError}</AlertDescription>
              </Alert>
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
              onChange={(e) => handleInputChange("telefono", e.target.value)}
              placeholder="+1 (555) 123-4567"
              maxLength={20}
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
