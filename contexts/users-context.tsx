"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  name?: string
  nombre_completo?: string
  telefono?: string
  rol: "admin" | "usuario" | "moderador"
  created_at: string
  last_login_at?: string
  email_verified: boolean
  updated_at: string
}

interface UsersContextType {
  users: User[]
  loading: boolean
  error: string | null
  addUser: (user: { nombre_completo?: string; email: string; password: string; rol?: string }) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  getUserById: (id: string) => User | undefined
  refreshUsers: () => Promise<void>
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/usuarios')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
      } else {
        setError(data.message || 'Error al cargar usuarios')
      }
    } catch (err) {
      setError('Error de conexión al cargar usuarios')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUsers()
  }, [])

  const addUser = async (userData: { nombre_completo?: string; email: string; password: string; rol?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await refreshUsers() // Refresh the list
      } else {
        setError(data.message || 'Error al crear usuario')
        throw new Error(data.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión al crear usuario'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await refreshUsers() // Refresh the list
      } else {
        setError(data.message || 'Error al actualizar usuario')
        throw new Error(data.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión al actualizar usuario'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
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
