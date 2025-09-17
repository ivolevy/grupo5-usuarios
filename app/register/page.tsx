"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "usuario"
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
    setSuccess("")
  }

  const validateForm = () => {
    if (!formData.nombre_completo || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Todos los campos son obligatorios")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return false
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Por favor ingresa un email válido")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_completo: formData.nombre_completo,
          email: formData.email,
          password: formData.password,
          rol: formData.rol
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Usuario registrado exitosamente. Redirigiendo al login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        console.error('Error del servidor:', data)
        setError(data.message || data.error || "Error al registrar usuario")
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/login" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <CardTitle className="text-4xl font-bold text-slate-900">SkyTrack</CardTitle>
              <CardDescription className="text-slate-600 mt-2">Crear nueva cuenta</CardDescription>
            </div>
            <div className="w-5"></div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_completo" className="text-sm font-medium text-slate-700">
                Nombre Completo
              </Label>
              <Input
                id="nombre_completo"
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => handleInputChange("nombre_completo", e.target.value)}
                placeholder="Tu nombre completo"
                required
                className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="usuario@example.com"
                required
                className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirmar Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Rol fijo como usuario - no se muestra en el formulario */}
            <input type="hidden" value="usuario" />

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700 text-sm">{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 mb-2">Requisitos de registro:</p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• Nombre completo es obligatorio</li>
              <li>• Email válido requerido</li>
              <li>• Contraseña mínimo 8 caracteres</li>
              <li>• Se creará como usuario estándar</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
