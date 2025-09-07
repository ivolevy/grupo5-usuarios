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
