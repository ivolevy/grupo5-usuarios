import { 
  createUsuarioSchema, 
  updateUsuarioSchema, 
  loginSchema, 
  changePasswordSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '@/lib/validations'

describe('User Validation Schemas', () => {
  describe('createUsuarioSchema', () => {
    const validUserData = {
      nombre_completo: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'Password123!',
      rol: 'usuario' as const,
      nacionalidad: 'Argentina',
      telefono: '+54 11 1234-5678'
    }

    it('should validate correct user data', () => {
      const result = createUsuarioSchema.safeParse(validUserData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('juan@example.com')
        expect(result.data.rol).toBe('usuario')
      }
    })

    it('should reject invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' }
      const result = createUsuarioSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['email'],
            message: 'Debe ser un email válido'
          })
        )
      }
    })

    it('should reject short password', () => {
      const invalidData = { ...validUserData, password: '123' }
      const result = createUsuarioSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['password'],
            message: 'La contraseña debe tener al menos 8 caracteres'
          })
        )
      }
    })

    it('should reject invalid role', () => {
      const invalidData = { ...validUserData, rol: 'invalid-role' as any }
      const result = createUsuarioSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid phone format', () => {
      const invalidData = { ...validUserData, telefono: 'abc123' }
      const result = createUsuarioSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['telefono'],
            message: 'El teléfono debe contener solo números, espacios, guiones y paréntesis'
          })
        )
      }
    })

    it('should accept valid phone formats', () => {
      const phoneFormats = [
        '+54 11 1234-5678',
        '(011) 1234-5678',
        '011 1234 5678',
        '+1234567890',
        '1234567890'
      ]

      phoneFormats.forEach(telefono => {
        const data = { ...validUserData, telefono }
        const result = createUsuarioSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty required fields', () => {
      const invalidData = { ...validUserData, email: '', password: '' }
      const result = createUsuarioSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const emailError = result.error.issues.find(issue => issue.path[0] === 'email')
        const passwordError = result.error.issues.find(issue => issue.path[0] === 'password')
        expect(emailError?.message).toBe('El email es requerido')
        expect(passwordError?.message).toBe('La contraseña debe tener al menos 8 caracteres')
      }
    })

    it('should reject overly long fields', () => {
      const longString = 'a'.repeat(300)
      const invalidData = {
        ...validUserData,
        nombre_completo: 'a'.repeat(201),
        email: longString + '@example.com',
        password: 'a'.repeat(129),
        nacionalidad: 'a'.repeat(101),
        telefono: 'a'.repeat(21)
      }
      const result = createUsuarioSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateUsuarioSchema', () => {
    const validUpdateData = {
      nombre_completo: 'Juan Carlos Pérez',
      nacionalidad: 'Chile',
      telefono: '+56 2 1234-5678'
    }

    it('should validate correct update data', () => {
      const result = updateUsuarioSchema.safeParse(validUpdateData)
      expect(result.success).toBe(true)
    })

    it('should accept partial updates', () => {
      const partialData = { nombre_completo: 'Juan Carlos' }
      const result = updateUsuarioSchema.safeParse(partialData)
      expect(result.success).toBe(true)
    })

    it('should accept empty object for updates', () => {
      const result = updateUsuarioSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject invalid phone in updates', () => {
      const invalidData = { telefono: 'invalid-phone' }
      const result = updateUsuarioSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      }
      const result = loginSchema.safeParse(loginData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123'
      }
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty fields', () => {
      const invalidData = { email: '', password: '' }
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate correct password change data', () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      const result = changePasswordSchema.safeParse(passwordData)
      expect(result.success).toBe(true)
    })

    it('should reject short new password', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'short',
        confirmPassword: 'short'
      }
      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword123'
      }
      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            message: 'Las contraseñas no coinciden'
          })
        )
      }
    })

    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('should validate correct email', () => {
      const emailData = { email: 'user@example.com' }
      const result = forgotPasswordSchema.safeParse(emailData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = { email: 'not-an-email' }
      const result = forgotPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const invalidData = { email: '' }
      const result = forgotPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('should validate correct reset password data', () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      const result = resetPasswordSchema.safeParse(resetData)
      expect(result.success).toBe(true)
    })

    it('should reject short password', () => {
      const invalidData = {
        token: 'valid-reset-token',
        newPassword: 'short',
        confirmPassword: 'short'
      }
      const result = resetPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        token: 'valid-reset-token',
        newPassword: 'password123',
        confirmPassword: 'different123'
      }
      const result = resetPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
        newPassword: 'password123',
        confirmPassword: 'password123'
      }
      const result = resetPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
