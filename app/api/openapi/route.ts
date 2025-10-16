import { NextResponse } from 'next/server';
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Grupo5 Usuarios API',
      version: '1.0.0',
      description: 'OpenAPI specification for the Grupo5 Usuarios service.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
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
  apis: ['./app/api/**/*.ts'], // Ruta a los archivos con comentarios @openapi
};

export async function GET() {
  try {
    const swaggerSpec = swaggerJSDoc(options);
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    );
  }
}
