# Backend - Módulo de Usuarios

Sistema de gestión de usuarios con autenticación JWT, CRUD completo y recupero de contraseña por email.

## 🚀 Características

- ✅ **Autenticación JWT** con login, refresh y validación
- ✅ **CRUD de usuarios** completo con validaciones
- ✅ **Recupero de contraseña** por email con código de verificación
- ✅ **Sistema de permisos** granular por roles
- ✅ **Validaciones robustas** con Zod
- ✅ **Hash seguro** de contraseñas con bcrypt
- ✅ **Logging y auditoría** de eventos
- ✅ **Integración con Supabase** para persistencia

## 🛠️ Tecnologías

- **Next.js 15.5.2** - Framework de React
- **TypeScript** - Tipado estático
- **Supabase** - Base de datos y autenticación
- **JWT** - Tokens de autenticación
- **bcrypt** - Hash de contraseñas
- **Zod** - Validación de esquemas
- **Nodemailer** - Envío de emails

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run dev
```

## 🔧 Variables de Entorno

```env
# Base de datos
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima

# Autenticación
JWT_SECRET=tu_clave_secreta_jwt
BCRYPT_SALT_ROUNDS=12

# Email (para recupero de contraseña)
MAIL_PASSWORD=tu_contraseña_del_servidor_smtp
```

## 📡 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/refresh` - Renovar token JWT
- `GET /api/auth/me` - Información del usuario autenticado

### Recupero de Contraseña
- `POST /api/auth/forgot` - Solicitar recupero de contraseña
- `POST /api/auth/verify-code` - Verificar código de recupero
- `POST /api/auth/reset` - Resetear contraseña

### Usuarios
- `GET /api/usuarios` - Lista de usuarios (protegido)
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/profile` - Perfil del usuario
- `PUT /api/usuarios/profile` - Actualizar perfil

### Administración
- `GET /api/admin/metrics` - Métricas de administración
- `GET /api/health` - Health check
- `GET /api/config` - Configuración del sistema

## 🧪 Testing

```bash
# Ejecutar tests de endpoints
node tests/test-password-recovery.js

# Ejecutar tests de seguridad
node tests/test-security.js

# Ejecutar tests de librerías
node tests/test-libraries.js
```

## 📚 Documentación

- [Sistema de Recupero de Contraseña](./PASSWORD_RECOVERY.md)
- [Resultados de Testing](./tests/TESTING_RESULTS.md)

## 🔐 Seguridad

- **Autenticación JWT** con expiración de 24 horas
- **Hash seguro** de contraseñas con bcrypt (12 rounds)
- **Validación de entrada** con Zod schemas
- **Sistema de permisos** granular por roles
- **Logging de seguridad** para auditoría
- **Mensajes neutros** para no revelar información sensible

## 🏗️ Arquitectura

```
src/
├── app/api/           # Endpoints de la API
├── lib/               # Librerías y utilidades
│   ├── auth.ts        # Autenticación JWT
│   ├── db.ts          # Conexión a base de datos
│   ├── email-service.ts # Servicio de email
│   ├── middleware.ts  # Middleware de autenticación
│   ├── permissions.ts # Sistema de permisos
│   └── validations.ts # Schemas de validación
└── tests/             # Scripts de testing
```

## 🚀 Despliegue

El proyecto está listo para desplegar en Vercel:

```bash
# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 📝 Notas de Desarrollo

- El sistema usa Next.js App Router
- Integración con Supabase mediante REST API
- Cliente personalizado que simula interfaz Prisma
- Sistema de logging estructurado
- Manejo de errores tipado y centralizado
