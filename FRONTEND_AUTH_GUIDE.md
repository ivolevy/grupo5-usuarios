# Guía de Autenticación Frontend - Grupo5 Usuarios aaaaaaaaaaaaaaa

## 📋 Descripción

Guía completa para el uso del sistema de autenticación y permisos en el frontend de la aplicación.

## 🏗️ Componentes Principales

### 1. **Contexto de Autenticación** (`contexts/auth-context.tsx`)
- Maneja el estado global de autenticación
- Proporciona funciones de login, logout, refresh token
- Manejo automático de errores y redirecciones

### 2. **Hook de Permisos** (`hooks/use-permissions.ts`)
- Hook personalizado para verificar permisos y roles
- Funciones utilitarias para control de acceso
- Compatible con el sistema de permisos del backend

### 3. **Componentes de Permisos** (`components/auth/permission-gate.tsx`)
- Componentes para renderizado condicional basado en permisos
- Gates de acceso para diferentes niveles de autorización

### 4. **Middleware Frontend** (`middleware.ts`)
- Protección de rutas a nivel de aplicación
- Redirecciones automáticas para usuarios no autenticados

## 🚀 Uso Básico

### Autenticación

```typescript
import { useAuth } from "@/contexts/auth-context"

function MyComponent() {
  const { user, login, logout, isLoading, error } = useAuth()

  const handleLogin = async () => {
    const success = await login(email, password)
    if (success) {
      // Usuario autenticado exitosamente
    }
  }

  return (
    <div>
      {user ? (
        <p>Bienvenido, {user.nombre_completo}</p>
      ) : (
        <p>No autenticado</p>
      )}
    </div>
  )
}
```

### Verificación de Permisos

```typescript
import { usePermissions } from "@/hooks/use-permissions"

function MyComponent() {
  const { hasPermission, isAdmin, canManageUsers } = usePermissions()

  return (
    <div>
      {hasPermission(Permission.ADMIN_DASHBOARD) && (
        <AdminPanel />
      )}
      
      {isAdmin() && (
        <AdminOnlyContent />
      )}
      
      {canManageUsers() && (
        <UserManagement />
      )}
    </div>
  )
}
```

### Renderizado Condicional con Componentes

```typescript
import { RequirePermission, RequireAdmin, PermissionGate } from "@/components/auth/permission-gate"

function MyPage() {
  return (
    <div>
      {/* Solo usuarios con permiso específico */}
      <RequirePermission permission={Permission.USER_READ_ALL}>
        <UserList />
      </RequirePermission>

      {/* Solo administradores */}
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>

      {/* Múltiples condiciones */}
      <PermissionGate
        permissions={[Permission.USER_READ, Permission.USER_UPDATE]}
        requireAll={false} // OR logic
        fallback={<AccessDenied />}
      >
        <UserManagement />
      </PermissionGate>
    </div>
  )
}
```

## 🔐 Sistema de Permisos

### Permisos Disponibles

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

### Roles y Permisos

- **admin**: Todos los permisos
- **interno**: Lectura de usuarios, gestión de perfil propio
- **usuario**: Solo gestión de perfil propio

## 🛡️ Protección de Rutas

### Middleware Automático

El middleware en `middleware.ts` protege automáticamente las rutas:

```typescript
// Rutas protegidas
const protectedRoutes = ['/dashboard']

// Rutas públicas
const publicRoutes = ['/login', '/register', '/', '/swagger']
```

### Protección Manual en Componentes

```typescript
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function ProtectedPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <LoadingSpinner />
  if (!user) return null

  return <PageContent />
}
```

## 🔄 Manejo de Tokens

### Refresh Automático

El contexto de autenticación maneja automáticamente el refresh de tokens:

```typescript
const { refreshToken } = useAuth()

// El refresh se ejecuta automáticamente cuando:
// 1. Una petición API retorna 401
// 2. El token está próximo a expirar
// 3. Se llama manualmente a refreshToken()
```

### Almacenamiento Seguro

```typescript
// Los tokens se almacenan en:
// - localStorage (para persistencia)
// - cookies (para el middleware)
// - estado del contexto (para la aplicación)
```

