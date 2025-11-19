"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Eye, EyeOff, Lock, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [isCheckingPassword, setIsCheckingPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('token')
    
    if (emailParam && tokenParam) {
      setEmail(emailParam)
      setToken(tokenParam)
    } else {
      // Si no hay email o token, redirigir al forgot-password
      router.push('/forgot-password')
    }
  }, [searchParams, router])

  // Auto-dismiss para las alertas después de 3 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('')
        setError('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const checkPasswordSimilarity = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 8) return false
    
    try {
      setIsCheckingPassword(true)
      const response = await fetch('/api/usuarios/get-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          newPassword: newPassword 
        })
      })
      const data = await response.json()
      
      if (data.success && data.isSamePassword) {
        setPasswordError("La nueva contraseña debe ser diferente a la contraseña actual")
        return true
      } else {
        // Solo limpiar el error si no hay otros errores
        if (passwordError === "La nueva contraseña debe ser diferente a la contraseña actual") {
          setPasswordError("")
        }
        return false
      }
    } catch (error) {
      return false
    } finally {
      setIsCheckingPassword(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "password") {
      setPassword(value)
    } else if (field === "confirmPassword") {
      setConfirmPassword(value)
    }
    
    setError("")
    setPasswordError("")
    
    // Validar contraseñas en tiempo real
    if (field === "password" || field === "confirmPassword") {
      const currentPasswordValue = field === "password" ? value : password
      const currentConfirmPassword = field === "confirmPassword" ? value : confirmPassword
      
      if (currentConfirmPassword && currentPasswordValue !== currentConfirmPassword) {
        setPasswordError("Las contraseñas no coinciden")
      } else if (field === "password" && value.length >= 8) {
        // Verificar si la nueva contraseña es igual a la actual (solo para el campo password)
        checkPasswordSimilarity(value)
      } else if (passwordError === "Las contraseñas no coinciden" && currentPasswordValue === currentConfirmPassword) {
        setPasswordError("")
      }
    }
  }

  const validatePassword = async (password: string) => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres"
    }
    
    // Verificar si es igual a la contraseña actual
    const isSame = await checkPasswordSimilarity(password)
    if (isSame) {
      return "La nueva contraseña debe ser diferente a la contraseña actual"
    }
    
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!password || !confirmPassword) {
      setError("Por favor completa todos los campos")
      return
    }

    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      setError("Las contraseñas no coinciden")
      return
    }

    const passwordValidation = await validatePassword(password)
    if (passwordValidation) {
      setError(passwordValidation)
      return
    }

    setIsLoading(true)

    try {
      console.log('🔑 [FRONTEND] Iniciando cambio de contraseña...')
      console.log('📧 [FRONTEND] Email:', email)
      console.log('🎫 [FRONTEND] Token:', token ? 'Presente' : 'Ausente')
      console.log('🔒 [FRONTEND] Nueva contraseña:', password ? 'Presente' : 'Ausente')
      
      const url = '/api/auth/reset'
      console.log('🔗 [FRONTEND] URL:', url)
      console.log('📤 [FRONTEND] Enviando POST a:', url)
      
      // Cambiar la contraseña usando el endpoint del backend con token
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: password
        })
      })

      console.log('📥 [FRONTEND] Respuesta recibida:')
      console.log('   Status:', response.status)
      console.log('   OK:', response.ok)

      const data = await response.json()
      console.log('📋 [FRONTEND] Datos de respuesta:', data)

      if (data.success) {
        console.log('✅ [FRONTEND] Contraseña restablecida correctamente')
        setSuccess("Contraseña restablecida correctamente")
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          console.log('🔄 [FRONTEND] Redirigiendo a login...')
          router.push('/login?message=password-reset')
        }, 2000)
      } else {
        console.log('❌ [FRONTEND] Error al cambiar contraseña:', data.message)
        setError(data.message || "Error al cambiar la contraseña")
      }
    } catch (error) {
      console.error('💥 [FRONTEND] Error de conexión:', error)
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      console.log('🏁 [FRONTEND] Finalizando cambio de contraseña')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/verify-code" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <CardTitle className="text-4xl font-bold text-slate-900">SkyTrack</CardTitle>
              <CardDescription className="text-slate-600 mt-2">Nueva contraseña</CardDescription>
            </div>
            <div className="w-5"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Establecer nueva contraseña
            </h2>
            <p className="text-slate-600 text-sm">
              Crea una nueva contraseña segura para tu cuenta.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 mt-4">
              <Mail className="w-4 h-4" />
              <span className="font-medium">{email}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
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
                Confirmar Nueva Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
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
              {passwordError && (
                <p className="text-sm text-red-600 mt-1">{passwordError}</p>
              )}
            </div>

            {/* Requisitos de contraseña */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-slate-700 mb-2">Requisitos de contraseña:</p>
              <div className="space-y-1 text-xs text-slate-600">
                <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`} />
                  Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-2 ${passwordError !== "La nueva contraseña debe ser diferente a la contraseña actual" && password.length >= 8 ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${passwordError !== "La nueva contraseña debe ser diferente a la contraseña actual" && password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`} />
                  Diferente a la contraseña actual
                  {isCheckingPassword && <span className="text-xs text-blue-500 ml-1">(verificando...)</span>}
                </div>
              </div>
            </div>

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
              disabled={isLoading || passwordError !== ""}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                "Restablecer Contraseña"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Volver al login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
