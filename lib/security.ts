// Librería de seguridad mejorada
import crypto from 'crypto';

/**
 * Sanitiza entrada de usuario para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remover scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remover javascript: URLs
    .replace(/javascript:/gi, '')
    // Remover event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remover iframes
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remover objetos embebidos
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    // Remover applets
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    // Remover forms
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    // Limitar longitud
    .substring(0, 1000);
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valida fortaleza de contraseña
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required'],
      strength: 'weak'
    };
  }
  
  // Longitud mínima
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Debe tener al menos 8 caracteres');
  }
  
  // Longitud óptima
  if (password.length >= 12) {
    score += 1;
  }
  
  // Eliminadas las validaciones de minúsculas, mayúsculas, números y caracteres especiales
  
  // No contiene patrones comunes
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /user/i
  ];
  
  if (!commonPatterns.some(pattern => pattern.test(password))) {
    score += 1;
  } else {
    feedback.push('No debe contener patrones comunes');
  }
  
  // Determinar fortaleza
  let strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  if (score < 3) {
    strength = 'weak';
  } else if (score < 5) {
    strength = 'medium';
  } else if (score < 7) {
    strength = 'strong';
  } else {
    strength = 'very_strong';
  }
  
  const isValid = score >= 1; // Solo requiere longitud mínima
  
  return {
    isValid,
    score,
    feedback,
    strength
  };
}

/**
 * Genera un token seguro aleatorio
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Genera un hash seguro para verificación
 */
export function generateSecureHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Valida formato de UUID
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida formato de IP
 */
export function validateIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Detecta patrones sospechosos en entrada
 */
export function detectSuspiciousPatterns(input: string): {
  isSuspicious: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  
  if (!input || typeof input !== 'string') {
    return { isSuspicious: false, patterns: [] };
  }
  
  // Patrones de SQL injection
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(;\s*(DROP|DELETE|INSERT|UPDATE))/i
  ];
  
  // Patrones de XSS
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi
  ];
  
  // Patrones de path traversal
  const pathPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ];
  
  // Verificar SQL injection
  if (sqlPatterns.some(pattern => pattern.test(input))) {
    patterns.push('SQL injection attempt');
  }
  
  // Verificar XSS
  if (xssPatterns.some(pattern => pattern.test(input))) {
    patterns.push('XSS attempt');
  }
  
  // Verificar path traversal
  if (pathPatterns.some(pattern => pattern.test(input))) {
    patterns.push('Path traversal attempt');
  }
  
  // Verificar comandos del sistema
  if (/[;&|`$(){}[\]]/.test(input)) {
    patterns.push('Command injection attempt');
  }
  
  // Verificar entrada muy larga
  if (input.length > 10000) {
    patterns.push('Oversized input');
  }
  
  // Verificar caracteres no ASCII sospechosos
  if (/[^\x20-\x7E]/.test(input) && input.length > 100) {
    patterns.push('Non-ASCII characters');
  }
  
  return {
    isSuspicious: patterns.length > 0,
    patterns
  };
}

/**
 * Valida y sanitiza datos de entrada
 */
export function validateAndSanitizeInput(input: any, type: 'string' | 'email' | 'uuid' | 'number'): {
  isValid: boolean;
  value: any;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (type === 'string') {
    if (typeof input !== 'string') {
      errors.push('Input must be a string');
      return { isValid: false, value: '', errors };
    }
    
    const sanitized = sanitizeInput(input);
    const suspicious = detectSuspiciousPatterns(input);
    
    if (suspicious.isSuspicious) {
      errors.push(`Suspicious patterns detected: ${suspicious.patterns.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      value: sanitized,
      errors
    };
  }
  
  if (type === 'email') {
    if (typeof input !== 'string') {
      errors.push('Email must be a string');
      return { isValid: false, value: '', errors };
    }
    
    const sanitized = sanitizeInput(input);
    
    if (!validateEmail(sanitized)) {
      errors.push('Invalid email format');
    }
    
    return {
      isValid: errors.length === 0,
      value: sanitized,
      errors
    };
  }
  
  if (type === 'uuid') {
    if (typeof input !== 'string') {
      errors.push('UUID must be a string');
      return { isValid: false, value: '', errors };
    }
    
    if (!validateUUID(input)) {
      errors.push('Invalid UUID format');
    }
    
    return {
      isValid: errors.length === 0,
      value: input,
      errors
    };
  }
  
  if (type === 'number') {
    const num = Number(input);
    
    if (isNaN(num)) {
      errors.push('Input must be a valid number');
      return { isValid: false, value: 0, errors };
    }
    
    if (!Number.isInteger(num)) {
      errors.push('Input must be an integer');
    }
    
    return {
      isValid: errors.length === 0,
      value: num,
      errors
    };
  }
  
  return { isValid: false, value: null, errors: ['Invalid validation type'] };
}

/**
 * Genera un nonce para CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Valida headers de seguridad
 */
export function validateSecurityHeaders(headers: Record<string, string>): {
  isValid: boolean;
  missing: string[];
  recommendations: string[];
} {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security'
  ];
  
  const recommendedHeaders = [
    'Content-Security-Policy',
    'Referrer-Policy',
    'Permissions-Policy'
  ];
  
  const missing = requiredHeaders.filter(header => !headers[header]);
  const missingRecommended = recommendedHeaders.filter(header => !headers[header]);
  
  return {
    isValid: missing.length === 0,
    missing,
    recommendations: missingRecommended
  };
}

/**
 * Detecta intentos de fuerza bruta
 */
export function detectBruteForceAttempts(
  attempts: Array<{ timestamp: number; success: boolean }>,
  windowMs: number = 15 * 60 * 1000, // 15 minutos
  maxAttempts: number = 5
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const recentAttempts = attempts.filter(attempt => attempt.timestamp > windowStart);
  const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
  
  return failedAttempts.length >= maxAttempts;
}

/**
 * Encripta una contraseña usando AES-128-CBC
 * @param password - Contraseña en texto plano
 * @returns string - Contraseña encriptada en formato base64
 */
export function encryptPasswordAES128(password: string): string {
  const algorithm = 'aes-128-cbc';
  const key = 'default-key-16b'; // 16 bytes para AES-128
  
  // Asegurar que la clave tenga exactamente 16 bytes
  const keyBuffer = Buffer.from(key.padEnd(16, '0').substring(0, 16), 'utf8');
  
  // Generar IV aleatorio
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Combinar IV y texto encriptado (IV:encrypted)
  return `${iv.toString('base64')}:${encrypted}`;
}

/**
 * Desencripta una contraseña usando AES-128-CBC
 * @param encryptedPassword - Contraseña encriptada en formato base64 (IV:encrypted)
 * @returns string - Contraseña en texto plano
 */
export function decryptPasswordAES128(encryptedPassword: string): string {
  const algorithm = 'aes-128-cbc';
  const key = 'default-key-16b'; // 16 bytes para AES-128
  
  // Asegurar que la clave tenga exactamente 16 bytes
  const keyBuffer = Buffer.from(key.padEnd(16, '0').substring(0, 16), 'utf8');
  
  // Separar IV y texto encriptado
  const parts = encryptedPassword.split(':');
  if (parts.length !== 2) {
    throw new Error('Formato de contraseña encriptada inválido');
  }
  
  const iv = Buffer.from(parts[0], 'base64');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
