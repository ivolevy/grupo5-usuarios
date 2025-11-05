# 🚀 Guía: Deploy del Kafka Consumer en Render

Esta guía te explica cómo deployar **solo el consumer de Kafka** en Render como un servicio independiente.

## 📋 Requisitos Previos

1. Cuenta en [Render](https://render.com)
2. Repositorio en GitHub/GitLab con tu código
3. Variables de entorno configuradas

## 🎯 Paso a Paso

### Paso 1: Crear un nuevo servicio en Render

1. Ve a tu [Dashboard de Render](https://dashboard.render.com)
2. Click en **"New +"** → **"Background Worker"**
3. Conecta tu repositorio de GitHub/GitLab

### Paso 2: Configurar el servicio

**Nombre del servicio:**
```
kafka-consumer-users
```

**Comando de inicio:**
```bash
npm run consumer:render
```

**Build Command:**
```bash
npm install
```

**Branch:**
```
main
```

### Paso 3: Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega todas estas variables:

#### Kafka Configuration
```env
KAFKA_BROKERS=34.172.179.60:9094
KAFKA_CLIENT_ID=grupo5-usuarios-consumer-render
KAFKA_CONSUMER_ENABLED=true
```

#### LDAP Configuration
```env
LDAP_URL=ldap://35.184.48.90:389
LDAP_BASE_DN=dc=empresa,dc=local
LDAP_BIND_DN=cn=admin,dc=empresa,dc=local
LDAP_BIND_PASSWORD=tu_contraseña_ldap
LDAP_USERS_OU=ou=users,dc=empresa,dc=local
```

#### JWT Configuration (si el consumer lo necesita)
```env
JWT_SECRET=tu_jwt_secret
BCRYPT_SALT_ROUNDS=12
```

#### Node Environment
```env
NODE_ENV=production
```

### Paso 4: Configurar el Plan

- **Free Tier**: Funciona, pero el servicio se "duerme" después de 15 minutos de inactividad
- **Starter Plan ($7/mes)**: Recomendado para producción - siempre activo

### Paso 5: Deshabilitar el consumer en Vercel

Para evitar conflictos, deshabilita el consumer automático en Vercel:

En las variables de entorno de Vercel, agrega:
```env
KAFKA_CONSUMER_ENABLED=false
```

Esto evitará que el consumer se intente iniciar en Vercel.

### Paso 6: Deploy

1. Click en **"Create Background Worker"**
2. Render comenzará a hacer build y deploy
3. Verás los logs en tiempo real
4. Cuando termine, el consumer estará corriendo

## ✅ Verificación

### Verificar que el consumer está corriendo

1. Ve a los **"Logs"** del servicio en Render
2. Deberías ver:
   ```
   [INFO] 🚀 Iniciando Kafka Consumer en Render...
   [INFO] Kafka consumer conectado exitosamente
   [INFO] Kafka consumer iniciado y escuchando eventos
   ```

### Probar el consumer

Registra un usuario desde tu app en Vercel y verifica en los logs de Render que:
- El consumer recibe el evento
- El usuario se crea exitosamente

## 🔍 Troubleshooting

### El servicio se duerme (Free Tier)

Si usas el plan gratuito, el servicio se "duerme" después de 15 minutos. Para solucionarlo:
- Upgrade a Starter Plan ($7/mes)
- O configura un cron job que haga ping al servicio cada 10 minutos

### Error de conexión a Kafka

Verifica:
- `KAFKA_BROKERS` está correcto
- El servidor Kafka permite conexiones desde Render (IP whitelist)
- El puerto está abierto

### Error de conexión a LDAP

Verifica:
- `LDAP_URL` es correcto
- `LDAP_BIND_DN` y `LDAP_BIND_PASSWORD` son correctos
- El servidor LDAP permite conexiones desde Render

## 📊 Monitoreo

Render te permite:
- Ver logs en tiempo real
- Ver métricas de CPU/Memoria
- Configurar alertas
- Ver historial de deploys

## 💰 Costos

- **Free Tier**: $0/mes (se duerme después de 15 min)
- **Starter Plan**: $7/mes (siempre activo, recomendado para producción)

## 🔄 Actualizaciones

Cuando hagas cambios:
1. Push a tu repositorio
2. Render detectará los cambios automáticamente
3. Hará rebuild y redeploy
4. El consumer se reiniciará con los nuevos cambios

## 📝 Notas

- El consumer en Render es **independiente** de tu app en Vercel
- Ambos pueden estar corriendo simultáneamente sin problemas
- El consumer procesará eventos de cualquier fuente que publique en Kafka
- Si necesitas escalar, puedes crear múltiples instancias del consumer

