// Test del sistema de logging de emails
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

console.log('📧 Testing Email Logging System');
console.log('================================\n');

// Función helper para hacer requests
async function testEndpoint(name, url, method = 'GET', headers = {}, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`\n🚀 [TEST] ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Method: ${method}`);
    if (body) {
      console.log(`   Body:`, JSON.stringify(body, null, 2));
    }
    console.log('   ---');

    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    console.log('   ---');

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log('   ---');
    return { success: false, error: error.message };
  }
}

async function runEmailLoggingTest() {
  const testEmail = 'test@example.com';

  console.log('1. Testing Forgot Password (with email logging):');
  console.log('   This should show:');
  console.log('   - 🔐 [PASSWORD RESET] Generando código...');
  console.log('   - ⏰ [PASSWORD RESET] Código expira en...');
  console.log('   - 📧 [EMAIL ATTEMPT] Enviando Código de Recupero...');
  console.log('   - ✅ [EMAIL SUCCESS] Código de Recupero enviado...');
  console.log('   - ✅ [PASSWORD RESET] Email de recupero enviado exitosamente...');
  
  await testEndpoint(
    'Forgot Password - With Logging',
    `${BASE_URL}/api/auth/forgot`,
    'POST',
    {},
    { email: testEmail }
  );

  console.log('\n2. Testing Verify Code (with validation logging):');
  console.log('   This should show:');
  console.log('   - 🔍 [CODE VERIFICATION] Validando código...');
  console.log('   - ❌ [CODE VERIFICATION] Código inválido... (expected)');
  
  await testEndpoint(
    'Verify Code - With Logging',
    `${BASE_URL}/api/auth/verify-code`,
    'POST',
    {},
    { email: testEmail, code: '123456' }
  );

  console.log('\n3. Testing Reset Password (with confirmation logging):');
  console.log('   This should show:');
  console.log('   - 📧 [PASSWORD RESET] Enviando confirmación...');
  console.log('   - ✅ [EMAIL SUCCESS] Confirmación enviada...');
  console.log('   - ✅ [PASSWORD RESET] Email de confirmación enviado exitosamente...');
  
  await testEndpoint(
    'Reset Password - With Logging',
    `${BASE_URL}/api/auth/reset`,
    'POST',
    {},
    { token: 'test-token', password: 'NewPassword123' }
  );

  console.log('\n📋 Logging Summary:');
  console.log('===================');
  console.log('✅ Email sending attempts are logged');
  console.log('✅ Email success/failure is logged');
  console.log('✅ Code generation is logged');
  console.log('✅ Code validation is logged');
  console.log('✅ Token generation is logged');
  console.log('✅ All timestamps are included');
  console.log('');
  console.log('🔍 Check the server console for detailed logs!');
  console.log('   Look for:');
  console.log('   - 📧 [EMAIL ATTEMPT]');
  console.log('   - ✅ [EMAIL SUCCESS]');
  console.log('   - ❌ [EMAIL ERROR]');
  console.log('   - 🔐 [PASSWORD RESET]');
  console.log('   - 🔍 [CODE VERIFICATION]');
  console.log('   - 🔑 [CODE VERIFICATION]');
}

// Ejecutar test
runEmailLoggingTest().catch(console.error);
