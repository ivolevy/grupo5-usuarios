"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  rol: "admin" | "usuario" | "moderador"
  email_verified: boolean
  created_at: string
  last_login_at?: string
  nombre_completo?: string
  telefono?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount and validate token
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("authToken")
      const savedUser = localStorage.getItem("user")
      
      if (savedToken && savedUser) {
        try {
          // Verificar si el token es válido haciendo una petición al servidor
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              // Token válido, mantener la sesión
              setToken(savedToken)
              setUser(JSON.parse(savedUser))
            } else {
              // Token inválido, limpiar datos y redirigir
              localStorage.removeItem("authToken")
              localStorage.removeItem("user")
              document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
              // Solo redirigir si no estamos ya en login o register
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                router.push('/login')
              }
            }
          } else {
            // Token inválido, limpiar datos y redirigir
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            // Solo redirigir si no estamos ya en login o register
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              router.push('/login')
            }
          }
        } catch (error) {
          console.error('Error validating token:', error)
          // En caso de error de red, limpiar datos por seguridad
          localStorage.removeItem("authToken")
          localStorage.removeItem("user")
          document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          // Solo redirigir si no estamos ya en login o register
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            router.push('/login')
          }
        }
      }
      setIsLoading(false)
    }
    
    initializeAuth()
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
        
        // También guardar en cookies para el middleware
        document.cookie = `authToken=${data.data.token}; path=/; max-age=86400; SameSite=Lax`
        
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

  const refreshUser = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/usuarios/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data)
          localStorage.setItem("user", JSON.stringify(data.data))
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    
    // Limpiar cookies
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    
    // Redirigir a la página principal
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading, error }}>
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
