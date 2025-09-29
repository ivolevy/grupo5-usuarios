/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags: [usuarios]
 *     summary: List users
 *     responses:
 *       200:
 *         description: Users list
 *   post:
 *     tags: [usuarios]
 *     summary: Create user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_completo, email, password, nacionalidad]
 *             properties:
 *               nombre_completo:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, moderador, usuario]
 *               nacionalidad:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../back/src/types/ldap.types';
import { createUsuarioSchema, validateData } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';

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

// POST /api/usuarios - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para registro:', body);
    
    // Validar datos de entrada
    const validation = validateData(createUsuarioSchema, body);
    if (!validation.success) {
      console.log('Error de validación:', validation.error);
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { nombre_completo, email, password, rol, nacionalidad, telefono } = validation.data;

    // Validación simple de contraseña (solo longitud mínima)
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      }, { status: 400 });
    }

    // Verificar si el usuario ya existe en LDAP
    const existingUser = await ldapService.getUserByEmail(email);

    if (existingUser.success && existingUser.data) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un usuario con este email'
      }, { status: 409 });
    }

    // Hashear la contraseña con mayor seguridad
    const hashedPassword = await hashPassword(password);

    // Generar UID único
    const uid = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
    const uidNumber = (1000 + Math.floor(Math.random() * 9000)).toString();
    const gidNumber = '100';

    // Procesar nombre completo
    const nameParts = (nombre_completo || '').trim().split(' ');
    const cn = nombre_completo || email.split('@')[0];
    const sn = nameParts.length > 1 ? nameParts[nameParts.length - 1] : cn;
    const givenName = nameParts.length > 1 ? nameParts[0] : cn;

    // Crear descripción con todos los datos de Supabase
    const description = [
      `ID:${Date.now().toString().substring(0, 6)}`,
      `Rol:${rol || 'usuario'}`,
      `Ver:S`,
      `C:${new Date().toISOString().substring(0, 10)}`,
      `U:${new Date().toISOString().substring(0, 10)}`,
      nombre_completo ? `Nom:${nombre_completo.substring(0, 10)}` : '',
      nacionalidad ? `Nac:${nacionalidad.substring(0, 5)}` : '',
      telefono ? `Tel:${telefono.substring(0, 10)}` : ''
    ].filter(Boolean).join('|');

    // Crear el usuario en LDAP
    const userData = {
      uid,
      cn,
      sn,
      givenName,
      mail: email,
      userPassword: hashedPassword,
      uidNumber,
      gidNumber,
      homeDirectory: `/home/${uid}`,
      loginShell: '/bin/bash',
      description
    };

    const result = await ldapService.createUser(userData);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Error al crear usuario en LDAP',
        error: result.error
      }, { status: 500 });
    }

    // Transformar respuesta al formato esperado
    const userWithoutPassword = {
      id: result.data.uid,
      email: result.data.mail,
      nombre_completo: result.data.nombreCompleto || result.data.cn,
      rol: result.data.rol || rol || 'usuario',
      email_verified: true,
      nacionalidad: result.data.nacionalidad || nacionalidad,
      telefono: result.data.telefono || telefono,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      uid: result.data.uid,
      dn: result.data.dn
    };

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Usuario creado exitosamente en LDAP.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear usuario en LDAP:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear usuario en LDAP',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}