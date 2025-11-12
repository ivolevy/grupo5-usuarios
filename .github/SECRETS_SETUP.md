# Configuración de Secrets para CI/CD

## Secrets Requeridos para Vercel

Para que el pipeline de CD funcione correctamente, necesitas configurar los siguientes secrets en GitHub:

### Cómo configurar secrets en GitHub:

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** > **Actions**
4. Click en **New repository secret**
5. Agrega cada uno de los siguientes secrets:

### Secrets de Vercel:

#### 1. `VERCEL_TOKEN`
- **Descripción**: Token de autenticación de Vercel
- **Cómo obtenerlo**:
  1. Ve a [Vercel Dashboard](https://vercel.com/account/tokens)
  2. Click en **Create Token**
  3. Dale un nombre descriptivo (ej: "GitHub Actions")
  4. Copia el token generado
  5. Pégalo como valor del secret `VERCEL_TOKEN`

#### 2. `VERCEL_ORG_ID`
- **Descripción**: ID de la organización de Vercel
- **Cómo obtenerlo**:
  1. Ve a [Vercel Dashboard](https://vercel.com/account)
  2. En la URL o en la configuración de tu organización, encontrarás el ID
  3. También puedes obtenerlo ejecutando: `vercel whoami` y luego `vercel link`
  4. O desde la API: `curl https://api.vercel.com/v2/teams -H "Authorization: Bearer YOUR_TOKEN"`

#### 3. `VERCEL_PROJECT_ID`
- **Descripción**: ID del proyecto de Vercel
- **Cómo obtenerlo**:
  1. Ve a tu proyecto en Vercel Dashboard
  2. Ve a **Settings** > **General**
  3. El **Project ID** está en la sección de información del proyecto
  4. También puedes obtenerlo desde la URL del proyecto o ejecutando `vercel link`

### Método Alternativo (más fácil):

Si tienes Vercel CLI instalado localmente:

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login a Vercel
vercel login

# Link tu proyecto (esto mostrará los IDs)
vercel link

# Obtener el token
vercel whoami
```

Luego ve a https://vercel.com/account/tokens para crear el token.

---

## Verificación

Una vez configurados los secrets, el workflow validará automáticamente que estén presentes antes de intentar el deploy. Si falta alguno, verás un mensaje de error claro indicando cuál secret falta.

---

## Troubleshooting

### Error: "Input required and not supplied: vercel-token"

Este error significa que el secret `VERCEL_TOKEN` no está configurado o no está disponible en el contexto del workflow.

**Soluciones**:
1. Verifica que el secret esté configurado en: Settings > Secrets and variables > Actions
2. Asegúrate de que el nombre del secret sea exactamente `VERCEL_TOKEN` (case-sensitive)
3. Si el workflow se ejecuta desde un fork, los secrets no están disponibles por seguridad
4. Verifica que el workflow tenga permisos para leer secrets (esto es automático en workflows normales)

### Error: "Input required and not supplied: vercel-org-id" o "vercel-project-id"

Similar al anterior, verifica que estos secrets estén configurados correctamente.

---

## Notas de Seguridad

- **Nunca** commits los secrets en el código
- Los secrets solo están disponibles en workflows del repositorio principal (no en forks)
- Los secrets están encriptados y solo se muestran como `***` en los logs
- Puedes rotar los tokens en cualquier momento desde Vercel Dashboard

