"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useAuth } from "./auth-context"

export interface User {
  id: string
  email: string
  name?: string
  nombre_completo?: string
  telefono?: string
  nacionalidad?: string
  rol: "admin" | "usuario" | "interno"
  created_at: string
  last_login_at?: string
  email_verified: boolean
  updated_at: string
  created_by_admin?: boolean
  initial_password_changed?: boolean
}

interface UsersContextType {
  users: User[]
  loading: boolean
  error: string | null
  addUser: (user: { nombre_completo?: string; email: string; password: string; rol?: string; nacionalidad?: string; telefono?: string; created_by_admin?: boolean }) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  getUserById: (id: string) => User | undefined
  refreshUsers: () => Promise<void>
  getUsersByRole: (role: string) => User[]
  getAdminModeratorUsers: () => User[]
  getNormalUsers: () => User[]
  getUniqueNationalities: () => string[]
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user: authUser, token, isLoading: authLoading } = useAuth()

  const refreshUsers = useCallback(async () => {
    // Solo cargar usuarios si el usuario está autenticado
    if (!authUser || !token) {
      setUsers([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
      } else {
        setError(data.message || 'Error al cargar usuarios')
        // Si es un error 401, limpiar usuarios
        if (response.status === 401) {
          setUsers([])
        }
      }
    } catch (err) {
      setError('Error de conexión al cargar usuarios')
      console.error('Error fetching users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [authUser, token])

  // Solo cargar usuarios cuando el usuario esté autenticado
  useEffect(() => {
    if (!authLoading) {
      if (authUser && token) {
        refreshUsers()
      } else {
        // Si no hay usuario autenticado, limpiar la lista
        setUsers([])
      }
    }
  }, [authUser, token, authLoading, refreshUsers])

  const addUser = async (userData: { nombre_completo?: string; email: string; password: string; rol?: string; nacionalidad?: string; telefono?: string; created_by_admin?: boolean }) => {
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    setLoading(true)
    // No limpiar el error global aquí, solo lanzar la excepción para que el modal la maneje
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await refreshUsers() // Refresh the list
      } else {
        const errorMessage = data.message || 'Error al crear usuario'
        // No establecer el error global, solo lanzar la excepción
        throw new Error(errorMessage)
      }
    } catch (err) {
      // No establecer el error global, solo lanzar la excepción para que el modal la maneje
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    setLoading(true)
    setError(null)
    
    console.log('🟢 [CONTEXT] Llamando API para actualizar usuario:', {
      userId: id,
      endpoint: `/api/usuarios/${id}`,
      method: 'PUT',
      body: updates,
      bodyJSON: JSON.stringify(updates)
    })
    
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      })
      
      console.log('🟢 [CONTEXT] Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      const data = await response.json()
      
      console.log('🟢 [CONTEXT] Datos parseados de la respuesta:', data)
      
      if (data.success) {
        await refreshUsers() // Refresh the list
      } else {
        setError(data.message || 'Error al actualizar usuario')
        throw new Error(data.message)
      }
    } catch (err) {
      console.error('🔴 [CONTEXT] Error en updateUser:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión al actualizar usuario'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: string) => {
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        await refreshUsers() // Refresh the list
      } else {
        setError(data.message || 'Error al eliminar usuario')
        throw new Error(data.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión al eliminar usuario'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getUserById = (id: string) => {
    return users.find((user) => user.id === id)
  }

  const getUsersByRole = (role: string) => {
    return users.filter(user => user.rol === role)
  }

  const getAdminModeratorUsers = () => {
    return users.filter(user => user.rol !== "usuario")
  }

  const getNormalUsers = () => {
    return users.filter(user => user.rol === "usuario")
  }

  const getUniqueNationalities = () => {
    const nationalities = new Set<string>()
    
    users.forEach(user => {
      if (user.nacionalidad && user.nacionalidad.trim() !== '') {
        nationalities.add(user.nacionalidad)
      }
    })

    return Array.from(nationalities).sort()
  }

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        getUserById,
        refreshUsers,
        getUsersByRole,
        getAdminModeratorUsers,
        getNormalUsers,
        getUniqueNationalities,
      }}
    >
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider")
  }
  return context
}
