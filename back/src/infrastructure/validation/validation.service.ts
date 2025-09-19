/**
 * Servicio de Validación - Capa de Infraestructura
 * Implementa la validación de datos usando Zod
 */

import { z } from 'zod';

/**
 * Valida datos contra un schema de Zod
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: any): {
  success: boolean;
  data?: T;
  error?: any;
} {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de validación desconocido'
    };
  }
}

/**
 * Valida parámetros de URL
 */
export function validateParams<T>(schema: z.ZodSchema<T>, params: any): {
  success: boolean;
  data?: T;
  error?: any;
} {
  return validateData(schema, params);
}

/**
 * Valida query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, query: any): {
  success: boolean;
  data?: T;
  error?: any;
} {
  return validateData(schema, query);
}
