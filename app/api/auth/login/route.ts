/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [auth]
 *     summary: User login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';
import { verifyPassword, generateJWT } from '@/lib/auth';
import { z } from 'zod';
import { validateData } from '@/lib/validations';

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

// Schema para login
const loginSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es requerido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

// POST /api/auth/login - Login de usuario con JWT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validation = validateData(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Buscar el usuario por email en LDAP
    const result = await ldapService.getUserByEmail(email);

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales inválidas'
      }, { status: 401 });
    }

    const user = result.data;

    // Verificar la contraseña
    const isPasswordValid = await verifyPassword(password, user.userPassword);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales inválidas'
      }, { status: 401 });
    }

    // Actualizar último login en LDAP (actualizar description)
    const currentDescription = user.description || '';
    const updatedDescription = currentDescription.replace(/L:\d{4}-\d{2}-\d{2}/, `L:${new Date().toISOString().substring(0, 10)}`);
    
    if (!currentDescription.includes('L:')) {
      const newDescription = currentDescription + `|L:${new Date().toISOString().substring(0, 10)}`;
      // Aquí podrías actualizar el usuario en LDAP si fuera necesario
    }

    // Generar JWT
    const token = generateJWT({
      userId: user.supabaseId || user.uid,
      email: user.mail,
      rol: user.rol || 'usuario'
    });

    // Transformar datos del usuario al formato esperado
    const userWithoutPassword = {
      id: user.supabaseId || user.uid,
      email: user.mail,
      nombre_completo: user.nombreCompleto || user.cn,
      rol: user.rol || 'usuario',
      email_verified: user.emailVerified || false,
      nacionalidad: user.nacionalidad || null,
      telefono: user.telefono || null,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: user.updatedAt || new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      uid: user.uid,
      dn: user.dn
    };

    return NextResponse.json({
      success: true,
      message: 'Login exitoso desde LDAP',
      data: {
        user: userWithoutPassword,
        token,
        tokenType: 'Bearer',
        expiresIn: '24h'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('Error en login con LDAP:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
