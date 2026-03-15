import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Routes that are always public (no auth required)
const PUBLIC_PREFIXES = ['/book', '/login', '/_next', '/favicon']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — always allow
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // If Supabase is not configured, allow through (localStorage mode)
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  // Auth disabled for now — re-enable when auth is properly configured
  return NextResponse.next()
}

export const config = {
  // Match all routes except static files and API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
