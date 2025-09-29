# 📦 Guía de Migración: Supabase → LDAP

## 🎯 Objetivo
Migrar completamente todos los usuarios de la base de datos Supabase al servidor LDAP, manteniendo la integridad de los datos y las funcionalidades existentes.

## 📋 Datos Migrados

### Usuarios de Supabase (23 usuarios)
- **Admin**: 4 usuarios
- **Moderador**: 2 usuarios  
- **Usuario**: 17 usuarios

### Campos Migrados
| Campo Supabase | Campo LDAP | Descripción |
|----------------|------------|-------------|
| `id` | `uid` | Identificador único generado desde email |
| `email` | `mail` | Email del usuario |
| `password` | `userPassword` | Hash bcrypt (mantenido original) |
| `rol` | `objectClass` | Mapeado a clases LDAP |
| `nombre_completo` | `cn`, `sn`, `givenName` | Nombres separados |
| `telefono` | `telephoneNumber` | Número de teléfono |
| `nacionalidad` | `description` | Nacionalidad del usuario |
| `email_verified` | - | No migrado (asumido como true) |
| `created_at` | - | No migrado |
| `updated_at` | - | No migrado |
| `last_login_at` | - | No migrado |

## 🔧 Configuración Requerida

### Variables de Entorno
```env
LDAP_URL=ldap://35.184.48.90:389
LDAP_BASE_DN=dc=empresa,dc=local
LDAP_BIND_DN=cn=admin,dc=empresa,dc=local
LDAP_BIND_PASSWORD=boca2002
LDAP_USERS_OU=ou=users,dc=empresa,dc=local
```

### Estructura LDAP Requerida
```
dc=empresa,dc=local
└── ou=users,dc=empresa,dc=local
    ├── uid=panchi,ou=users,dc=empresa,dc=local
    ├── uid=admin,ou=users,dc=empresa,dc=local
    └── ... (otros usuarios)
```

## 🚀 Ejecutar Migración

### Método 1: API Endpoint (Recomendado)
```bash
# Ejecutar migración completa
curl -X POST http://localhost:3001/api/migration/supabase-to-ldap
```

### Método 2: Script Directo
```bash
# Desde el directorio back/
npx ts-node src/scripts/migrate-supabase-to-ldap.ts
```

### Método 3: Script de Prueba
```bash
# Probar migración completa
node test-migration.js
```

## 📊 Proceso de Migración

### 1. Limpieza de LDAP
- ✅ Elimina todos los usuarios existentes en `ou=users`
- ✅ Mantiene la estructura de directorios
- ✅ Logs detallados de eliminación

### 2. Migración de Usuarios
- ✅ Procesa cada usuario de Supabase
- ✅ Genera UID único desde email
- ✅ Mapea roles a objectClasses
- ✅ Mantiene hashes de password originales
- ✅ Agrega campos adicionales (teléfono, nacionalidad)

### 3. Verificación
- ✅ Cuenta usuarios migrados
- ✅ Verifica estructura de datos
- ✅ Lista usuarios por rol
- ✅ Reporta errores detallados

## 🗂️ Mapeo de Roles

### Supabase → LDAP
```typescript
'admin' → ['inetOrgPerson', 'posixAccount', 'top', 'admin']
'moderador' → ['inetOrgPerson', 'posixAccount', 'top', 'moderador']  
'usuario' → ['inetOrgPerson', 'posixAccount', 'top']
```

### Generación de UID
```typescript
// Email: panchi@gmail.com → UID: panchi
// Email: admin@test.com → UID: admin
// Email: ivo.levy03@gmail.com → UID: ivo.levy03
```

## 📈 Resultados Esperados

### Antes de Migración
- **Supabase**: 23 usuarios
- **LDAP**: 0 usuarios (después de limpieza)

### Después de Migración  
- **Supabase**: 23 usuarios (sin cambios)
- **LDAP**: 23 usuarios migrados

### Distribución por Rol
- **Admin**: 4 usuarios
- **Moderador**: 2 usuarios
- **Usuario**: 17 usuarios

## 🔍 Verificación Post-Migración

### 1. Listar Usuarios
```bash
curl http://localhost:3001/api/usuarios?limit=50
```

### 2. Probar Autenticación
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"panchi@gmail.com","password":"test123"}'
```

### 3. Verificar Usuario Específico
```bash
curl http://localhost:3001/api/usuarios/panchi
```

## ⚠️ Consideraciones Importantes

### Passwords
- **Hashes bcrypt**: Se mantienen exactamente iguales
- **Autenticación**: Funciona con passwords originales
- **No hay re-encryptado**: Los hashes se transfieren tal como están

### IDs de Usuario
- **UID**: Se genera desde la parte local del email
- **Único**: Cada email genera un UID único
- **Compatible**: Funciona con el sistema existente

### Datos Perdidos
- **Fechas**: `created_at`, `updated_at`, `last_login_at`
- **Tokens**: `email_verification_token`, `password_reset_token`
- **UUIDs**: Los UUIDs originales se reemplazan por UIDs

## 🛠️ Solución de Problemas

### Error: "LDAP Connection failed"
```bash
# Verificar conectividad
Test-NetConnection 35.184.48.90 -Port 389
```

### Error: "No Such Object"
```bash
# Verificar estructura LDAP
curl http://localhost:3001/api/ldap/debug
```

### Error: "Invalid credentials"
```bash
# Verificar configuración LDAP
echo $LDAP_BIND_DN
echo $LDAP_BIND_PASSWORD
```

## 📞 Soporte

Si encuentras problemas durante la migración:

1. **Verificar logs**: Los logs detallados muestran cada paso
2. **Probar conexión**: Usar endpoints de debug
3. **Verificar configuración**: Variables de entorno correctas
4. **Revisar estructura**: LDAP debe tener `ou=users` creada

## 🎉 Post-Migración

Después de la migración exitosa:

1. ✅ **Sistema híbrido activo**: LDAP como fuente principal
2. ✅ **Fallback a Supabase**: En caso de errores LDAP
3. ✅ **Autenticación funcional**: Login con passwords originales
4. ✅ **CRUD completo**: Crear, leer, actualizar, eliminar usuarios
5. ✅ **Búsquedas y filtros**: Por rol, email, nombre

¡La migración está completa y el sistema está listo para usar LDAP como fuente principal de datos!

