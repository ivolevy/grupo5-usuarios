#!/usr/bin/env node

/**
 * Script de prueba para el flujo completo de recuperación de contraseña
 * 
 * Este script prueba:
 * 1. Solicitar código de verificación (forgot-password)
 * 2. Verificar el código (verify-code)
 * 3. Resetear la contraseña (reset-password)
 */

const BASE_URL = 'http://localhost:3000/api/auth';

// Email de prueba (debe existir en la base de datos)
const TEST_EMAIL = 'test@example.com';

async function makeRequest(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    console.log(`\n📡 ${endpoint}:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testPasswordRecoveryFlow() {
  console.log('🚀 Iniciando prueba del flujo de recuperación de contraseña');
  console.log('=' .repeat(60));
  
  // Paso 1: Solicitar código de verificación
  console.log('\n1️⃣ Paso 1: Solicitar código de verificación');
  const forgotResult = await makeRequest('/forgot', {
    email: TEST_EMAIL
  });
  
  if (!forgotResult.success) {
    console.error('❌ Falló la solicitud de código de verificación');
    return;
  }
  
  // En modo desarrollo, el código se muestra en la consola
  console.log('\n📧 En modo desarrollo, revisa la consola del servidor para ver el código generado');
  console.log('   O revisa los logs para encontrar el código de verificación');
  
  // Paso 2: Simular verificación de código
  console.log('\n2️⃣ Paso 2: Verificar código (simulado)');
  console.log('   Para probar completamente, necesitas:');
  console.log('   1. Revisar los logs del servidor para obtener el código');
  console.log('   2. Usar el endpoint /verify-code con el código real');
  console.log('   3. Usar el token devuelto para resetear la contraseña');
  
  // Ejemplo de cómo sería la verificación (con código simulado)
  const simulatedCode = '123456';
  const verifyResult = await makeRequest('/verify-code', {
    email: TEST_EMAIL,
    code: simulatedCode
  });
  
  if (!verifyResult.success) {
    console.log('   ⚠️  Esto es esperado con un código simulado');
  }
  
  // Paso 3: Simular reset de contraseña
  console.log('\n3️⃣ Paso 3: Reset de contraseña (simulado)');
  console.log('   Para probar completamente, necesitas:');
  console.log('   1. Un token válido del paso de verificación');
  console.log('   2. Una nueva contraseña que cumpla los requisitos');
  
  const resetResult = await makeRequest('/reset', {
    token: 'simulated-token',
    password: 'NewPassword123!'
  });
  
  if (!resetResult.success) {
    console.log('   ⚠️  Esto es esperado con un token simulado');
  }
  
  console.log('\n✅ Prueba completada');
  console.log('\n📋 Para probar completamente:');
  console.log('   1. Asegúrate de que el servidor esté corriendo');
  console.log('   2. Configura las variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD');
  console.log('   3. Usa un email que exista en la base de datos');
  console.log('   4. Revisa los logs del servidor para obtener el código real');
  console.log('   5. Usa el código real para completar el flujo');
}

// Ejecutar la prueba
testPasswordRecoveryFlow().catch(console.error);
