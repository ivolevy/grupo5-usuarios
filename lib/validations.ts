import { z } from 'zod';

// Validaciones para usuarios
export const createUsuarioSchema = z.object({
  nombre_completo: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .max(200, 'El nombre completo es demasiado largo')
    .optional(),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Debe ser un email válido')
    .max(255, 'El email es demasiado largo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  rol: z
    .enum(['admin', 'usuario', 'interno'])
    .default('usuario')
    .optional(),
  nacionalidad: z
    .string()
    .min(1, 'La nacionalidad es requerida')
    .max(100, 'La nacionalidad es demasiado larga'),
  telefono: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'El teléfono debe contener solo números, espacios, guiones y paréntesis')
    .optional()
    .transform(val => val === '' ? undefined : val),
  created_by_admin: z
    .boolean()
    .optional(),
});

export const updateUsuarioSchema = z.object({
  nombre_completo: z
    .string()
    .max(200, 'El nombre completo es demasiado largo')
    .optional()
    .transform(val => val === '' ? undefined : val),
  email: z
    .string()
    .email('Debe ser un email válido')
    .max(255, 'El email es demasiado largo')
    .optional()
    .transform(val => val === '' ? undefined : val),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga')
    .optional()
    .transform(val => val === '' ? undefined : val),
  rol: z
    .enum(['admin', 'usuario', 'interno'])
    .optional(),
  email_verified: z
    .boolean()
    .optional(),
  nacionalidad: z
    .string()
    .max(100, 'La nacionalidad es demasiado larga')
    .optional()
    .transform(val => val === '' ? undefined : val),
  telefono: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'El teléfono debe contener solo números, espacios, guiones y paréntesis')
    .optional()
    .transform(val => val === '' ? undefined : val),
  initial_password_changed: z
    .boolean()
    .optional(),
});

export const updateProfileSchema = z.object({
  nombre_completo: z
    .string()
    .max(200, 'El nombre completo es demasiado largo')
    .optional()
    .transform(val => val === '' ? undefined : val),
  email: z
    .string()
    .email('Debe ser un email válido')
    .max(255, 'El email es demasiado largo')
    .optional()
    .transform(val => val === '' ? undefined : val),
  nacionalidad: z
    .string()
    .max(100, 'La nacionalidad es demasiado larga')
    .optional()
    .transform(val => val === '' ? undefined : val),
  telefono: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'El teléfono debe contener solo números, espacios, guiones y paréntesis')
    .optional()
    .transform(val => val === '' ? undefined : val),
  currentPassword: z
    .string()
    .optional(),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128, 'La nueva contraseña es demasiado larga')
    .optional(),
});

export const usuarioParamsSchema = z.object({
  id: z
    .string()
    .min(1, 'El ID es requerido')
    .max(255, 'El ID es demasiado largo'),
});

// Schemas adicionales usados en pruebas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Debe ser un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  confirmPassword: z
    .string()
    .min(1, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Debe ser un email válido'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'El token es requerido'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  confirmPassword: z
    .string()
    .min(1, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Tipos TypeScript derivados de los schemas
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UsuarioParams = z.infer<typeof usuarioParamsSchema>;

// Función helper para validar datos
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
}
