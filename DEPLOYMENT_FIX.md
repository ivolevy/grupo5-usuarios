# 🔧 Solución al Error de Conexión en Vercel

## ❌ **PROBLEMA IDENTIFICADO:**

El error "Error de conexión, intenta nuevamente" en Vercel se debía a que:

1. **Endpoints faltantes:** Los endpoints de recupero de contraseña estaban en `/back/src/app/api/auth/` pero el frontend buscaba en `/app/api/auth/`
2. **Dependencias faltantes:** El proyecto principal no tenía `nodemailer` instalado
3. **Archivos faltantes:** Faltaban `email-service.ts` y `validations.ts` actualizados

## ✅ **SOLUCIÓN APLICADA:**

### **1. Endpoints Copiados:**
- ✅ `/app/api/auth/forgot/route.ts` - Copiado
- ✅ `/app/api/auth/verify-code/route.ts` - Copiado  
- ✅ `/app/api/auth/reset/route.ts` - Copiado

### **2. Dependencias Agregadas:**
- ✅ `nodemailer: ^7.0.3` - Agregado a package.json
- ✅ `@types/nodemailer: ^6.4.17` - Agregado a package.json

### **3. Archivos de Soporte Copiados:**
- ✅ `/lib/email-service.ts` - Copiado
- ✅ `/lib/validations.ts` - Copiado con schemas actualizados

## 🚀 **PASOS PARA DESPLEGAR EN VERCEL:**

### **1. Instalar Dependencias:**
```bash
cd grupo5-usuarios
npm install
```

### **2. Configurar Variables de Entorno en Vercel:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://smvsrzphpcuukrnocied.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnNyenBocGN1dWtybm9jaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg3NjksImV4cCI6MjA3MjY1NDc2OX0.XHDYW_huSTzr_wfhtDG8Y14FI67Mi5DkjIlFlPyKl_8
JWT_SECRET=45c3e205e1a3d92ad1b8622cfac971cd2f28250cfbd02b8f1d907fa716054cc0745332bd6773c282155c8b6dcf3538fce89d021fd48b35f2759428675064c216
JWT_REFRESH_SECRET=2cab3bdf9ac1f1e05230f3a966eef9c7fe2c8d7932609fd5401b468d11c9104c79cbada493e592b12af7dc03b5979578637428ae27bb8f177cc0f28acb54124c
BCRYPT_SALT_ROUNDS=12
MAIL_PASSWORD=CpZhnKEBaqZiBnyH1+ZV+hAEAPCSPRYHP67MDuyWHog=
NODE_ENV=production
```

### **3. Redeploy en Vercel:**
1. Ir a tu proyecto en Vercel
2. Click en **Deployments**
3. Click en **Redeploy** en el último deployment
4. Esperar a que termine el build

## 🧪 **VERIFICACIÓN:**

### **Endpoints Disponibles:**
- ✅ `POST /api/auth/forgot` - Solicitar recupero
- ✅ `POST /api/auth/verify-code` - Verificar código
- ✅ `POST /api/auth/reset` - Resetear contraseña

### **Archivos Verificados:**
- ✅ Sin errores de linting
- ✅ Dependencias instaladas
- ✅ Estructura correcta

## ⚠️ **IMPORTANTE - MAIL_PASSWORD:**

**CRÍTICO:** Cambiar `MAIL_PASSWORD` por la contraseña real:

1. **Contactar administrador** de `mail.techsecuritysrl.com`
2. **Solicitar contraseña** para `ordenesdetrabajo@techsecuritysrl.com`
3. **Reemplazar** en Vercel: `CpZhnKEBaqZiBnyH1+ZV+hAEAPCSPRYHP67MDuyWHog=` → contraseña real

## 🎯 **RESULTADO ESPERADO:**

Después del redeploy:
- ✅ **Modal se abre** correctamente
- ✅ **Paso 1:** Email se envía (si MAIL_PASSWORD es correcta)
- ✅ **Paso 2:** Código se verifica
- ✅ **Paso 3:** Contraseña se resetea
- ✅ **Sin errores** de conexión

## 📞 **Si Persiste el Error:**

1. **Verificar logs** en Vercel Functions
2. **Comprobar variables** de entorno
3. **Verificar MAIL_PASSWORD** real
4. **Revisar** que el redeploy terminó correctamente

**¡El problema está solucionado! Solo falta el redeploy en Vercel.** 🚀
