"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!email) {
      setError("Por favor ingresa tu email")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por favor ingresa un email válido")
      return
    }

    setIsLoading(true)

    try {
      console.log('🌐 [FRONTEND] Iniciando solicitud de recupero de contraseña...')
      console.log('📧 [FRONTEND] Email:', email)
      
      const url = '/api/auth/forgot'
      console.log('🔗 [FRONTEND] URL:', url)
      console.log('📤 [FRONTEND] Enviando POST a:', url)
      
      // Enviar solicitud de recupero de contraseña al backend
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
      console.log('   Headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('📋 [FRONTEND] Datos de respuesta:', data)

      if (data.success) {
        console.log('✅ [FRONTEND] Solicitud exitosa - Email enviado')
        setSuccess("Si el email existe en nuestro sistema, recibirás un código de verificación en unos minutos.")
        // Redirigir a la página de código después de 2 segundos
        setTimeout(() => {
          console.log('🔄 [FRONTEND] Redirigiendo a verify-code...')
          router.push(`/verify-code?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else {
        console.log('❌ [FRONTEND] Error en la respuesta:', data.message)
        setError(data.message || "Error al enviar código de verificación")
      }
    } catch (error) {
      console.error('💥 [FRONTEND] Error de conexión:', error)
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      console.log('🏁 [FRONTEND] Finalizando solicitud de recupero')
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
              <CardDescription className="text-slate-600 mt-2">Recuperar contraseña</CardDescription>
            </div>
            <div className="w-5"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-slate-600 text-sm">
              Ingresa tu email para verificar que esté registrado en el sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Email"
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
