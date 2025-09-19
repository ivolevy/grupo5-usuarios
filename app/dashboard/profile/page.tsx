"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, User, Mail, Shield, Calendar, Clock, Key, Eye, EyeOff, Lock } from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  rol: "admin" | "usuario" | "moderador"
  email_verified: boolean
  created_at: string
  last_login_at?: string
  nombre_completo?: string
  telefono?: string
}

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        console.log('Usuario actual:', user) // Debug para ver qué datos tiene
        
        // Si el usuario no tiene nombre_completo, refrescar desde el servidor
        if (!user.nombre_completo) {
          console.log('Usuario sin nombre_completo, refrescando desde servidor...')
          await refreshUser()
        }
        
        setProfile(user)
        
        // Solo actualizar formData si no está en modo edición
        if (!isEditing) {
          setFormData({
            nombre_completo: user.nombre_completo || "",
            email: user.email || "",
          })
        }
        setIsLoading(false)
      }
    }
    
    loadUserData()
  }, [user, refreshUser, isEditing])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!token) {
      toast.error("No se encontró el token de autenticación")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/usuarios/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Perfil actualizado correctamente")
        // Actualizar el perfil local
        setProfile(prev => prev ? { ...prev, ...formData } : null)
        setIsEditing(false) // Salir del modo edición
      } else {
        toast.error(data.message || "Error al actualizar el perfil")
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      toast.error("Error de conexión al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Restaurar los datos originales
    if (profile) {
      setFormData({
        nombre_completo: profile.nombre_completo || "",
        email: profile.email || "",
      })
    }
    setIsEditing(false)
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error cuando el usuario empiece a escribir
    if (passwordError) {
      setPasswordError("")
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: "La contraseña debe tener al menos 8 caracteres" }
    }
    // Eliminadas las validaciones de letras y caracteres especiales
    return { isValid: true, message: "" }
  }

  const handlePasswordChange = async () => {
    setPasswordError("")

    // Validar campos requeridos
    if (!passwordData.currentPassword.trim()) {
      setPasswordError("La contraseña actual es requerida")
      return
    }

    if (!passwordData.newPassword.trim()) {
      setPasswordError("La nueva contraseña es requerida")
      return
    }

    if (!passwordData.confirmPassword.trim()) {
      setPasswordError("La confirmación de contraseña es requerida")
      return
    }

    // Validar que la nueva contraseña sea diferente a la actual
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la actual")
      return
    }

    // Validar nueva contraseña
    const passwordValidation = validatePassword(passwordData.newPassword)
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message)
      return
    }

    // Validar confirmación
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    setIsSavingPassword(true)

    try {
      // Llamada real a la API para cambiar contraseña
      const response = await fetch('/api/usuarios/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setPasswordError(data.message || "Error al cambiar la contraseña")
        toast.error(data.message || "Error al cambiar la contraseña")
        return
      }
      
      toast.success("Contraseña cambiada exitosamente")
      
      // Limpiar formulario y cerrar sección
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsChangingPassword(false)
      
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError("Error de conexión. Intenta nuevamente.")
      toast.error("Error de conexión. Intenta nuevamente.")
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setPasswordError("")
    setIsChangingPassword(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No se pudo cargar el perfil del usuario</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal y configuración</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del perfil */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información personal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>
                    {isEditing ? "Edita tu información personal" : "Tu información personal"}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="nombre_completo">Nombre Completo</Label>
                    <Input
                      id="nombre_completo"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleInputChange}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                    />
                  </div>

                  {/* Sección de cambio de contraseña */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Cambiar Contraseña
                        </h3>
                        <p className="text-sm text-gray-600">Actualiza tu contraseña para mantener tu cuenta segura</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        {isChangingPassword ? "Cancelar" : "Cambiar"}
                      </Button>
                    </div>

                    {isChangingPassword && (
                      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <Label htmlFor="currentPassword">Contraseña Actual</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={handlePasswordInputChange}
                              placeholder="••••••••"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('current')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="newPassword">Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={handlePasswordInputChange}
                              placeholder="••••••••"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('new')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordInputChange}
                              placeholder="••••••••"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirm')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {passwordError && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-700 text-sm">{passwordError}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handlePasswordChange}
                            disabled={isSavingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="flex-1"
                          >
                            {isSavingPassword ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Cambiando...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4 mr-2" />
                                Cambiar Contraseña
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleCancelPasswordChange}
                            variant="outline"
                            disabled={isSavingPassword}
                          >
                            Cancelar
                          </Button>
                        </div>

                        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                          <p className="font-medium mb-1">Requisitos de contraseña:</p>
                          <ul className="space-y-1">
                            <li>• Mínimo 8 caracteres</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Nombre Completo</Label>
                      <p className="text-lg font-medium text-gray-900 mt-1">
                        {profile.nombre_completo || (
                          <span className="text-gray-400 italic">No especificado - Haz clic en "Editar Perfil" para agregarlo</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-lg font-medium text-gray-900 mt-1">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información de la cuenta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Información de la Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.nombre_completo && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Nombre completo</p>
                    <p className="text-sm text-gray-600">{profile.nombre_completo}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email verificado</p>
                  <Badge variant={profile.email_verified ? "default" : "destructive"}>
                    {profile.email_verified ? "Verificado" : "No verificado"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Rol</p>
                  <Badge 
                    variant={
                      profile.rol === "admin" ? "destructive" :
                      profile.rol === "moderador" ? "secondary" : "default"
                    }
                  >
                    {profile.rol}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Miembro desde</p>
                  <p className="text-sm text-gray-600">
                    {new Date(profile.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {profile.last_login_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Último acceso</p>
                    <p className="text-sm text-gray-600">
                      {new Date(profile.last_login_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
