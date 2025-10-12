import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Manejar CORS para todas las rutas de API
  if (pathname.startsWith('/api/')) {
    // Crear respuesta con headers CORS
    const response = NextResponse.next()
    
    // Headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')

    // Manejar preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }

    return response
  }

  // Rutas que requieren autenticación básica
  const protectedRoutes = ['/dashboard']
  
  // Rutas que requieren rol de administrador (se verificará en el componente)
  const adminRoutes = ['/dashboard/users', '/dashboard/admin']

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/', '/swagger']

  // Verificar si es una ruta pública
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Verificar si la ruta actual requiere autenticación
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Verificar que existe un token en cookies o localStorage
    const token = request.cookies.get('authToken')?.value

    if (!token) {
      // Redirigir al login si no hay token
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Para rutas de admin, permitir acceso pero la validación del rol se hará en el componente
    // Esto permite que el componente maneje el mensaje de acceso denegado de forma más elegante
    return NextResponse.next()
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
