# Sistema de Gestión de Usuarios - TP USUARIOS

Este proyecto es una aplicación completa de gestión de usuarios construida con Next.js que incluye tanto el frontend como el backend integrado.

## Características

- ✅ **Frontend moderno** con React 18, Next.js 15, y Tailwind CSS
- ✅ **Backend API REST** integrado con Next.js API Routes
- ✅ **Autenticación JWT** completa
- ✅ **Base de datos Supabase** para persistencia
- ✅ **Gestión de usuarios** (CRUD completo)
- ✅ **Dashboard administrativo** con estadísticas
- ✅ **Validación de contraseñas** con criterios de seguridad
- ✅ **Interfaz responsive** con componentes UI modernos

## Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework React con App Router
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utilitario
- **Radix UI** - Componentes de interfaz accesibles
- **Lucide React** - Iconos modernos

### Backend
- **Next.js API Routes** - Endpoints REST integrados
- **Supabase** - Base de datos PostgreSQL como servicio
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Hashing de contraseñas
- **Zod** - Validación de esquemas

## Configuración del Proyecto

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

\`\`\`env
# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://smvsrzphpcuukrnocied.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnNyenBocGN1dWtybm9jaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg3NjksImV4cCI6MjA3MjY1NDc2OX0.XHDYW_huSTzr_wfhtDG8Y14FI67Mi5DkjIlFlPyKl_8

# Configuración JWT
JWT_SECRET=tu_clave_secreta_muy_segura_cambiala_en_produccion

# URL de la base de datos
DATABASE_URL=postgresql://postgres:grupousuarios_tp@db.smvsrzphpcuukrnocied.supabase.co:5432/postgres
\`\`\`

### 2. Instalación de Dependencias

\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### 3. Ejecutar en Desarrollo

\`\`\`bash
npm run dev
\`\`\`

El proyecto estará disponible en [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

\`\`\`
TP USUARIOS/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes (Backend)
│   │   ├── auth/          # Endpoints de autenticación
│   │   ├── usuarios/      # CRUD de usuarios
│   │   └── config/        # Configuración de la API
│   ├── dashboard/         # Panel administrativo
│   ├── login/            # Página de login
│   └── layout.tsx        # Layout principal
├── components/           # Componentes React
│   ├── ui/              # Componentes UI base (Radix)
│   ├── users/           # Componentes específicos de usuarios
│   └── dashboard/       # Componentes del dashboard
├── contexts/            # Contextos React
│   ├── auth-context.tsx # Contexto de autenticación
│   └── users-context.tsx# Contexto de gestión de usuarios
├── lib/                # Utilidades y configuración
│   ├── auth.ts         # Funciones de autenticación
│   ├── db.ts           # Cliente de base de datos
│   ├── supabase.ts     # Configuración Supabase
│   └── validations.ts  # Esquemas de validación
└── hooks/              # Custom hooks
\`\`\`

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/[id]` - Obtener usuario por ID
- `PUT /api/usuarios/[id]` - Actualizar usuario
- `DELETE /api/usuarios/[id]` - Eliminar usuario

### Configuración
- `GET /api/config` - Obtener configuración de la aplicación
- `GET /api/health` - Health check

## Esquema de Base de Datos

### Tabla: usuarios

\`\`\`sql
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario', 'moderador')),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## Funcionalidades Principales

### 1. Autenticación
- Login con email y contraseña
- Tokens JWT con expiración
- Protección de rutas
- Gestión de sesiones

### 2. Gestión de Usuarios
- Lista de usuarios con paginación
- Crear nuevos usuarios
- Editar información de usuarios
- Eliminar usuarios
- Filtros y búsqueda

### 3. Dashboard
- Estadísticas de usuarios
- Gráficos y métricas
- Panel de administración

### 4. Seguridad
- Validación de contraseñas fuertes
- Hashing seguro con bcrypt
- Protección CSRF
- Validación de entrada con Zod

## Credenciales de Prueba

Puedes crear usuarios desde la interfaz o usar la API directamente. El primer usuario creado puede ser configurado como administrador.

## Desarrollo

### Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter ESLint

### Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es parte de un trabajo práctico educativo.

## Soporte

Si encuentras algún problema o tienes preguntas, por favor crea un issue en el repositorio.
