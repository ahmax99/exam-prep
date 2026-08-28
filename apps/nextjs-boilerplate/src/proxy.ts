import { type NextRequest, NextResponse } from 'next/server'

import {
  PROTECTED_ROUTES,
  PUBLIC_AUTH_ROUTES,
  PUBLIC_ROUTES
} from './features/auth/lib/routes'

const protectedPaths = Object.values(PROTECTED_ROUTES)

const isProtectedPath = (pathname: string) =>
  protectedPaths.some((path) => pathname.startsWith(path))

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl
  // in-flight PKCE state lives in the separate auth_pkce cookie, so presence here always means a real session. Don't merge the two cookies back together.
  const isAuthenticated = !!request.cookies.get('auth_session')?.value

  if (!isAuthenticated) {
    if (isProtectedPath(pathname)) {
      const loginUrl = new URL(PUBLIC_AUTH_ROUTES.LOGIN, request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)

      return NextResponse.redirect(loginUrl)
    }
  } else if (pathname === PUBLIC_AUTH_ROUTES.LOGIN) {
    return NextResponse.redirect(new URL(PUBLIC_ROUTES.HOME, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
