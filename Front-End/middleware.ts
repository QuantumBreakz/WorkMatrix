import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';

// Define route prefixes/types
const PROTECTED_ROUTE_PREFIXES = ['/admin', '/employee', '/dashboard']; // Generic /dashboard might be a common prefix
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const PUBLIC_ROUTES = ['/', '/about', '/contact', '/api/auth/callback']; // Allow root and auth callback

// Create Redis instance for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create rate limiter
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    Number(process.env.NEXT_PUBLIC_RATE_LIMIT_REQUESTS) || 100,
    `${Number(process.env.NEXT_PUBLIC_RATE_LIMIT_WINDOW_MS) || 900000}ms`
  ),
});

// CSRF Token validation
const validateCsrfToken = (request: NextRequest): boolean => {
  const csrfToken = request.headers.get('x-csrf-token');
  const expectedToken = request.cookies.get('csrf-token')?.value;

  if (!csrfToken || !expectedToken) {
    return false;
  }

  return csrfToken === expectedToken;
};

// Generate CSRF Token
const generateCsrfToken = (): string => {
  return nanoid(32);
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  // Get IP for rate limiting
  const ip = req.ip || '127.0.0.1';
  const { pathname } = req.nextUrl;

  // Apply rate limiting for auth routes
  if (AUTH_ROUTES.includes(pathname)) {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  // CSRF Protection for mutations
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (!validateCsrfToken(req)) {
      return new NextResponse('Invalid CSRF Token', { status: 403 });
    }
  }

  // Generate and set CSRF token for GET requests
  if (req.method === 'GET' && !req.cookies.get('csrf-token')) {
    const csrfToken = generateCsrfToken();
    res.cookies.set('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Session Management
  if (session) {
    // Check session expiry
    const sessionExpiry = new Date(session.expires_at || 0).getTime();
    const now = Date.now();

    if (sessionExpiry < now) {
      // Session has expired, sign out the user
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Refresh session if it's close to expiring (e.g., within 5 minutes)
    if (sessionExpiry - now < 5 * 60 * 1000) {
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      if (refreshedSession) {
        // Update session in response
        res.cookies.set('sb-access-token', refreshedSession.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });
      }
    }
  }

  // Allow access to explicitly public routes or API routes like auth callback
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/')) {
    // If user is logged in AND on an AUTH_ROUTE (e.g. /login), redirect them to their dashboard
    if (session && AUTH_ROUTES.includes(pathname)) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      let dashboardUrl = '/'; // Default to home page if role is unknown
      if (userProfile?.role === 'admin') {
        dashboardUrl = '/admin/dashboard';
      } else if (userProfile?.role === 'employee') {
        dashboardUrl = '/employee/dashboard';
      }
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }
    return res; // Allow access to public routes
  }

  // If user is not signed in and trying to access a protected route, redirect to login
  if (!session && PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(`redirectedFrom`, pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in, perform further checks
  if (session) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id) // Assuming user.id from session is the UUID
      .single();

    const userRole = userProfile?.role;

    // If user is on an AUTH_ROUTE (e.g. /login) but is already logged in, redirect to dashboard
    if (AUTH_ROUTES.includes(pathname)) {
      let dashboardUrl = '/'; // Default to home page
      if (userRole === 'admin') {
        dashboardUrl = '/admin/dashboard';
      } else if (userRole === 'employee') {
        dashboardUrl = '/employee/dashboard';
      }
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    // Role-based access for /admin and /employee routes
    // Allow access to '/' even if logged in (handled by page.tsx logic)
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      // If not an admin trying to access admin routes, redirect to their employee dashboard or home
      return NextResponse.redirect(new URL(userRole === 'employee' ? '/employee/dashboard' : '/', req.url));
    }
    // Employees trying to access non-employee-specific protected routes (if any, other than their own /employee/**)
    // could be handled here if needed, but typically they'd just be blocked from /admin/**

    // If an admin is trying to access /employee/*, allow it.
    // If an employee is trying to access /admin/*, it's blocked above.
    // If anyone is trying to access /dashboard/* (generic), role check might be needed or page-level.
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder contents (e.g. /images/, /fonts/) - adjust regex if needed
     *
     * Current matcher: "/((?!_next/static|_next/image|favicon.ico|public).*)"
     * To explicitly exclude /public/*, you might need a more specific regex or list them.
     * For now, relying on PUBLIC_ROUTES array for paths like '/'
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\..*).*)", // Excludes files with extensions, more broadly allowing /public paths with subdirectories
    // Or, if you want to be more explicit and list what IS matched:
    // "/","/login","/register","/admin/:path*","/employee/:path*","/dashboard/:path*"
  ],
};
