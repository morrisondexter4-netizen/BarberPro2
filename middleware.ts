import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that are always public (no auth required)
const PUBLIC_PREFIXES = ['/book', '/login', '/_next', '/favicon', '/api']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  // Auth disabled for dev — pass all requests through
  return NextResponse.next()
}

export const config = {
  // Match all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
