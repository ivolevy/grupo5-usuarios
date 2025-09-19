import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configuración para el hash de contraseñas
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || '45c3e205e1a3d92ad1b8622cfac971cd2f28250cfbd02b8f1d907fa716054cc0745332bd6773c282155c8b6dcf3538fce89d021fd48b35f2759428675064c216';
const JWT_EXPIRES_IN = '24h'; // Token expira en 24 horas

// Tipos para JWT
export interface JWTPayload {
  userId: string;
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Promise<string> - Contraseña hasheada
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    throw new Error('Error al procesar la contraseña');
  }
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Contraseña hasheada
 * @returns Promise<boolean> - true si coincide, false si no
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    throw new Error('Error al verificar la contraseña');
  }
}

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @returns object - Resultado de la validación
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Longitud mínima
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Debe tener al menos 8 caracteres');
  }

  // Solo requiere longitud mínima
  const isValid = score >= 1; // Solo requiere longitud mínima

  return {
    isValid,
    score,
    feedback
  };
}

/**
 * Genera un token JWT con la información del usuario
 * @param payload - Información del usuario para incluir en el token
 * @returns string - Token JWT
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'grupousuarios-tp',
      audience: 'grupousuarios-tp-users'
    });
    return token;
  } catch (error) {
    console.error('Error al generar JWT:', error);
    throw new Error('Error al generar token de autenticación');
  }
}

/**
 * Verifica y decodifica un token JWT
 * @param token - Token JWT a verificar
 * @returns JWTPayload | null - Payload del token si es válido, null si no
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'grupousuarios-tp',
      audience: 'grupousuarios-tp-users'
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Error al verificar JWT:', error);
    return null;
  }
}

/**
 * Decodifica un token JWT sin verificar (útil para obtener info expirada)
 * @param token - Token JWT a decodificar
 * @returns JWTPayload | null - Payload del token si se puede decodificar
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Error al decodificar JWT:', error);
    return null;
  }
}

/**
 * Extrae el token JWT del header Authorization
 * @param authHeader - Header de autorización (Bearer token)
 * @returns string | null - Token si existe, null si no
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
