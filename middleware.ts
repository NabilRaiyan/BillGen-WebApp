// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          try {
            response.cookies.set({ name, value, ...options })
          } catch (error) {
            // Ignore for Server Components
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Define your public and protected routes
  const protectedRoutes = ['/']
  const isProtectedRoute = protectedRoutes.includes(request.nextUrl.pathname)

  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Apply middleware to the root and any other protected pages
  matcher: ['/', '/dashboard/:path*'],
}