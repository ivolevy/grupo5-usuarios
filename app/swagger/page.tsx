"use client";
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerPage() {
  return (
    <div style={{ height: '100%', minHeight: '100vh' }}>
      <SwaggerUI url="/openapi.json" docExpansion="none" defaultModelRendering="model" />
    </div>
  );
}



