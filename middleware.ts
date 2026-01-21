import { auth } from '@/lib/auth'

/**
 * Auth.js v5 Middleware
 *
 * Handles:
 * - Protected route authentication (/dashboard/*)
 * - Redirects authenticated users away from auth pages
 * - Session refresh on each request
 */
export default auth(req => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Protected routes - redirect to sign-in if not authenticated
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(signInUrl)
  }

  // Auth pages - redirect to dashboard if already authenticated
  const authPages = ['/sign-in', '/sign-up', '/verify-email']
  const isAuthPage = authPages.some(page => pathname === page)

  if (isAuthPage && isAuthenticated) {
    return Response.redirect(new URL('/dashboard', req.url))
  }

  // Continue with request
  return
})

export const config = {
  // Match all routes except static files and API routes that don't need auth
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - API routes for auth (handled by Auth.js)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
