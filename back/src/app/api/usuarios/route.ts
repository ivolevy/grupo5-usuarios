import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../application/services/ldap.service.impl';
import { LDAPConfig } from '@/types/ldap.types';
import { createUsuarioSchema, validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

// Configuración LDAP
const ldapConfig: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

// Instanciar servicios LDAP
const ldapRepository = new LDAPRepositoryImpl(ldapConfig);
const ldapService = new LDAPServiceImpl(ldapRepository);

// GET /api/usuarios - Obtener todos los usuarios desde LDAP
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const search = searchParams.get('search');
    const uid = searchParams.get('uid');
    
    let result;
    
    // Si se especifica un email, buscar por email específico
    if (email) {
      result = await ldapService.getUserByEmail(email);
      if (!result.success || !result.data) {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          message: 'Usuario no encontrado'
        });
      }
      // Convertir resultado único a array
      result.data = [result.data];
    } else {
      // Obtener todos los usuarios
      result = await ldapService.getAllUsers();
    }
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Error al obtener usuarios desde LDAP',
        error: result.error
      }, { status: 500 });
    }

    // Transformar datos de LDAP al formato esperado por el frontend
    const usuarios = result.data.map((user: any) => ({
      id: user.supabaseId || user.uid, // Usar supabaseId si existe, sino uid
      email: user.mail,
      nombre_completo: user.nombreCompleto || user.cn,
      rol: user.rol || 'usuario',
      email_verified: user.emailVerified || false,
      nacionalidad: user.nacionalidad || null,
      telefono: user.telefono || null,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: user.updatedAt || new Date().toISOString(),
      last_login_at: user.lastLoginAt || null,
      // Campos adicionales de LDAP
      uid: user.uid,
      dn: user.dn,
      description: user.description
    }));

    return NextResponse.json({
      success: true,
      data: usuarios,
      count: usuarios.length,
      message: 'Usuarios obtenidos exitosamente desde LDAP'
    });
  } catch (error) {
    console.error('Error al obtener usuarios desde LDAP:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener usuarios desde LDAP',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST /api/usuarios - Crear nuevo usuario (LDAP + Supabase fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validation = validateData(createUsuarioSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email, password, rol, nombre_completo } = validation.data;

    // Validar fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'La contraseña no cumple con los requisitos de seguridad',
        error: passwordValidation.feedback.join(', '),
        passwordStrength: {
          score: passwordValidation.score,
          maxScore: 5,
          feedback: passwordValidation.feedback
        }
      }, { status: 400 });
    }

    const hybridService = new HybridUserServiceImpl();

    // Crear el usuario usando el servicio híbrido
    const result = await hybridService.createUser({
      email,
      password, // El servicio se encarga del hash
      rol: rol || 'usuario',
      nombre_completo: nombre_completo || email.split('@')[0]
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.error?.includes('already exists') ? 'Ya existe un usuario con este email' : 'Error al crear usuario',
        error: result.error
      }, { status: result.error?.includes('already exists') ? 409 : 500 });
    }

    // Sanitizar usuario (remover password)
    const userWithoutPassword = {
      id: result.data!.id,
      nombre_completo: result.data!.nombre_completo,
      email: result.data!.email,
      rol: result.data!.rol,
      email_verified: result.data!.email_verified,
      created_at: result.data!.created_at,
      updated_at: result.data!.updated_at,
      telefono: result.data!.telefono
    };

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Usuario creado exitosamente.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}