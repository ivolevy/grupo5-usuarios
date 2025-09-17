"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    console.log('Intentando login con:', { email, password: '***' })
    const success = await login(email, password)
    console.log('Resultado del login:', success)
    
    if (success) {
      router.push("/dashboard")
    } else {
      setError("Credenciales inválidas. Intenta con admin@example.com o user@example.com")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-4xl font-roboto-bold text-dark-gray">SkyTrack</CardTitle>
            <CardDescription className="text-gray-600 mt-2 font-roboto-regular">Ingresa tus credenciales para acceder</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-roboto-medium text-dark-gray">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="h-11 border-gray-200 focus:border-primary-blue focus:ring-primary-blue font-roboto-regular"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-roboto-medium text-dark-gray">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 border-gray-200 focus:border-primary-blue focus:ring-primary-blue pr-10 font-roboto-regular"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-primary-blue hover:bg-blue-700 text-white font-roboto-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-roboto-regular">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-primary-blue hover:text-blue-700 font-roboto-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2 font-roboto-medium">Usuarios de prueba:</p>
            <p className="text-xs text-gray-700 font-roboto-regular">• admin@example.com (Admin)</p>
            <p className="text-xs text-gray-700 font-roboto-regular">• user@example.com (Usuario)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
