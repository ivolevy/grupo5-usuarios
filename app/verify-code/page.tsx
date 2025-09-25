"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Shield, Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyCodePage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutos
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Si no hay email, redirigir al forgot-password
      router.push('/forgot-password')
    }
  }, [searchParams, router])

  // Timer para el código
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!code) {
      setError("Por favor ingresa el código de verificación")
      return
    }

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos")
      return
    }

    if (!/^\d{6}$/.test(code)) {
      setError("El código debe contener solo números")
      return
    }

    setIsLoading(true)

    try {
      console.log('🔍 [FRONTEND] Iniciando verificación de código...')
      console.log('📧 [FRONTEND] Email:', email)
      console.log('🔢 [FRONTEND] Código:', code)
      
      const url = '/api/auth/verify-code'
      console.log('🔗 [FRONTEND] URL:', url)
      console.log('📤 [FRONTEND] Enviando POST a:', url)
      
      // Validar código usando el endpoint del backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      })

      console.log('📥 [FRONTEND] Respuesta recibida:')
      console.log('   Status:', response.status)
      console.log('   OK:', response.ok)

      const data = await response.json()
      console.log('📋 [FRONTEND] Datos de respuesta:', data)

      if (data.success) {
        console.log('✅ [FRONTEND] Código verificado correctamente')
        console.log('🔑 [FRONTEND] Token recibido:', data.data?.token ? 'Sí' : 'No')
        setSuccess("Código verificado correctamente")
        // Redirigir a la página de reset de contraseña
        setTimeout(() => {
          console.log('🔄 [FRONTEND] Redirigiendo a reset-password...')
          router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${data.data.token}`)
        }, 1500)
      } else {
        console.log('❌ [FRONTEND] Error en la verificación:', data.message)
        setError(data.message || "Código inválido o expirado")
      }
    } catch (error) {
      console.error('💥 [FRONTEND] Error de conexión:', error)
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      console.log('🏁 [FRONTEND] Finalizando verificación de código')
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      console.log('🔄 [FRONTEND] Reenviando código de verificación...')
      console.log('📧 [FRONTEND] Email:', email)
      
      const url = '/api/auth/forgot'
      console.log('🔗 [FRONTEND] URL:', url)
      console.log('📤 [FRONTEND] Enviando POST a:', url)
      
      // Reenviar código usando el endpoint del backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      console.log('📥 [FRONTEND] Respuesta recibida:')
      console.log('   Status:', response.status)
      console.log('   OK:', response.ok)

      const data = await response.json()
      console.log('📋 [FRONTEND] Datos de respuesta:', data)

      if (data.success) {
        console.log('✅ [FRONTEND] Código reenviado correctamente')
        setSuccess("Código reenviado correctamente")
        setTimeLeft(300) // Resetear el timer
      } else {
        console.log('❌ [FRONTEND] Error al reenviar código:', data.message)
        setError(data.message || "Error al reenviar código")
      }
    } catch (error) {
      console.error('💥 [FRONTEND] Error de conexión al reenviar:', error)
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      console.log('🏁 [FRONTEND] Finalizando reenvío de código')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <CardTitle className="text-4xl font-bold text-slate-900">SkyTrack</CardTitle>
              <CardDescription className="text-slate-600 mt-2">Verificar código</CardDescription>
            </div>
            <div className="w-5"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Código de verificación
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              Ingresa el código de 6 dígitos para continuar:
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
              <Mail className="w-4 h-4" />
              <span className="font-medium">{email}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                Código de verificación
              </Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-center text-lg font-mono tracking-widest"
              />
              <p className="text-xs text-slate-500 text-center">
                Revisa tu email para obtener el código de verificación
              </p>
            </div>

            {timeLeft > 0 && (
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  El código expira en: <span className="font-mono text-orange-600">{formatTime(timeLeft)}</span>
                </p>
              </div>
            )}

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
              disabled={isLoading || timeLeft === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={isLoading || timeLeft > 0}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {timeLeft > 0 ? `Reenviar en ${formatTime(timeLeft)}` : "Reenviar código"}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-slate-600">
                ¿No recibiste el email?{" "}
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  Intentar con otro email
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
