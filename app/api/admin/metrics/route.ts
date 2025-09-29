/**
 * @openapi
 * /api/admin/metrics:
 *   get:
 *     tags: [admin]
 *     summary: Get admin metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';
import { verifyJWTMiddleware } from '@/lib/middleware';
import { hasPermission, Permission } from '@/lib/permissions';
import { AuthorizationError, handleError } from '@/lib/errors';

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

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = verifyJWTMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Verificar permisos de admin
    if (!hasPermission(authResult.user.rol, Permission.ADMIN_DASHBOARD)) {
      throw new AuthorizationError('Admin access required');
    }

    // Obtener todos los usuarios de LDAP
    const usersResult = await ldapService.getAllUsers();
    
    if (!usersResult.success || !usersResult.data) {
      throw new Error('Error al obtener usuarios de LDAP');
    }

    const users = usersResult.data;
    const totalUsers = users.length;

    // Calcular métricas desde LDAP
    const adminUsers = users.filter(user => user.rol === 'admin').length;
    const moderatorUsers = users.filter(user => user.rol === 'moderador').length;
    const regularUsers = users.filter(user => user.rol === 'usuario').length;

    // Calcular usuarios recientes (últimos 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = users.filter(user => {
      if (!user.createdAt) return false;
      const createdDate = new Date(user.createdAt);
      return createdDate >= sevenDaysAgo;
    }).length;

    // Calcular usuarios creados hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usersCreatedToday = users.filter(user => {
      if (!user.createdAt) return false;
      const createdDate = new Date(user.createdAt);
      return createdDate >= today;
    }).length;

    // Distribución por roles
    const roleDistribution = [
      { rol: 'admin', count: adminUsers },
      { rol: 'moderador', count: moderatorUsers },
      { rol: 'usuario', count: regularUsers }
    ];

    // Usuarios por mes (últimos 6 meses) - Desde LDAP
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Filtrar usuarios de los últimos 6 meses y agrupar por mes
    const recentUsersData = users.filter(user => {
      if (!user.createdAt) return false;
      const createdDate = new Date(user.createdAt);
      return createdDate >= sixMonthsAgo;
    });

    // Agrupar por mes manualmente
    const usersByMonth = recentUsersData.reduce((acc: { [key: string]: number }, user) => {
      if (user.createdAt) {
        const month = user.createdAt.substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    const usersByMonthArray = Object.entries(usersByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          recentUsers,
          usersCreatedToday,
          growthRate: totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(2) : '0'
        },
        roleDistribution,
        usersByMonth: usersByMonthArray,
        systemInfo: {
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          dataSource: 'LDAP'
        }
      },
      message: 'Métricas obtenidas exitosamente desde LDAP'
    });

  } catch (error) {
    return handleError(error, 'admin/metrics');
  }
}
