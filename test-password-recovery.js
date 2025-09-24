// Script para probar el flujo completo de recupero de contraseña

const BASE_URL = 'http://localhost:3000';

async function testForgotPassword(email) {
  try {
    console.log(`🔧 Probando recupero de contraseña para: ${email}`);
    
    const response = await fetch(`${BASE_URL}/api/auth/forgot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    
    console.log(`📧 Respuesta (${response.status}):`, result);
    
    if (result.success) {
      console.log('✅ Recupero de contraseña procesado correctamente');
      return true;
    } else {
      console.log('❌ Error en recupero de contraseña:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    return false;
  }
}

async function testVerifyCode(email, code) {
  try {
    console.log(`🔧 Probando verificación de código: ${code}`);
    
    const response = await fetch(`${BASE_URL}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code })
    });

    const result = await response.json();
    
    console.log(`🔐 Respuesta de verificación (${response.status}):`, result);
    
    if (result.success) {
      console.log('✅ Código verificado correctamente');
      return result.data?.token;
    } else {
      console.log('❌ Error en verificación:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    return null;
  }
}

async function testResetPassword(token, newPassword) {
  try {
    console.log(`🔧 Probando reset de contraseña con token`);
    
    const response = await fetch(`${BASE_URL}/api/auth/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword })
    });

    const result = await response.json();
    
    console.log(`🔑 Respuesta de reset (${response.status}):`, result);
    
    if (result.success) {
      console.log('✅ Contraseña actualizada correctamente');
      return true;
    } else {
      console.log('❌ Error en reset:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas del flujo completo de recupero de contraseña...\n');
  
  const testEmail = 'panchizanon@gmail.com';
  const testCode = '123456'; // Código de prueba
  const newPassword = 'nuevaPassword123';
  
  // Paso 1: Solicitar recupero de contraseña
  console.log('📧 PASO 1: Solicitar recupero de contraseña');
  const forgotSuccess = await testForgotPassword(testEmail);
  
  if (forgotSuccess) {
    console.log('\n🔐 PASO 2: Verificar código (simulando que el usuario ingresa el código)');
    const resetToken = await testVerifyCode(testEmail, testCode);
    
    if (resetToken) {
      console.log('\n🔑 PASO 3: Resetear contraseña');
      await testResetPassword(resetToken, newPassword);
    }
  }
  
  console.log('\n✨ Pruebas completadas');
}

main().catch(console.error);
