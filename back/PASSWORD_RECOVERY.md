# Sistema de Recupero de Contraseña

## Configuración

### Variables de Entorno Requeridas

Agregar al archivo `.env`:

```env
MAIL_PASSWORD=tu_contraseña_del_servidor_smtp
```

### Dependencias Instaladas

```json
{
  "dependencies": {
    "nodemailer": "^7.0.3"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.17"
  }
}
```

## Endpoints Implementados

### 1. POST `/api/auth/forgot`
Solicitar recupero de contraseña.

**Request:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Si el email existe en nuestro sistema, recibirás un código de verificación en unos minutos."
}
```

### 2. POST `/api/auth/verify-code`
Verificar código de recupero.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Código verificado correctamente",
  "data": {
    "token": "abc123def456..."
  }
}
```

### 3. POST `/api/auth/reset`
Resetear contraseña con token.

**Request:**
```json
{
  "token": "abc123def456...",
  "password": "NuevaPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

## Flujo de Recupero

1. **Usuario solicita recupero**: Envía email a `/api/auth/forgot`
2. **Sistema envía código**: Genera código de 6 dígitos y lo envía por email
3. **Usuario verifica código**: Envía código a `/api/auth/verify-code`
4. **Sistema valida y devuelve token**: Token válido por 15 minutos
5. **Usuario resetea contraseña**: Envía nueva contraseña con token a `/api/auth/reset`
6. **Sistema actualiza contraseña**: Hash de nueva contraseña y envía confirmación

## Características de Seguridad

- ✅ **Mensajes neutros**: No revela si el email existe
- ✅ **Tokens con expiración**: 15 minutos de validez
- ✅ **Validación de contraseñas**: Mínimo 8 caracteres, mayúscula, minúscula, número
- ✅ **Logging de seguridad**: Registro de todas las acciones
- ✅ **Limpieza de tokens**: Tokens expirados se eliminan automáticamente
- ✅ **Emails de confirmación**: Notificación al usuario del cambio

## Configuración del Servidor SMTP

El sistema está configurado para usar:
- **Host**: `mail.techsecuritysrl.com`
- **Puerto**: `465` (SSL)
- **Usuario**: `ordenesdetrabajo@techsecuritysrl.com`
- **Contraseña**: Variable de entorno `MAIL_PASSWORD`

## Templates de Email

### Código de Recupero
- Asunto: "Código de recupero de contraseña - TECH Security"
- Contenido: Código de 6 dígitos con formato visual
- Expiración: 15 minutos

### Confirmación de Cambio
- Asunto: "Contraseña actualizada - TECH Security"
- Contenido: Confirmación del cambio exitoso

## Uso en Frontend

### Estructura del Modal (Recomendada)

```typescript
interface ForgotPasswordState {
  step: 1 | 2 | 3;
  email: string;
  code: string;
  token: string;
  isSubmitting: boolean;
  errorMsg: string;
  successMsg: string;
  resendCooldown: number;
}

// Paso 1: Email
const handleForgotPassword = async (email: string) => {
  const response = await fetch('/api/auth/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  // Manejar respuesta y avanzar a paso 2
};

// Paso 2: Código
const handleVerifyCode = async (email: string, code: string) => {
  const response = await fetch('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  // Manejar respuesta y avanzar a paso 3
};

// Paso 3: Nueva contraseña
const handleResetPassword = async (token: string, password: string) => {
  const response = await fetch('/api/auth/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  // Manejar respuesta y cerrar modal
};
```

## Testing

Para probar el sistema:

1. **Configurar variable de entorno** `MAIL_PASSWORD`
2. **Crear usuario** en la base de datos
3. **Solicitar recupero** con email del usuario
4. **Verificar email** recibido
5. **Usar código** para verificar
6. **Resetear contraseña** con token recibido

## Notas de Implementación

- Los códigos de verificación se generan pero no se almacenan en BD (por simplicidad)
- En producción, considerar almacenar códigos temporalmente o usar servicio externo
- Los tokens de reset son únicos y de un solo uso
- El sistema maneja automáticamente la limpieza de tokens expirados
