import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

    // Métricas de usuarios
    const [
      totalUsers,
      adminUsers,
      moderatorUsers,
      regularUsers,
      recentUsers,
      usersCreatedToday
    ] = await Promise.all([
      prisma.usuarios.count(),
      prisma.usuarios.count({ where: { rol: 'admin' } }),
      prisma.usuarios.count({ where: { rol: 'moderador' } }),
      prisma.usuarios.count({ where: { rol: 'usuario' } }),
      prisma.usuarios.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Últimos 7 días
          }
        }
      }),
      prisma.usuarios.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)).toISOString() // Hoy
          }
        }
      })
    ]);

    // Distribución por roles
    const roleDistribution = [
      { rol: 'admin', count: adminUsers },
      { rol: 'moderador', count: moderatorUsers },
      { rol: 'usuario', count: regularUsers }
    ];

    // Usuarios por mes (últimos 6 meses) - Simplificado para REST API
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Obtener todos los usuarios de los últimos 6 meses y agrupar por mes
    const recentUsersData = await prisma.usuarios.findMany({
      where: {
        created_at: {
          gte: sixMonthsAgo.toISOString()
        }
      },
      select: {
        created_at: true
      }
    });

    // Agrupar por mes manualmente
    const usersByMonth = recentUsersData.reduce((acc: { [key: string]: number }, user) => {
      const month = user.created_at.substring(0, 7); // YYYY-MM
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
          usersCreatedToday,
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
