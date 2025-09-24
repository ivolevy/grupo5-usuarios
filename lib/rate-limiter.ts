// Rate Limiting para proteger contra ataques
import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Limpiar entradas expiradas
  if (store[key] && now > store[key].resetTime) {
    delete store[key];
  }

  // Inicializar si no existe
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs
    };
  }

  store[key].count++;

  const remaining = Math.max(0, maxRequests - store[key].count);
  const success = store[key].count <= maxRequests;

  return {
    success,
    remaining,
    resetTime: store[key].resetTime
  };
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// Rate limiter con diferentes límites para diferentes acciones
export const rateLimiter = {
  async checkLimit(identifier: string, action: string): Promise<{
    allowed: boolean;
    attempts: number;
    resetTime: number;
  }> {
    // Configurar límites específicos por acción
    let maxRequests: number;
    let windowMs: number;

    switch (action) {
      case 'forgot_password':
        maxRequests = 5; // 5 intentos
        windowMs = 15 * 60 * 1000; // 15 minutos
        break;
      case 'verify_code':
        maxRequests = 10; // 10 intentos
        windowMs = 5 * 60 * 1000; // 5 minutos
        break;
      default:
        maxRequests = 10; // 10 intentos por defecto
        windowMs = 15 * 60 * 1000; // 15 minutos
    }

    const result = rateLimit(identifier, maxRequests, windowMs);
    
    return {
      allowed: result.success,
      attempts: maxRequests - result.remaining,
      resetTime: Math.ceil((result.resetTime - Date.now()) / 1000)
    };
  }
};