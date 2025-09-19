# Sistema de Gestión de Usuarios - TP USUARIOS

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

## Documentación OpenAPI/Swagger

- JSON de OpenAPI: `GET /api/openapi`
- UI de Swagger: visitar `/swagger`

La especificación se genera con `next-swagger-doc` desde `lib/openapi.ts` escaneando `app/api`.
Anota tus rutas con comentarios JSDoc `@openapi` para incluirlas en el spec.

Ejemplo para un handler de salud:

```ts
/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
```

Configura `NEXT_PUBLIC_BASE_URL` si tu entorno requiere un host distinto.
