import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard']
  
  // Rutas que requieren rol de administrador
  const adminRoutes = ['/dashboard/users']

  // Verificar si la ruta actual requiere autenticación
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Solo verificar que existe un token, no validarlo aquí
    const token = request.cookies.get('authToken')?.value

    if (!token) {
      // Redirigir al login si no hay token
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Para rutas de admin, solo verificar que existe token
    // La validación del rol se hará en el componente
    if (isAdminRoute) {
      // Permitir acceso, el componente verificará el rol
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login and register pages
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|login|register).*)',
  ],
}
