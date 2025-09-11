"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  rol: "admin" | "usuario" | "moderador"
  email_verified: boolean
  created_at: string
  last_login_at?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in on mount
    const savedToken = localStorage.getItem("authToken")
    const savedUser = localStorage.getItem("user")
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('Iniciando login...', { email, password: '***' })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      const data = await response.json()
      console.log('Respuesta del servidor:', data)

      if (data.success && data.data && data.data.token) {
        console.log('Login exitoso, guardando datos...')
        setUser(data.data.user)
        setToken(data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        localStorage.setItem("authToken", data.data.token)
        setIsLoading(false)
        console.log('Datos guardados correctamente')
        return true
      } else {
        console.log('Error en login:', data.message || 'Error de autenticación')
        setError(data.message || 'Error de autenticación')
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.error('Error de conexión:', err)
      setError('Error de conexión: ' + (err instanceof Error ? err.message : 'Error desconocido'))
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
