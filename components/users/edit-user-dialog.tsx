"use client"

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
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Edit, Save, X } from "lucide-react"
import { countries } from "@/lib/countries"

interface EditUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    nombre_completo: user.nombre_completo || "",
    email: user.email,
    rol: user.rol,
    nacionalidad: user.nacionalidad || "",
    telefono: user.telefono || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { updateUser } = useUsers()
  const { toast } = useToast()

  // Actualizar el formulario cuando cambie el usuario
  useEffect(() => {
    setFormData({
      nombre_completo: user.nombre_completo || "",
      email: user.email,
      rol: user.rol,
      nacionalidad: user.nacionalidad || "",
      telefono: user.telefono || "",
    })
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Excluir el email de los datos a actualizar
    const { email, ...dataToUpdate } = formData

    console.log('🔵 [FRONTEND] Datos enviados al backend para actualizar usuario:', {
      userId: user.id,
      formData: dataToUpdate,
      endpoint: `/api/usuarios/${user.id}`
    })

    try {
      await updateUser(user.id, dataToUpdate)
      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario se han actualizado correctamente.",
      })
      onOpenChange(false)
    } catch (error) {
      console.error('❌ [FRONTEND] Error al actualizar usuario:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    // Validar nombre: solo letras y espacios, máximo 35 caracteres
    if (field === "nombre_completo") {
      const stringValue = String(value)
      // Solo permitir letras, espacios y caracteres acentuados
      const lettersOnly = stringValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
      // Limitar a 35 caracteres
      const limited = lettersOnly.slice(0, 35)
      setFormData(prev => ({
        ...prev,
        [field]: limited
      }))
      return
    }
    
    // Validar email: solo letras, números, puntos, @, - y _
    if (field === "email") {
      const stringValue = String(value)
      // Solo permitir letras, números, puntos, @, - y _
      const cleaned = stringValue.replace(/[^a-zA-Z0-9.@\-_]/g, "")
      // Limitar a 30 caracteres
      const limited = cleaned.slice(0, 30)
      setFormData(prev => ({
        ...prev,
        [field]: limited
      }))
      return
    }
    
    // Validar teléfono: validación por patrón (internacional vs local)
    if (field === "telefono") {
      const stringValue = String(value)
      // Permitir solo números, +, espacios, guiones, paréntesis
      let cleaned = stringValue.replace(/[^0-9+\s\-()]/g, "")
      
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
          setFormData(prev => ({
            ...prev,
            [field]: finalResult
          }))
        } else {
          // Limpiar espacios/guiones/paréntesis al final
          cleanedRest = cleanedRest.replace(/[\s\-()]+$/, '')
          // Limitar longitud total a 25 caracteres
          const finalResult = ('+' + countryCode + cleanedRest).slice(0, 25)
          setFormData(prev => ({
            ...prev,
            [field]: finalResult
          }))
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
          setFormData(prev => ({
            ...prev,
            [field]: finalResult
          }))
        } else {
          // Limitar longitud total a 20 caracteres
          const finalResult = cleaned.slice(0, 20)
          setFormData(prev => ({
            ...prev,
            [field]: finalResult
          }))
        }
      }
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario. Los cambios se aplicarán inmediatamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo</Label>
            <Input
              id="nombre_completo"
              value={formData.nombre_completo}
              onChange={(e) => handleInputChange("nombre_completo", e.target.value)}
              placeholder="Ingresa el nombre completo"
              maxLength={35}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="usuario@ejemplo.com"
              maxLength={30}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">El email no se puede modificar</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select
              value={formData.rol}
              onValueChange={(value) => handleInputChange("rol", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="interno">Usuario Interno</SelectItem>
                <SelectItem value="usuario">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nacionalidad">Nacionalidad</Label>
            <Select
              value={formData.nacionalidad}
              onValueChange={(value) => handleInputChange("nacionalidad", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una nacionalidad" />
              </SelectTrigger>
              <SelectContent>
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
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
