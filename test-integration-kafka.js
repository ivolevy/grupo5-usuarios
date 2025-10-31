const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test de integración completa
async function testKafkaIntegration() {
  console.log('🚀 TEST DE INTEGRACIÓN KAFKA - CREACIÓN DE USUARIO');
  console.log('══════════════════════════════════════════════════════════════');

  try {
    // 1. Crear usuario a través de la API
    console.log('👤 Creando usuario a través de la API...');
    
    const userData = {
      nombre_completo: 'Test Kafka Integration',
      email: `test-integration-${Date.now()}@example.com`,
      password: 'password123',
      rol: 'admin',
      nacionalidad: 'Argentina',
      telefono: '+54 987 654 321'
    };

    console.log('📋 Datos del usuario:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Nombre: ${userData.nombre_completo}`);
    console.log(`   Nacionalidad: ${userData.nacionalidad}`);
    console.log(`   Teléfono: ${userData.telefono}`);
    console.log('');

    const response = await fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Error en API: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Usuario creado exitosamente');
    console.log('📄 Respuesta:', JSON.stringify(result, null, 2));
    console.log('');

    // 2. Verificar que el evento se envió a Kafka
    console.log('🔍 Verificando que el evento se envió a Kafka...');
    console.log('   (Revisa los logs del servidor para confirmar el envío)');
    console.log('');

    // 3. Información adicional
    console.log('📊 Información del test:');
    console.log(`   - Usuario ID: ${result.data.id}`);
    console.log(`   - Email: ${result.data.email}`);
    console.log(`   - Rol: ${result.data.rol}`);
    console.log(`   - Timestamp: ${result.data.created_at}`);
    console.log('');

    console.log('🎉 TEST COMPLETADO');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('✅ El usuario se creó correctamente');
    console.log('✅ El evento debería haberse enviado a Kafka automáticamente');
    console.log('📝 Revisa los logs del servidor para confirmar el envío a Kafka');
    console.log('══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

// Ejecutar el test
testKafkaIntegration().catch(console.error);

