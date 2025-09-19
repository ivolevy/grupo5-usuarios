"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react'

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
        setState(prev => ({ ...prev, errorMsg: data.message || 'Error al enviar código' }))
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

  const goBack = () => {
    setState(prev => ({ ...prev, step: prev.step - 1, errorMsg: '', successMsg: '' }))
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
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (password !== confirmPassword) {
        setState(prev => ({ ...prev, errorMsg: 'Las contraseñas no coinciden' }))
        return
      }
      if (password.length < 8) {
        setState(prev => ({ ...prev, errorMsg: 'La contraseña debe tener al menos 8 caracteres' }))
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
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
              disabled={!password || !confirmPassword || state.isSubmitting}
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
