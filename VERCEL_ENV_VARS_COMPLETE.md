# 🔧 Variables de Entorno para Vercel - Lista AAAAAAAAACompletaAAAAAAAAAAAAAAAAAAAA

## 📋 **INSTRUCCIONES PARA VERCEL:**

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `grupo5-usuarios`
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable una por una
5. Selecciona los entornos: **Production**, **Preview**, y **Development** (según corresponda)

---

## ✅ **VARIABLES OBLIGATORIAS (Core)**

### **1. Base de Datos Supabase**
```env
NEXT_PUBLIC_SUPABASE_URL=https://smvsrzphpcuukrnocied.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnNyenBocGN1dWtybm9jaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg3NjksImV4cCI6MjA3MjY1NDc2OX0.XHDYW_huSTzr_wfhtDG8Y14FI67Mi5DkjIlFlPyKl_8
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_AQUI
```

**Entornos:** Production, Preview, Development

---

### **2. Autenticación JWT**
```env
JWT_SECRET=45c3e205e1a3d92ad1b8622cfac971cd2f28250cfbd02b8f1d907fa716054cc0745332bd6773c282155c8b6dcf3538fce89d021fd48b35f2759428675064c216
JWT_REFRESH_SECRET=2cab3bdf9ac1f1e05230f3a966eef9c7fe2c8d7932609fd5401b468d11c9104c79cbada493e592b12af7dc03b5979578637428ae27bb8f177cc0f28acb54124c
BCRYPT_SALT_ROUNDS=12
```

**Entornos:** Production, Preview, Development

---

### **3. Email - Opción 1: Resend (Recomendado)**
```env
RESEND_API_KEY=tu_resend_api_key_aqui
EMAIL_FROM=noreply@sky-track.com
EMAIL_FROM_NAME=SkyTrack
```

**Entornos:** Production, Preview, Development

---

### **4. Email - Opción 2: Gmail (Alternativa)**
```env
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=tu_app_password_de_gmail
EMAIL_FROM=tu_email@gmail.com
EMAIL_FROM_NAME=SkyTrack
```

**Entornos:** Production, Preview, Development

**Nota:** Puedes usar Resend O Gmail, no necesitas ambos. Si usas Gmail, también puedes usar:
```env
MAIL_PASSWORD=CpZhnKEBaqZiBnyH1+ZV+hAEAPCSPRYHP67MDuyWHog=
```

---

### **5. Entorno General**
```env
NODE_ENV=production
```

**Entornos:** Production (solo)

---

## 🔧 **VARIABLES OPCIONALES (Según tu configuración)**

### **6. LDAP (Si usas LDAP)**
```env
LDAP_URL=ldap://35.184.48.90:389
LDAP_BASE_DN=dc=empresa,dc=local
LDAP_BIND_DN=cn=admin,dc=empresa,dc=local
LDAP_BIND_PASSWORD=tu_password_ldap
LDAP_USERS_OU=ou=users,dc=empresa,dc=local
```

**Entornos:** Production, Preview, Development (si usas LDAP)

---

### **7. Kafka (Si usas Kafka)**
```env
KAFKA_CLIENT_ID=grupo5-usuarios-app
KAFKA_BROKERS=34.172.179.60:9094
KAFKA_CONSUMER_ENABLED=false
KAFKA_API_URL=http://34.172.179.60/events
KAFKA_API_KEY=microservices-api-key-2024-secure
```

**Entornos:** Production, Preview, Development (si usas Kafka)

**Nota:** `KAFKA_CONSUMER_ENABLED=false` en Vercel porque Vercel no permite procesos de larga duración.

---

### **8. Email - Configuración Adicional (Opcional)**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
```

**Entornos:** Production, Preview, Development (solo si usas SMTP tradicional)

---

## 📝 **RESUMEN RÁPIDO - Variables Mínimas Necesarias**

Si solo quieres lo esencial, agrega estas:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://smvsrzphpcuukrnocied.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `JWT_SECRET` | `45c3e205e1a3d92ad1b8622cfac971cd...` | Production, Preview, Development |
| `JWT_REFRESH_SECRET` | `2cab3bdf9ac1f1e05230f3a966eef9c7...` | Production, Preview, Development |
| `BCRYPT_SALT_ROUNDS` | `12` | Production, Preview, Development |
| `RESEND_API_KEY` | `tu_api_key` | Production, Preview, Development |
| `EMAIL_FROM` | `noreply@sky-track.com` | Production, Preview, Development |
| `EMAIL_FROM_NAME` | `SkyTrack` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production (solo) |

---

## ⚠️ **IMPORTANTE:**

1. **NEXT_PUBLIC_***: Estas variables son públicas y se exponen al cliente. No pongas secrets aquí.
2. **Sin NEXT_PUBLIC_**: Estas son variables del servidor y son seguras.
3. **SUPABASE_SERVICE_ROLE_KEY**: Necesitas obtenerla desde tu dashboard de Supabase → Settings → API → `service_role` key (es secreta, no la compartas).
4. **RESEND_API_KEY**: Obtenerla desde https://resend.com/api-keys
5. **GMAIL_APP_PASSWORD**: Si usas Gmail, necesitas crear una "App Password" desde tu cuenta de Google.

---

## 🔍 **Cómo Obtener Valores Faltantes:**

### **SUPABASE_SERVICE_ROLE_KEY:**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Settings → API
4. Copia la `service_role` key (⚠️ Es secreta, no la compartas)

### **RESEND_API_KEY:**
1. Ve a https://resend.com/api-keys
2. Crea una nueva API key
3. Copia el valor (solo se muestra una vez)

### **GMAIL_APP_PASSWORD:**
1. Ve a tu cuenta de Google → Seguridad
2. Activa la verificación en 2 pasos
3. Genera una "Contraseña de aplicación"
4. Úsala como `GMAIL_APP_PASSWORD`

---

## ✅ **Verificación:**

Después de agregar las variables, puedes verificar que funcionan:
1. Haz un nuevo deploy en Vercel
2. Ve a tu proyecto → Deployments → Último deploy
3. Revisa los logs para ver si hay errores relacionados con variables de entorno

