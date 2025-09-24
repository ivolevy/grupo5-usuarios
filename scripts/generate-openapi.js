/*
  Generate a static OpenAPI JSON at build time to avoid bundling a heavy
  serverless function for /api/openapi.
*/

const fs = require('fs');
const path = require('path');

async function main() {
  // Defer import to avoid issues if package isn't needed in other contexts
  const { createSwaggerSpec } = require('next-swagger-doc');

  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    title: 'Grupo5 Usuarios API',
    version: '1.0.0',
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Grupo5 Usuarios API',
        version: '1.0.0',
        description: 'OpenAPI specification for the Grupo5 Usuarios service.',
      },
      servers: [
        { url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'usuarios', description: 'Users management endpoints' },
        { name: 'admin', description: 'Admin/metrics endpoints' },
        { name: 'health', description: 'Health checks' },
        { name: 'config', description: 'Configuration' },
      ],
    },
  });

  const publicDir = path.join(process.cwd(), 'public');
  const outPath = path.join(publicDir, 'openapi.json');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
  console.log(`Wrote OpenAPI spec to ${outPath}`);
}

main().catch((err) => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});


