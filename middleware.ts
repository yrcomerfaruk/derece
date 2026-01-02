import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser()

  // ROUTE PROTECTION RULES
  const path = request.nextUrl.pathname

  // 1. Protected Routes (require login)
  // - /platform/* (Platform pages: Koç, Program vs)
  // - /chat/* (Chat routes)
  const isProtectedRoute = path.startsWith('/platform') ||
    path.startsWith('/chat') ||
    path.startsWith('/program')

  if (isProtectedRoute && !user) {
    // If not logged in, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('tab', 'giris')
    // url.searchParams.set('next', path) // Optional: Redirect back after login
    return NextResponse.redirect(url)
  }

  // 2. Auth Routes (accessible only if guest)
  // - /auth/* (Login, Register, Forgot Password)
  // BUT: /auth/callback should be allowed for email verification flows
  const isAuthRoute = path.startsWith('/auth')
  const isCallbackRoute = path.startsWith('/auth/callback')

  if (isAuthRoute && !isCallbackRoute && user) {
    // If already logged in, redirect to platform
    const url = request.nextUrl.clone()
    url.pathname = '/platform'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svg, etc. if in public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
