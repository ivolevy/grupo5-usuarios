const { Kafka } = require('kafkajs');

// Configuración de Kafka
const kafka = new Kafka({
  clientId: 'test-specific-message',
  brokers: ['34.172.179.60:9094'],
});

async function testSpecificUserCreation() {
  console.log('🚀 TEST ESPECÍFICO: CAPTURAR MENSAJE DE CREACIÓN DE USUARIO');
  console.log('══════════════════════════════════════════════════════════════');

  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: `test-specific-${Date.now()}` });

  try {
    // 1. Conectar producer y consumer
    console.log('📡 Conectando a Kafka...');
    await producer.connect();
    await consumer.connect();
    console.log('✅ Conectado exitosamente');

    // 2. Suscribirse al topic
    console.log('📋 Suscribiéndose al topic users.events...');
    await consumer.subscribe({ 
      topic: 'users.events',
      fromBeginning: false // Solo mensajes nuevos
    });
    console.log('✅ Suscrito al topic');

    // 3. Iniciar consumer
    console.log('👂 Iniciando consumer...');
    let messageReceived = false;
    let receivedMessage = null;

    const consumerPromise = consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const key = message.key?.toString();
        const value = JSON.parse(message.value.toString());
        
        console.log('🎉 MENSAJE RECIBIDO:');
        console.log(`   Topic: ${topic}`);
        console.log(`   Partition: ${partition}`);
        console.log(`   Offset: ${message.offset}`);
        console.log(`   Key: ${key}`);
        console.log(`   Value:`, JSON.stringify(value, null, 2));
        
        messageReceived = true;
        receivedMessage = { key, value, offset: message.offset };
      },
    });

    // 4. Esperar un poco para que el consumer esté listo
    console.log('⏳ Esperando que el consumer esté listo...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Enviar evento directamente a Kafka
    console.log('📤 Enviando evento directamente a Kafka...');
    const userId = `test-direct-${Date.now()}`;
    const eventData = {
      event_type: 'users.user.created',
      schema_version: '1.0',
      payload: {
        userId: userId,
        nationalityOrOrigin: 'Argentina',
        roles: ['admin'],
        createdAt: new Date().toISOString()
      }
    };

    console.log('📋 Datos del evento:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Event Type: ${eventData.event_type}`);
    console.log(`   Nacionalidad: ${eventData.payload.nationalityOrOrigin}`);
    console.log(`   Roles: ${eventData.payload.roles.join(', ')}`);
    console.log(`   Timestamp: ${eventData.payload.createdAt}`);

    // Enviar mensaje a Kafka
    await producer.send({
      topic: 'users.events',
      messages: [
        {
          key: `user-${userId}`,
          value: JSON.stringify(eventData)
        }
      ]
    });

    console.log('✅ Evento enviado exitosamente a Kafka');

    // 6. Esperar el mensaje en Kafka (máximo 10 segundos)
    console.log('⏳ Esperando mensaje en Kafka...');
    const startTime = Date.now();
    const timeout = 10000; // 10 segundos

    while (!messageReceived && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (messageReceived) {
      console.log('🎉 ¡ÉXITO! Mensaje recibido en Kafka');
      console.log('📊 Resumen del mensaje:');
      console.log(`   ID del usuario: ${receivedMessage.value.payload.userId}`);
      console.log(`   Evento: ${receivedMessage.value.event_type}`);
      console.log(`   Offset: ${receivedMessage.offset}`);
      console.log(`   Timestamp: ${receivedMessage.value.payload.createdAt}`);
    } else {
      console.log('❌ TIMEOUT: No se recibió mensaje en Kafka');
    }

  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    // 7. Desconectar
    console.log('🔌 Desconectando...');
    await consumer.disconnect();
    await producer.disconnect();
    console.log('✅ Desconectado exitosamente');
  }
}

// Ejecutar el test
testSpecificUserCreation().catch(console.error);
