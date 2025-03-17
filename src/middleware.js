import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the response
  const response = NextResponse.next();

  // Define CSP directives
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com https://*.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' http://localhost:11434 http://127.0.0.1:11434 ws://localhost:11434 wss://localhost:11434 https://*.google-analytics.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com;
    frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com https://identitytoolkit.googleapis.com;
  `.replace(/\s+/g, ' ').trim();

  // Add security headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// Only apply this middleware to specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /fonts/ (If you have a route for fonts)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!api|_next|fonts|favicon.ico|sitemap.xml).*)',
  ],
}; 