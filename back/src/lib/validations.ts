import { z } from 'zod';

// Validaciones para usuarios
export const createUsuarioSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es requerido')
    .max(255, 'El email es demasiado largo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  rol: z
    .enum(['admin', 'usuario', 'moderador'])
    .default('usuario')
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
    .optional(),
  rol: z
    .enum(['admin', 'usuario', 'moderador'])
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
});

export const usuarioParamsSchema = z.object({
  id: z
    .string()
    .min(1, 'El ID es requerido')
    .max(50, 'El ID es demasiado largo'),
});

// Validaciones para recupero de contraseña
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es requerido'),
});

export const verifyCodeSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es requerido'),
  code: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'El token es requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
});

// Tipos TypeScript derivados de los schemas
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type UsuarioParams = z.infer<typeof usuarioParamsSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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
