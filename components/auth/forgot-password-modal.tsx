"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Mail, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ForgotPasswordState {
  step: 1 | 2 | 3
  email: string
  code: string
  token: string
  isSubmitting: boolean
  errorMsg: string
  successMsg: string
  resendCooldown: number
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [state, setState] = useState<ForgotPasswordState>({
    step: 1,
    email: '',
    code: '',
    token: '',
    isSubmitting: false,
    errorMsg: '',
    successMsg: '',
    resendCooldown: 0
  })

  // Estados para el paso 3 (reset de contraseña)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isCheckingPassword, setIsCheckingPassword] = useState(false)

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setState({
        step: 1,
        email: '',
        code: '',
        token: '',
        isSubmitting: false,
        errorMsg: '',
        successMsg: '',
        resendCooldown: 0
      })
    }
  }, [isOpen])

  // Contador de cooldown para reenvío
  useEffect(() => {
    if (state.resendCooldown > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, resendCooldown: prev.resendCooldown - 1 }))
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.resendCooldown])

  // Resetear estados del paso 3 cuando se cambie de paso
  useEffect(() => {
    if (state.step !== 3) {
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setPasswordError('')
      setIsCheckingPassword(false)
    }
  }, [state.step])

  // Auto-dismiss para las alertas después de 3 segundos
  useEffect(() => {
    if (state.successMsg || state.errorMsg) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, successMsg: '', errorMsg: '' }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.successMsg, state.errorMsg])

  const handleForgotPassword = async (email: string) => {
    setState(prev => ({ ...prev, isSubmitting: true, errorMsg: '', successMsg: '' }))

    try {
      const response = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          step: 2,
          email,
          successMsg: 'Código enviado. Revisa tu email.',
          resendCooldown: 60
        }))
      } else {
        // Mostrar mensaje de error específico
        const errorMessage = data.data?.emailExists === false 
          ? 'El email no está registrado en nuestro sistema.'
          : (data.message || 'Error al enviar código')
        setState(prev => ({ ...prev, errorMsg: errorMessage }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, errorMsg: 'Error de conexión. Intenta nuevamente.' }))
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleVerifyCode = async (email: string, code: string) => {
    setState(prev => ({ ...prev, isSubmitting: true, errorMsg: '', successMsg: '' }))

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          step: 3,
          token: data.data.token,
          successMsg: 'Código verificado correctamente.'
        }))
      } else {
        setState(prev => ({ ...prev, errorMsg: data.message || 'Código inválido' }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, errorMsg: 'Error de conexión. Intenta nuevamente.' }))
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleResetPassword = async (token: string, password: string) => {
    setState(prev => ({ ...prev, isSubmitting: true, errorMsg: '', successMsg: '' }))

    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({ ...prev, successMsg: 'Contraseña actualizada exitosamente.' }))
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setState(prev => ({ ...prev, errorMsg: data.message || 'Error al actualizar contraseña' }))
      }
    } catch (error) {
      setState(prev => ({ ...prev, errorMsg: 'Error de conexión. Intenta nuevamente.' }))
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleResendCode = async () => {
    if (state.resendCooldown > 0) return
    
    setState(prev => ({ ...prev, resendCooldown: 60 }))
    await handleForgotPassword(state.email)
  }

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
          email: state.email,
          newPassword: newPassword 
        })
      })
      const data = await response.json()
      
      if (data.success && data.isSamePassword) {
        setPasswordError("La nueva contraseña no puede ser igual a la contraseña actual")
        return true
      } else {
        // Solo limpiar el error si es el de contraseña igual
        if (passwordError === "La nueva contraseña no puede ser igual a la contraseña actual") {
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

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordError('')
    setState(prev => ({ ...prev, errorMsg: '' }))
    
    // Validar contraseñas en tiempo real
    if (confirmPassword && value !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
    } else if (value.length >= 8) {
      // Verificar si la nueva contraseña es igual a la actual
      checkPasswordSimilarity(value)
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setPasswordError('')
    setState(prev => ({ ...prev, errorMsg: '' }))
    
    // Validar si coincide con la contraseña
    if (password && value !== password) {
      setPasswordError("Las contraseñas no coinciden")
    }
  }

  const goBack = () => {
    setState(prev => ({ 
      ...prev, 
      step: Math.max(1, prev.step - 1) as 1 | 2 | 3, 
      errorMsg: '', 
      successMsg: '' 
    }))
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Mail className="h-12 w-12 text-primary-blue mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Recuperar Contraseña</h3>
        <p className="text-sm text-gray-600">Ingresa tu email para recibir un código de verificación</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={state.email}
          onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
          placeholder="tu@email.com"
          required
        />
      </div>

      <Button
        onClick={() => handleForgotPassword(state.email)}
        disabled={!state.email || state.isSubmitting}
        className="w-full"
      >
        {state.isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar Código'
        )}
      </Button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Shield className="h-12 w-12 text-primary-blue mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Verificar Código</h3>
        <p className="text-sm text-gray-600">
          Ingresa el código de 6 dígitos enviado a <strong>{state.email}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Código de Verificación</Label>
        <Input
          id="code"
          type="text"
          value={state.code}
          onChange={(e) => setState(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
          placeholder="123456"
          maxLength={6}
          className="text-center text-lg tracking-widest"
          required
        />
      </div>

      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={goBack}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Atrás
        </Button>
        <Button
          onClick={() => handleVerifyCode(state.email, state.code)}
          disabled={state.code.length !== 6 || state.isSubmitting}
          className="flex-1"
        >
          {state.isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar'
          )}
        </Button>
      </div>

      <div className="text-center">
        {state.resendCooldown > 0 ? (
          <p className="text-sm text-gray-500">
            Reenviar código en {state.resendCooldown}s
          </p>
        ) : (
          <Button
            variant="link"
            onClick={handleResendCode}
            className="text-sm"
          >
            Reenviar código
          </Button>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => {

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setState(prev => ({ ...prev, errorMsg: '' }))
      setPasswordError('')

      if (password !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden')
        setState(prev => ({ ...prev, errorMsg: 'Las contraseñas no coinciden' }))
        return
      }
      if (password.length < 8) {
        setState(prev => ({ ...prev, errorMsg: 'La contraseña debe tener al menos 8 caracteres' }))
        return
      }
      
      // Verificar si la contraseña es igual a la actual
      const isSamePassword = await checkPasswordSimilarity(password)
      if (isSamePassword) {
        setState(prev => ({ ...prev, errorMsg: 'La nueva contraseña no puede ser igual a la contraseña actual' }))
        return
      }

      handleResetPassword(state.token, password)
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Nueva Contraseña</h3>
          <p className="text-sm text-gray-600">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-slate-700">Requisitos de contraseña:</p>
            <div className="space-y-1 text-xs text-slate-600">
              <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                <CheckCircle className={`w-3 h-3 ${password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`} />
                Mínimo 8 caracteres
              </div>
              <div className={`flex items-center gap-2 ${passwordError !== "La nueva contraseña no puede ser igual a la contraseña actual" && password.length >= 8 ? 'text-green-600' : ''}`}>
                <CheckCircle className={`w-3 h-3 ${passwordError !== "La nueva contraseña no puede ser igual a la contraseña actual" && password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`} />
                Diferente a la contraseña actual
                {isCheckingPassword && <span className="text-xs text-blue-500 ml-1">(verificando...)</span>}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <Button
              type="submit"
              disabled={!password || !confirmPassword || state.isSubmitting || passwordError !== "" || isCheckingPassword}
              className="flex-1"
            >
              {state.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar'
              )}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {state.step === 1 && 'Recuperar Contraseña'}
            {state.step === 2 && 'Verificar Código'}
            {state.step === 3 && 'Nueva Contraseña'}
          </DialogTitle>
        </DialogHeader>

        {state.errorMsg && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700 text-sm">
              {state.errorMsg}
            </AlertDescription>
          </Alert>
        )}

        {state.successMsg && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700 text-sm">
              {state.successMsg}
            </AlertDescription>
          </Alert>
        )}

        {state.step === 1 && renderStep1()}
        {state.step === 2 && renderStep2()}
        {state.step === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  )
}
