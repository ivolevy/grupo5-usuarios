import { NextResponse } from 'next/server';

// GET /api/config - Configuración pública del sistema
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      app: {
        name: 'GrupoUsuarios TP',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      auth: {
        tokenExpiry: '24h',
        passwordRequirements: {
          minLength: 8,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false
        }
      },
      api: {
        version: 'v1',
        rateLimit: {
          requests: 100,
          window: '15m'
        }
      },
      features: {
        userRegistration: true,
        passwordReset: false, // Aún no implementado
        emailVerification: false, // Aún no implementado
        fileUpload: false, // Aún no implementado
        twoFactorAuth: false // Aún no implementado
      },
      endpoints: {
        auth: {
          login: '/api/auth/login',
          refresh: '/api/auth/refresh',
          me: '/api/auth/me'
        },
        users: {
          list: '/api/usuarios',
          create: '/api/usuarios',
          get: '/api/usuarios/[id]',
          update: '/api/usuarios/[id]',
          delete: '/api/usuarios/[id]',
          verify: '/api/usuarios/verify'
        },
        system: {
          health: '/api/health',
          config: '/api/config',
          test: '/api/test'
        },
        admin: {
          metrics: '/api/admin/metrics'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
}
