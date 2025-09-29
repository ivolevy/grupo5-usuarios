import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../infrastructure/repositories/ldap.repository.impl';
import { prisma } from '@/lib/db';
import { LDAPConfig } from '../../../../types/ldap.types';
import { hashPassword } from '@/lib/auth';

// Configuración LDAP
const ldapConfig: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

// POST /api/migration/sync-ldap-supabase - Sincronizar usuarios de LDAP a Supabase
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronización LDAP → Supabase...');

    const ldapRepository = new LDAPRepositoryImpl(ldapConfig);
    const ldapUsers = await ldapRepository.findAllUsers();

    console.log(`📊 Encontrados ${ldapUsers.length} usuarios en LDAP`);

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      errors_details: [] as string[]
    };

    for (const ldapUser of ldapUsers) {
      try {
        results.processed++;

        // Mapear datos de LDAP a Supabase
        const supabaseUserData = {
          id: ldapUser.uid,
          email: ldapUser.mail,
          password: ldapUser.userPassword || await hashPassword('temp_password_123'), // Password temporal
          rol: ldapUser.objectClass?.includes('admin') ? 'admin' : 
               ldapUser.objectClass?.includes('moderator') ? 'moderator' : 'usuario',
          email_verified: true,
          nombre_completo: ldapUser.cn || ldapUser.givenName || ldapUser.uid,
          telefono: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Verificar si el usuario ya existe en Supabase
        const existingUser = await prisma.usuarios.findUnique({ 
          where: { id: ldapUser.uid } 
        });

        if (existingUser) {
          // Actualizar usuario existente
          await prisma.usuarios.update({
            where: { id: ldapUser.uid },
            data: {
              email: supabaseUserData.email,
              rol: supabaseUserData.rol,
              nombre_completo: supabaseUserData.nombre_completo,
              updated_at: supabaseUserData.updated_at
            }
          });
          results.updated++;
          console.log(`✅ Usuario ${ldapUser.uid} actualizado en Supabase`);
        } else {
          // Crear nuevo usuario
          await prisma.usuarios.create({
            data: supabaseUserData
          });
          results.created++;
          console.log(`➕ Usuario ${ldapUser.uid} creado en Supabase`);
        }

      } catch (error) {
        results.errors++;
        const errorMsg = `Error procesando usuario ${ldapUser.uid}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        results.errors_details.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log('🎉 Sincronización completada');

    return NextResponse.json({
      success: true,
      message: 'Sincronización LDAP → Supabase completada',
      data: results,
      summary: {
        total_ldap_users: ldapUsers.length,
        processed: results.processed,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
        success_rate: `${((results.processed - results.errors) / results.processed * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en la sincronización',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET /api/migration/sync-ldap-supabase - Verificar diferencias entre LDAP y Supabase
export async function GET() {
  try {
    console.log('🔍 Verificando diferencias entre LDAP y Supabase...');

    const ldapRepository = new LDAPRepositoryImpl(ldapConfig);
    const ldapUsers = await ldapRepository.findAllUsers();
    const supabaseUsers = await prisma.usuarios.findMany();

    console.log(`📊 LDAP: ${ldapUsers.length} usuarios, Supabase: ${supabaseUsers.length} usuarios`);

    // Encontrar usuarios en LDAP pero no en Supabase
    const ldapUserIds = new Set(ldapUsers.map(u => u.uid));
    const supabaseUserIds = new Set(supabaseUsers.map(u => u.id));
    
    const onlyInLDAP = ldapUsers.filter(u => !supabaseUserIds.has(u.uid));
    const onlyInSupabase = supabaseUsers.filter(u => !ldapUserIds.has(u.id));

    // Encontrar usuarios con diferencias
    const differences = [];
    for (const ldapUser of ldapUsers) {
      const supabaseUser = supabaseUsers.find(u => u.id === ldapUser.uid);
      if (supabaseUser) {
        const changes = [];
        
        if (supabaseUser.email !== ldapUser.mail) {
          changes.push(`email: ${supabaseUser.email} → ${ldapUser.mail}`);
        }
        
        const ldapRole = ldapUser.objectClass?.includes('admin') ? 'admin' : 
                        ldapUser.objectClass?.includes('moderator') ? 'moderator' : 'usuario';
        if (supabaseUser.rol !== ldapRole) {
          changes.push(`rol: ${supabaseUser.rol} → ${ldapRole}`);
        }
        
        if (changes.length > 0) {
          differences.push({
            uid: ldapUser.uid,
            changes
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verificación de diferencias completada',
      data: {
        counts: {
          ldap_users: ldapUsers.length,
          supabase_users: supabaseUsers.length,
          only_in_ldap: onlyInLDAP.length,
          only_in_supabase: onlyInSupabase.length,
          with_differences: differences.length,
          in_sync: ldapUsers.length - onlyInLDAP.length - differences.length
        },
        only_in_ldap: onlyInLDAP.map(u => ({
          uid: u.uid,
          email: u.mail,
          cn: u.cn
        })),
        only_in_supabase: onlyInSupabase.map(u => ({
          id: u.id,
          email: u.email,
          nombre_completo: u.nombre_completo
        })),
        differences
      }
    });

  } catch (error) {
    console.error('❌ Error verificando diferencias:', error);
    return NextResponse.json({
      success: false,
      message: 'Error verificando diferencias',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