## 📱 Componentes de UI

### Login con Redirección

```typescript
// El login maneja automáticamente las redirecciones
// URL: /login?redirect=/dashboard/users
// Después del login exitoso, redirige a /dashboard/users
```

### Manejo de Errores

```typescript
const { error, clearError } = useAuth()

// Mostrar errores de autenticación
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

// Limpiar errores
<Button onClick={clearError}>Limpiar Error</Button>
```

## 🎯 Ejemplos Prácticos

### 1. Dashboard con Permisos

```typescript
function Dashboard() {
  const { canAccessAdminDashboard, canManageUsers } = usePermissions()

  return (
    <div>
      <h1>Dashboard</h1>
      
      {canAccessAdminDashboard() && (
        <AdminMetrics />
      )}
      
      {canManageUsers() && (
        <UserManagement />
      )}
    </div>
  )
}
```

### 2. Lista de Usuarios con Acciones

```typescript
function UserList() {
  const { canUpdateUsers, canDeleteUsers, canAccessResource } = usePermissions()

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user}>
          {canUpdateUsers() && canAccessResource(user.id) && (
            <EditButton userId={user.id} />
          )}
          
          {canDeleteUsers() && (
            <DeleteButton userId={user.id} />
          )}
        </UserCard>
      ))}
    </div>
  )
}
```

### 3. Navegación Condicional

```typescript
function Navigation() {
  const { hasPermission } = usePermissions()

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      
      {hasPermission(Permission.USER_READ_ALL) && (
        <Link href="/dashboard/users">Usuarios</Link>
      )}
      
      {hasPermission(Permission.ADMIN_DASHBOARD) && (
        <Link href="/dashboard/admin">Admin</Link>
      )}
    </nav>
  )
}
```

## 🔧 Configuración

### Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Grupo5 Usuarios
```

### Configuración del Middleware

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|login|register).*)',
  ],
}
```

## 🚨 Manejo de Errores

### Tipos de Errores

1. **401 Unauthorized**: Token inválido o expirado
2. **403 Forbidden**: Sin permisos suficientes
3. **Network Error**: Error de conexión

### Respuestas Automáticas

```typescript
// El contexto maneja automáticamente:
// - Refresh de tokens expirados
// - Redirección a login
// - Limpieza de datos de sesión
// - Mostrar mensajes de error apropiados
```

## 📚 Mejores Prácticas

### 1. **Usar Hooks de Permisos**
```typescript
// ✅ Correcto
const { hasPermission } = usePermissions()
if (hasPermission(Permission.ADMIN_DASHBOARD)) { ... }

// ❌ Incorrecto
if (user?.rol === 'admin') { ... }
```

### 2. **Componentes de Permisos**
```typescript
// ✅ Correcto
<RequirePermission permission={Permission.USER_READ_ALL}>
  <UserList />
</RequirePermission>

// ❌ Incorrecto
{user?.rol === 'admin' && <UserList />}
```

### 3. **Manejo de Estados de Carga**
```typescript
// ✅ Correcto
if (isLoading) return <LoadingSpinner />
if (!user) return <LoginPrompt />

// ❌ Incorrecto
if (!user) return <LoginPrompt /> // Sin verificar isLoading
```

### 4. **Limpieza de Errores**
```typescript
// ✅ Correcto
useEffect(() => {
  clearError()
}, [])

// ❌ Incorrecto
// No limpiar errores puede causar mensajes persistentes
```

## 🔄 Flujo Completo

1. **Usuario accede a ruta protegida**
2. **Middleware verifica token en cookies**
3. **Si no hay token, redirige a login**
4. **Usuario se autentica**
5. **Token se almacena en localStorage y cookies**
6. **Usuario es redirigido a la ruta original**
7. **Componentes verifican permisos para renderizado**
8. **API calls incluyen token en headers**
9. **Refresh automático cuando sea necesario**

## 🤝 Contribución

Para agregar nuevos permisos o modificar el comportamiento:

1. Actualizar `hooks/use-permissions.ts` con nuevos permisos
2. Modificar `components/auth/permission-gate.tsx` si es necesario
3. Actualizar la documentación
4. Probar en diferentes roles de usuario
