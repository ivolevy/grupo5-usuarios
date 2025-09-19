# 🔧 Variables de Entorno para Vercel

## ✅ **VARIABLES LISTAS PARA COPIAR Y PEGAR EN VERCEL**

### **1. Base de Datos Supabase**
```env
NEXT_PUBLIC_SUPABASE_URL=https://smvsrzphpcuukrnocied.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnNyenBocGN1dWtybm9jaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg3NjksImV4cCI6MjA3MjY1NDc2OX0.XHDYW_huSTzr_wfhtDG8Y14FI67Mi5DkjIlFlPyKl_8
```

### **2. Autenticación JWT (CLAVES SEGURAS GENERADAS)**
```env
JWT_SECRET=45c3e205e1a3d92ad1b8622cfac971cd2f28250cfbd02b8f1d907fa716054cc0745332bd6773c282155c8b6dcf3538fce89d021fd48b35f2759428675064c216
JWT_REFRESH_SECRET=2cab3bdf9ac1f1e05230f3a966eef9c7fe2c8d7932609fd5401b468d11c9104c79cbada493e592b12af7dc03b5979578637428ae27bb8f177cc0f28acb54124c
BCRYPT_SALT_ROUNDS=12
```

### **3. Email para Recupero de Contraseña**
```env
MAIL_PASSWORD=CpZhnKEBaqZiBnyH1+ZV+hAEAPCSPRYHP67MDuyWHog=
```

### **4. Entorno**
```env
NODE_ENV=production
```

## 🚀 **INSTRUCCIONES PARA VERCEL:**

### **Paso 1: Ir a Configuración**
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto
3. Click en **Settings**
4. Click en **Environment Variables**

### **Paso 2: Agregar Variables (Una por Una)**

| Variable | Valor | Entorno |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://smvsrzphpcuukrnocied.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnNyenBocGN1dWtybm9jaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg3NjksImV4cCI6MjA3MjY1NDc2OX0.XHDYW_huSTzr_wfhtDG8Y14FI67Mi5DkjIlFlPyKl_8` | Production, Preview, Development |
| `JWT_SECRET` | `45c3e205e1a3d92ad1b8622cfac971cd2f28250cfbd02b8f1d907fa716054cc0745332bd6773c282155c8b6dcf3538fce89d021fd48b35f2759428675064c216` | Production, Preview, Development |
| `JWT_REFRESH_SECRET` | `2cab3bdf9ac1f1e05230f3a966eef9c7fe2c8d7932609fd5401b468d11c9104c79cbada493e592b12af7dc03b5979578637428ae27bb8f177cc0f28acb54124c` | Production, Preview, Development |
| `BCRYPT_SALT_ROUNDS` | `12` | Production, Preview, Development |
| `MAIL_PASSWORD` | `CpZhnKEBaqZiBnyH1+ZV+hAEAPCSPRYHP67MDuyWHog=` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

### **Paso 3: Configurar Entornos**
Para cada variable, seleccionar:
- ✅ **Production** (para producción)
- ✅ **Preview** (para testing)
- ✅ **Development** (para desarrollo local)

### **Paso 4: Redeploy**
1. Click en **Deployments**
2. Click en **Redeploy** en el último deployment
3. Esperar a que termine el deploy

## 🔐 **CLAVES GENERADAS Y ACTUALIZADAS:**

### **✅ JWT_SECRET (NUEVA CLAVE SEGURA)**
- **Anterior:** `cwkUUpy/hr83SNQxCKxdHiaNM+YQBRaSA3N/iSjUcZaYWuOWI21Cax7qmDHINK8B`
- **Nueva:** `45c3e205e1a3d92ad1b8622cfac971cd2f28250cfbd02b8f1d907fa716054cc0745332bd6773c282155c8b6dcf3538fce89d021fd48b35f2759428675064c216`
- **Longitud:** 128 caracteres (muy segura)

### **✅ JWT_REFRESH_SECRET (NUEVA CLAVE)**
- **Nueva:** `2cab3bdf9ac1f1e05230f3a966eef9c7fe2c8d7932609fd5401b468d11c9104c79cbada493e592b12af7dc03b5979578637428ae27bb8f177cc0f28acb54124c`
- **Longitud:** 128 caracteres (muy segura)

### **✅ MAIL_PASSWORD (CLAVE GENERADA)**
- **Nueva:** `CpZhnKEBaqZiBnyH1+ZV+hAEAPCSPRYHP67MDuyWHog=`
- **Formato:** Base64 (32 bytes)
- **Uso:** Para autenticación SMTP

## ⚠️ **IMPORTANTE:**

### **MAIL_PASSWORD - NOTA CRÍTICA:**
La clave `MAIL_PASSWORD` que generé es una clave de ejemplo. **DEBES CAMBIARLA** por la contraseña real del servidor SMTP de TECH Security:

1. **Contactar al administrador** de `mail.techsecuritysrl.com`
2. **Solicitar la contraseña** para `ordenesdetrabajo@techsecuritysrl.com`
3. **Reemplazar** `CpZhnKEBaqZiBnyH1+ZV+hAEAPCSPRYHP67MDuyWHog=` por la contraseña real

## 🧪 **DESPUÉS DE CONFIGURAR:**

### **1. Probar el Sistema:**
```bash
# Ir a tu sitio en Vercel
# Hacer clic en "¿Olvidaste tu contraseña?"
# Probar el flujo completo
```

### **2. Verificar Logs:**
- Ir a **Functions** en Vercel
- Revisar logs de los endpoints `/api/auth/forgot`, `/api/auth/verify-code`, `/api/auth/reset`

### **3. Probar con Email Real:**
- Crear usuario en la base de datos
- Probar recupero con email real
- Verificar que llega el email

## 🎯 **RESUMEN:**

**✅ CLAVES ACTUALIZADAS Y SEGURAS**
- ✅ JWT_SECRET: Nueva clave de 128 caracteres
- ✅ JWT_REFRESH_SECRET: Nueva clave de 128 caracteres  
- ✅ MAIL_PASSWORD: Clave generada (cambiar por la real)
- ✅ Todas las variables listas para Vercel

**🚀 LISTO PARA PRODUCCIÓN**
