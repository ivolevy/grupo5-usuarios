import { NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];


  // Obtener información de la base de datos
  const databaseType = 'ldap'; // Solo LDAP disponible
  const dbInfo = {
    type: databaseType,
    provider: databaseType === 'ldap' ? 'LDAP' : 'PostgreSQL',
    url: databaseType === 'ldap' 
      ? process.env.LDAP_URL?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured'
      : 'LDAP Server'
  };

  // Check 1: Database connection
  try {
    const dbStart = Date.now();
    const { userRepository } = await getServices();
    await userRepository.count();
    checks.push({
      service: 'database',
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      details: { 
        ...dbInfo,
        connection: 'successful',
        method: 'LDAP Server'
      }
    });
  } catch (error) {
    checks.push({
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: { 
        ...dbInfo,
        error: error instanceof Error ? error.message : 'Unknown error',
        connection: 'failed'
      }
    });
  }

  // Check 2: Users table
  try {
    const tableStart = Date.now();
    const { userRepository } = await getServices();
    const count = await userRepository.count();
    checks.push({
      service: 'users_table',
      status: 'healthy',
      responseTime: Date.now() - tableStart,
      details: { 
        userCount: count,
        method: 'LDAP Server'
      }
    });
  } catch (error) {
    checks.push({
      service: 'users_table',
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
