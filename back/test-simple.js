// Test simple del sistema de recupero de contraseña
console.log('🧪 Testing Password Recovery System - Simple Test');
console.log('================================================\n');

// Test 1: Verificar que los archivos existen
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/lib/email-service.ts',
  'src/app/api/auth/forgot/route.ts',
  'src/app/api/auth/verify-code/route.ts',
  'src/app/api/auth/reset/route.ts',
  'src/lib/validations.ts'
];

console.log('1. Verificando archivos implementados:');
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} - Existe`);
  } else {
    console.log(`   ❌ ${file} - No existe`);
  }
});

// Test 2: Verificar package.json
console.log('\n2. Verificando dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = ['nodemailer', '@types/nodemailer'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`   ✅ ${dep} - Instalado`);
    } else {
      console.log(`   ❌ ${dep} - No instalado`);
    }
  });
} catch (error) {
  console.log(`   ❌ Error leyendo package.json: ${error.message}`);
}

// Test 3: Verificar estructura de endpoints
console.log('\n3. Verificando estructura de endpoints:');
const endpointDirs = [
  'src/app/api/auth/forgot',
  'src/app/api/auth/verify-code',
  'src/app/api/auth/reset'
];

endpointDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir} - Existe`);
  } else {
    console.log(`   ❌ ${dir} - No existe`);
  }
});

// Test 4: Verificar contenido de archivos clave
console.log('\n4. Verificando contenido de archivos:');

// Verificar email-service.ts
try {
  const emailServiceContent = fs.readFileSync('src/lib/email-service.ts', 'utf8');
  if (emailServiceContent.includes('EmailService') && emailServiceContent.includes('nodemailer')) {
    console.log('   ✅ email-service.ts - Contenido correcto');
  } else {
    console.log('   ❌ email-service.ts - Contenido incorrecto');
  }
} catch (error) {
  console.log('   ❌ email-service.ts - Error al leer');
}

// Verificar forgot route
try {
  const forgotContent = fs.readFileSync('src/app/api/auth/forgot/route.ts', 'utf8');
  if (forgotContent.includes('POST') && forgotContent.includes('forgotPasswordSchema')) {
    console.log('   ✅ forgot/route.ts - Contenido correcto');
  } else {
    console.log('   ❌ forgot/route.ts - Contenido incorrecto');
  }
} catch (error) {
  console.log('   ❌ forgot/route.ts - Error al leer');
}

// Verificar validations.ts
try {
  const validationsContent = fs.readFileSync('src/lib/validations.ts', 'utf8');
  if (validationsContent.includes('forgotPasswordSchema') && validationsContent.includes('verifyCodeSchema')) {
    console.log('   ✅ validations.ts - Contenido correcto');
  } else {
    console.log('   ❌ validations.ts - Contenido incorrecto');
  }
} catch (error) {
  console.log('   ❌ validations.ts - Error al leer');
}

console.log('\n🎉 Verificación completa!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configurar variable MAIL_PASSWORD en .env');
console.log('2. Ejecutar: npm run dev');
console.log('3. Probar endpoints con Postman o curl');
console.log('4. Implementar frontend (ya creado)');
console.log('5. Probar flujo completo');

console.log('\n🔧 Comandos para probar:');
console.log('curl -X POST http://localhost:3000/api/auth/forgot \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"test@example.com"}\'');
console.log('');
console.log('curl -X POST http://localhost:3000/api/auth/verify-code \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"test@example.com","code":"123456"}\'');
console.log('');
console.log('curl -X POST http://localhost:3000/api/auth/reset \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"token":"test-token","password":"NewPassword123"}\'');
