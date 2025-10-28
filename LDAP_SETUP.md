# 🔧 Guía de Configuración LDAP

## 🚨 Problema Detectado

El sistema está intentando conectarse a un servidor LDAP pero no puede establecer la conexión. Esto ocurre porque:

1. El servidor LDAP no está corriendo
2. Las credenciales son incorrectas
3. La configuración de conexión es incorrecta

## ✅ Solución: Configurar Servidor LDAP

### Opción 1: Usar Docker (Recomendado para desarrollo)

```bash
# Crear un servidor LDAP local con Docker
docker run -d \
  --name openldap \
  -p 389:389 \
  -p 636:636 \
  -e LDAP_ORGANISATION="Empresa" \
  -e LDAP_DOMAIN="empresa.local" \
  -e LDAP_ADMIN_PASSWORD="boca2002" \
  --env LDAP_BASE_DN="dc=empresa,dc=local" \
  osixia/openldap:latest
```

### Opción 2: Instalar OpenLDAP en Windows

1. Descargar Apache Directory Studio: https://directory.apache.org/studio/
2. Instalar OpenLDAP: https://www.openldap.org/software/download/
3. Configurar el servidor con estos valores:
   - Base DN: `dc=empresa,dc=local`
   - Admin DN: `cn=admin,dc=empresa,dc=local`
   - Password: `boca2002`

### Opción 3: Usar un Servidor LDAP Remoto

1. Obtén las credenciales de tu servidor LDAP
2. Crea un archivo `.env` en la raíz del proyecto
3. Agrega la configuración:

```env
LDAP_URL=ldap://tu-servidor-ldap:389
LDAP_BASE_DN=dc=empresa,dc=local
LDAP_BIND_DN=cn=admin,dc=empresa,dc=local
LDAP_BIND_PASSWORD=tu_contraseña
LDAP_USERS_OU=ou=users,dc=empresa,dc=local
```

## 📝 Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# LDAP Configuration
LDAP_URL=ldap://localhost:389
LDAP_BASE_DN=dc=empresa,dc=local
LDAP_BIND_DN=cn=admin,dc=empresa,dc=local
LDAP_BIND_PASSWORD=boca2002
LDAP_USERS_OU=ou=users,dc=empresa,dc=local

# JWT Configuration
JWT_SECRET=45c3e205e1a3d92ad1b8622cfac971cd2f28250cfbd02b8f1d907fa716054cc0745332bd6773c282155c8b6dcf3538fce89d021fd48b35f2759428675064c216
BCRYPT_SALT_ROUNDS=12

# Node Environment
NODE_ENV=development
```

## 🧪 Verificar Conexión LDAP

Después de configurar el servidor LDAP, ejecuta:

```bash
npm run dev
```

Verifica en la consola que aparece:
```
🔗 Conectando a LDAP: { url: 'ldap://localhost:389', bindDN: 'cn=admin,dc=empresa,dc=local' }
✅ Conexión LDAP exitosa
```

## 🚫 Alternativa: Volver a Supabase

Si prefieres usar Supabase en lugar de LDAP, necesitas:

1. Revertir los cambios en `lib/db.ts` para usar Supabase
2. Configurar las variables de entorno de Supabase
3. Ver el archivo `VERCEL_ENV_VARS.md` para más información

## 📖 Referencias

- [OpenLDAP Documentation](https://www.openldap.org/doc/)
- [Apache Directory Studio](https://directory.apache.org/studio/)
- [ldapts Library](https://github.com/ldapts/ldapts)

## ⚠️ Nota Importante

El servidor LDAP debe estar corriendo antes de iniciar la aplicación. Si no puedes conectarte, verifica:

1. ✅ El servidor LDAP está corriendo
2. ✅ Las credenciales son correctas
3. ✅ El puerto 389 está abierto
4. ✅ Firewall no está bloqueando la conexión

