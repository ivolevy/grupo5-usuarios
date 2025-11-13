"use client";
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

// Force dynamic rendering to avoid build errors during static generation
export const dynamic = 'force-dynamic';

export default function SwaggerPage() {
  return (
    <div style={{ height: '100%', minHeight: '100vh' }}>
      <SwaggerUI url="/openapi.json" docExpansion="none" defaultModelRendering="model" />
    </div>
  );
}



