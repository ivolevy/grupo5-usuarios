import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Grupo5 Usuarios API',
        version: '1.0.0',
        description: 'OpenAPI specification for the Grupo5 Usuarios service.',
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        },
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
      security: [
        {
          bearerAuth: [],
        },
      ],
      tags: [
        {
          name: 'auth',
          description: 'Authentication endpoints',
        },
        {
          name: 'usuarios',
          description: 'Users management endpoints',
        },
        {
          name: 'admin',
          description: 'Admin/metrics endpoints',
        },
        {
          name: 'health',
          description: 'Health checks',
        },
        {
          name: 'config',
          description: 'Configuration',
        },
      ],
    },
    apiFolder: 'app/api',
  });

  return spec;
};
