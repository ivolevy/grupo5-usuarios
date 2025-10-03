const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Función para descargar la documentación OpenAPI desde el servidor
async function downloadOpenApiSpec() {
  return new Promise((resolve, reject) => {
    const url = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const endpoint = `${url}/api/openapi`;
    
    console.log('🔄 Descargando documentación OpenAPI desde:', endpoint);
    
    const client = url.startsWith('https') ? https : http;
    
    client.get(endpoint, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const spec = JSON.parse(data);
          resolve(spec);
        } catch (error) {
          reject(new Error('Error al parsear JSON: ' + error.message));
        }
      });
    }).on('error', (error) => {
      reject(new Error('Error al descargar: ' + error.message));
    });
  });
}

// Función para guardar la documentación en el archivo público
async function saveOpenApiSpec(spec) {
  const openApiPath = path.join(__dirname, '../public/openapi.json');
  
  try {
    fs.writeFileSync(openApiPath, JSON.stringify(spec, null, 2));
    console.log('✅ Documentación OpenAPI guardada en:', openApiPath);
    return true;
  } catch (error) {
    console.error('❌ Error al guardar archivo:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🔄 Regenerando documentación OpenAPI...');
  
  try {
    // Intentar descargar la documentación desde el servidor
    const spec = await downloadOpenApiSpec();
    
    // Guardar en el archivo público
    const saved = await saveOpenApiSpec(spec);
    
    if (saved) {
      // Verificar que tenga los endpoints de autenticación
      const authEndpoints = [
        '/api/auth/login',
        '/api/auth/me', 
        '/api/auth/refresh',
        '/api/auth/forgot',
        '/api/auth/verify-code',
        '/api/auth/reset'
      ];
      
      const missingEndpoints = authEndpoints.filter(endpoint => !spec.paths[endpoint]);
      
      if (missingEndpoints.length > 0) {
        console.log('⚠️  Endpoints faltantes en la documentación:', missingEndpoints);
      } else {
        console.log('✅ Todos los endpoints de autenticación están documentados');
      }
      
      // Verificar que el rol "interno" esté en los enums
      const hasInternoRole = JSON.stringify(spec).includes('"interno"');
      if (hasInternoRole) {
        console.log('✅ Rol "interno" encontrado en la documentación');
      } else {
        console.log('⚠️  Rol "interno" no encontrado en la documentación');
      }
      
      console.log('📊 Total de endpoints documentados:', Object.keys(spec.paths).length);
      console.log('🏷️  Tags disponibles:', spec.tags?.map(tag => tag.name).join(', ') || 'N/A');
    }
    
  } catch (error) {
    console.log('⚠️  No se pudo descargar la documentación:', error.message);
    console.log('💡 Asegúrate de que el servidor esté ejecutándose con "npm run dev"');
    
    // Verificar si existe el archivo actual
    const openApiPath = path.join(__dirname, '../public/openapi.json');
    if (fs.existsSync(openApiPath)) {
      console.log('📄 Usando archivo OpenAPI existente...');
      
      try {
        const openApiContent = fs.readFileSync(openApiPath, 'utf8');
        const openApiData = JSON.parse(openApiContent);
        
        console.log('📊 Total de endpoints documentados:', Object.keys(openApiData.paths).length);
        console.log('🏷️  Tags disponibles:', openApiData.tags?.map(tag => tag.name).join(', ') || 'N/A');
        
        // Verificar que el rol "interno" esté en los enums
        const hasInternoRole = JSON.stringify(openApiContent).includes('"interno"');
        if (hasInternoRole) {
          console.log('✅ Rol "interno" encontrado en la documentación');
        } else {
          console.log('⚠️  Rol "interno" no encontrado en la documentación');
        }
        
      } catch (parseError) {
        console.error('❌ Error al leer archivo existente:', parseError.message);
      }
    }
  }
  
  console.log('✅ Proceso completado');
}

// Ejecutar función principal
main().catch(console.error);
