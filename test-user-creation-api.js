const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuración de la API REST de Kafka
const KAFKA_API_URL = 'http://34.172.179.60/events';
const API_KEY = 'microservices-api-key-2024-secure';

async function sendUserCreationEvent() {
  console.log('🚀 ENVIANDO EVENTO DE CREACIÓN DE USUARIO');
  console.log('══════════════════════════════════════════════════════════════');

  try {
    // Generar datos únicos para el usuario
    const userId = `test-user-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Países y roles para generar datos variados
    const countries = ['Argentina', 'Brasil', 'Chile', 'Uruguay', 'Paraguay', 'México', 'España'];
    const roles = ['admin', 'usuario', 'interno'];
    const names = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Laura'];
    
    const randomCountry = countries[Math.floor(Math.random() * countries.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];

    // Crear el evento con el formato correcto
    const userEvent = {
      messageId: `msg-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType: "users.user.created",
      schemaVersion: "1.0",
      occurredAt: timestamp,
      producer: "users-service",
      correlationId: `corr-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      idempotencyKey: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      payload: JSON.stringify({
        userId: userId,
        nationalityOrOrigin: randomCountry,
        roles: [randomRole],
        createdAt: timestamp
      })
    };

    console.log('📋 Datos del usuario:');
    console.log(`   Nombre: ${randomName}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Nacionalidad: ${randomCountry}`);
    console.log(`   Rol: ${randomRole}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log('');

    console.log('📤 Enviando evento a la API...');
    console.log('📄 Payload completo:');
    console.log(JSON.stringify(userEvent, null, 2));
    console.log('');

    // Enviar el evento
    const response = await fetch(KAFKA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(userEvent)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('🎉 ¡ÉXITO! Evento enviado correctamente');
      console.log('📄 Respuesta de la API:');
      console.log(JSON.stringify(result, null, 2));
      console.log('');
      console.log('✅ El evento de creación de usuario ha sido encolado en Kafka');
    } else {
      const errorBody = await response.text();
      console.log('❌ Error enviando evento:');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorBody}`);
    }

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

// Ejecutar el script
sendUserCreationEvent().catch(console.error);
