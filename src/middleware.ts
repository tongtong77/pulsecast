import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Edge-safe middleware — uses JWT decoding only (no Prisma).
 * The `auth()` wrapper from NextAuth imports prisma which uses node:path,
 * so we must use the lightweight `getToken()` approach instead.
 */
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })
  const isLoggedIn = !!token
  const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
