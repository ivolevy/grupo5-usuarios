/**
 * Script de prueba para la migración Supabase → LDAP
 */

const API_BASE = 'http://localhost:3001';

async function testMigration() {
  console.log('🧪 Probando migración Supabase → LDAP...\n');
  
  try {
    // Ejecutar migración
    console.log('📦 Ejecutando migración...');
    const migrationResponse = await fetch(`${API_BASE}/api/migration/supabase-to-ldap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const migrationResult = await migrationResponse.json();
    
    if (migrationResult.success) {
      console.log('✅ Migración exitosa!');
      console.log('📊 Resultado:', JSON.stringify(migrationResult, null, 2));
    } else {
      console.log('❌ Migración falló!');
      console.log('📊 Error:', JSON.stringify(migrationResult, null, 2));
      return;
    }
    
    // Esperar un momento para que se complete la migración
    console.log('\n⏳ Esperando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar usuarios migrados
    console.log('\n🔍 Verificando usuarios migrados...');
    const usersResponse = await fetch(`${API_BASE}/api/usuarios?limit=50`);
    const usersResult = await usersResponse.json();
    
    if (usersResult.success) {
      console.log(`✅ Se encontraron ${usersResult.data.length} usuarios en LDAP`);
      console.log('\n👥 Primeros 5 usuarios:');
      usersResult.data.slice(0, 5).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - ${user.nombre_completo || 'Sin nombre'} - ${user.rol}`);
      });
    } else {
      console.log('❌ Error obteniendo usuarios:', usersResult.error);
    }
    
    // Probar autenticación con un usuario migrado
    console.log('\n🔐 Probando autenticación...');
    const authResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'panchi@gmail.com',
        password: 'test123' // Password sin hash para prueba
      })
    });
    
    const authResult = await authResponse.json();
    
    if (authResult.success) {
      console.log('✅ Autenticación exitosa!');
      console.log(`👤 Usuario autenticado: ${authResult.data.user.email}`);
    } else {
      console.log('❌ Error en autenticación:', authResult.error);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar prueba
testMigration();

