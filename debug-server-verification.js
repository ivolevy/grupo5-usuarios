#!/usr/bin/env node

/**
 * Script para debuggear exactamente lo que hace el servidor en verifyCode
 * Este script simula exactamente el flujo del servidor
 */

// Importar las mismas funciones que usa el servidor
const { verifyCode } = require('./lib/email-verification');

async function testServerVerification() {
  console.log('🔍 DEBUGGING SERVER VERIFICATION FUNCTION');
  console.log('==========================================');
  
  try {
    const result = await verifyCode('panchizanon@gmail.com', '886912');
    
    console.log('\n🎯 RESULTADO DEL SERVIDOR:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error en verifyCode:', error.message);
    console.error('Stack:', error.stack);
  }
}

testServerVerification();
