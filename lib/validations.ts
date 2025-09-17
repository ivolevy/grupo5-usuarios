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
    .optional()
    .transform(val => val === '' ? undefined : val),
  rol: z
    .enum(['admin', 'usuario', 'moderador'])
    .optional(),
  email_verified: z
    .boolean()
    .optional(),
});

export const usuarioParamsSchema = z.object({
  id: z
    .string()
    .uuid('Debe ser un UUID válido'),
});

// Tipos TypeScript derivados de los schemas
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
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
