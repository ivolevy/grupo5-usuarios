/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [health]
 *     summary: Health check
 *     description: Returns overall service health and checks for dependencies.
 *     responses:
 *       200:
 *         description: Service healthy
 *       207:
 *         description: Service degraded
 *       503:
 *         description: Service unhealthy
 */
import { NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../back/src/types/ldap.types';

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

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];


  // Obtener información de LDAP
  const ldapInfo = {
    host: ldapConfig.url,
    provider: 'LDAP',
    baseDN: ldapConfig.baseDN,
    usersOU: ldapConfig.usersOU
  };

  // Check 1: LDAP connection
  try {
    const ldapStart = Date.now();
    const result = await ldapService.getAllUsers();
    checks.push({
      service: 'ldap',
      status: result.success ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - ldapStart,
      details: { 
        ...ldapInfo,
        connection: result.success ? 'successful' : 'failed',
        method: 'LDAP API',
        userCount: result.data ? result.data.length : 0
      }
    });
  } catch (error) {
    checks.push({
      service: 'ldap',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: { 
        ...ldapInfo,
        error: error instanceof Error ? error.message : 'Unknown error',
        connection: 'failed'
      }
    });
  }

  // Check 2: LDAP users count
  try {
    const countStart = Date.now();
    const result = await ldapService.getAllUsers();
    const userCount = result.success && result.data ? result.data.length : 0;
    checks.push({
      service: 'ldap_users',
      status: result.success ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - countStart,
      details: { 
        userCount,
        method: 'LDAP API'
      }
    });
  } catch (error) {
    checks.push({
      service: 'ldap_users',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }

  // Check 3: JWT functionality
  try {
    const jwtStart = Date.now();
    const { generateJWT, verifyJWT } = await import('@/lib/auth');
    const testToken = generateJWT({ userId: 'test', email: 'test@test.com', rol: 'usuario' });
    const decoded = verifyJWT(testToken);
    
    checks.push({
      service: 'jwt',
      status: decoded ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - jwtStart,
      details: { canGenerate: !!testToken, canVerify: !!decoded }
    });
  } catch (error) {
    const jwtStart = Date.now();
    checks.push({
      service: 'jwt',
      status: 'unhealthy',
      responseTime: Date.now() - jwtStart,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }

  const totalTime = Date.now() - startTime;
  const overallStatus = checks.every(check => check.status === 'healthy') 
    ? 'healthy' 
    : checks.some(check => check.status === 'healthy') 
    ? 'degraded' 
    : 'unhealthy';

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: totalTime,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    summary: {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
    }
  }, { status: statusCode });
}
