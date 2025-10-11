import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';
import { verifyJWTMiddleware } from '@/lib/middleware';
import { hasPermission, Permission } from '@/lib/permissions';
import { AuthorizationError, handleError } from '@/lib/errors';

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

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Métricas de usuarios usando LDAP
    const [
      totalUsers,
      adminUsers,
      moderatorUsers,
      regularUsers
    ] = await Promise.all([
      userRepository.count(),
      userRepository.countByRole('admin'),
      userRepository.countByRole('moderador'),
      userRepository.countByRole('usuario')
    ]);

    // Obtener usuarios recientes (últimos 7 días) y de hoy
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    
    const recentUsersData = await userRepository.findByDateRange(sevenDaysAgo, new Date().toISOString());
    const usersCreatedToday = await userRepository.findByDateRange(today, new Date().toISOString());
    
    const recentUsers = recentUsersData.length;
    const usersCreatedTodayCount = usersCreatedToday.length;

    // Distribución por roles
    const roleDistribution = [
      { rol: 'admin', count: adminUsers },
      { rol: 'moderador', count: moderatorUsers },
      { rol: 'usuario', count: regularUsers }
    ];

    // Usuarios por mes (últimos 6 meses) - Simplificado para LDAP
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const usersByMonthData = await userRepository.findByDateRange(
      sixMonthsAgo.toISOString(), 
      new Date().toISOString()
    );

    // Agrupar por mes manualmente
    const usersByMonth = usersByMonthData.reduce((acc: { [key: string]: number }, user) => {
      const userData = user.toPlainObject();
      const month = userData.created_at.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
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
          usersCreatedToday: usersCreatedTodayCount,
          growthRate: totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(2) : '0'
        },
        roleDistribution,
        usersByMonth: usersByMonthArray,
        systemInfo: {
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      },
      message: 'Métricas obtenidas exitosamente'
    });

  } catch (error) {
    return handleError(error, 'admin/metrics');
  }
}
