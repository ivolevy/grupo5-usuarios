# Middleware de Autenticación - Grupo5 Usuarios

## 📋 Descripción

Sistema completo de middleware de autenticación para Next.js que incluye:

- ✅ **Autenticación JWT** con verificación de tokens
- ✅ **Sistema de permisos granular** basado en roles
- ✅ **Rate limiting** y logging de seguridad
- ✅ **Middleware wrapper** para simplificar el uso en rutas API
- ✅ **Audit trail** completo de todas las operaciones
- ✅ **Protección de rutas** automática y manual

## 🏗️ Arquitectura

### Archivos principales:

1. **`middleware.ts`** - Middleware principal de Next.js (nivel aplicación)
2. **`src/lib/middleware.ts`** - Funciones de middleware y wrappers
3. **`src/lib/auth.ts`** - Funciones de autenticación JWT
4. **`src/lib/permissions.ts`** - Sistema de permisos granular
5. **`src/lib/auth-middleware-examples.ts`** - Ejemplos de uso

## 🚀 Uso Básico

### 1. Middleware Automático (Nivel Aplicación)

El middleware en `middleware.ts` se ejecuta automáticamente en todas las rutas que coincidan con el patrón configurado.

```typescript
// Se ejecuta automáticamente en todas las rutas /api/*
// Verifica autenticación y permisos según la configuración
```

### 2. Wrapper withAuth (Recomendado)

```typescript
import { withAuth, Permission } from '@/lib/middleware';

// Ruta que requiere autenticación básica
export const GET = withAuth(async (request) => {
  const user = (request as any).user;
  return NextResponse.json({ data: user });
}, {
  requireAuth: true
});

// Ruta que requiere permisos de admin
export const GET_ADMIN = withAuth(async (request) => {
  // Lógica de admin
}, {
  requireAuth: true,
  requiredPermissions: [Permission.ADMIN_DASHBOARD]
});
```

### 3. Verificación Manual

```typescript
import { verifyJWTMiddleware } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const authResult = verifyJWTMiddleware(request);
  
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const user = authResult.user;
  // Lógica de la ruta
}
```

## 🔐 Sistema de Permisos

### Permisos Disponibles:

```typescript
enum Permission {
  // Usuarios
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_READ_ALL = 'user:read_all',
  
  // Administración
  ADMIN_DASHBOARD = 'admin:dashboard',
  ADMIN_LOGS = 'admin:logs',
  ADMIN_SYSTEM = 'admin:system',
  
  // Perfil propio
  PROFILE_READ = 'profile:read',
  PROFILE_UPDATE = 'profile:update',
}
```

### Roles y Permisos:

- **admin**: Todos los permisos
- **interno**: Lectura de usuarios, gestión de perfil propio
- **usuario**: Solo gestión de perfil propio

## 📝 Ejemplos de Uso

### Ruta Pública (Sin Autenticación)

```typescript
export const GET = withAuth(handler, {
  requireAuth: false
});
```

### Ruta con Autenticación Básica

```typescript
export const GET = withAuth(handler, {
  requireAuth: true
});
```

### Ruta con Permisos Específicos

```typescript
export const GET = withAuth(handler, {
  requireAuth: true,
  requiredPermissions: [Permission.ADMIN_DASHBOARD]
});
```

### Ruta con Permisos OR (Cualquiera de los permisos)

```typescript
export const GET = withAuth(handler, {
  requireAuth: true,
  requireAnyPermission: [Permission.USER_READ, Permission.ADMIN_DASHBOARD]
});
```

### Ruta con Permisos AND (Todos los permisos)

```typescript
export const GET = withAuth(handler, {
  requireAuth: true,
  requireAllPermissions: [Permission.USER_READ, Permission.USER_UPDATE]
});
```

### Ruta con Acceso a Recursos Propios

```typescript
export const PUT = withAuth(handler, {
  requireAuth: true,
  allowSelfAccess: true // Admin puede acceder a todo, usuario solo a sus recursos
});
```

## 🛡️ Características de Seguridad

### 1. Verificación de Tokens JWT
- Validación de firma
- Verificación de expiración
- Validación de issuer y audience

### 2. Rate Limiting
- Protección contra ataques de fuerza bruta
- Límites por IP y usuario
- Logging de intentos sospechosos

### 3. Audit Trail
- Log de todas las operaciones de autenticación
- Tracking de intentos de acceso no autorizados
- Registro de cambios de permisos

### 4. Headers de Seguridad
- Información del usuario en headers de respuesta
- Tracking de sesiones
- Prevención de ataques CSRF

## 🔧 Configuración

### Variables de Entorno Requeridas:

```env
JWT_SECRET=tu_secreto_jwt_muy_seguro
BCRYPT_SALT_ROUNDS=12
NODE_ENV=production
```

### Configuración del Middleware:

```typescript
// En middleware.ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

## 📊 Logging y Monitoreo

### Tipos de Logs:

1. **INFO**: Autenticaciones exitosas
2. **WARN**: Intentos de acceso no autorizados
3. **ERROR**: Errores de autenticación

### Información Registrada:

- IP del cliente
- User-Agent
- Usuario autenticado
- Ruta accedida
- Timestamp
- Resultado de la operación

## 🚨 Manejo de Errores

### Códigos de Error:

- **401**: No autenticado / Token inválido
- **403**: Sin permisos / Acceso denegado
- **500**: Error interno del servidor

### Respuestas de Error Estándar:

```json
{
  "success": false,
  "message": "Descripción del error",
  "code": "ERROR_CODE"
}
```

## 🔄 Flujo de Autenticación

1. **Cliente** envía request con header `Authorization: Bearer <token>`
2. **Middleware** extrae y verifica el token JWT
3. **Sistema** valida permisos según la ruta
4. **Aplicación** ejecuta la lógica de la ruta
5. **Sistema** registra la operación en logs

## 📚 Referencias

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 🤝 Contribución

Para agregar nuevos permisos o modificar el comportamiento del middleware:

1. Actualizar `src/lib/permissions.ts` con nuevos permisos
2. Modificar `src/lib/middleware.ts` para nueva lógica
3. Actualizar ejemplos en `src/lib/auth-middleware-examples.ts`
4. Documentar cambios en este archivo
