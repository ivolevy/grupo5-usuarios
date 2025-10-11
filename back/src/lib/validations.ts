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
  email: z
    .string()
    .email('Debe ser un email válido')
    .max(255, 'El email es demasiado largo')
    .optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga')
    .optional(),
  rol: z
    .enum(['admin', 'usuario', 'moderador'])
    .optional(),
  nombre_completo: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .max(255, 'El nombre completo es demasiado largo')
    .optional(),
  telefono: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .optional(),
  nacionalidad: z
    .string()
    .max(100, 'La nacionalidad es demasiado larga')
    .optional(),
});

export const usuarioParamsSchema = z.object({
  id: z
    .string()
    .uuid('Debe ser un UUID válido'),
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
