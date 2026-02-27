import { NextRequest, NextResponse } from 'next/server';

const VALID_SUBDOMAINS = ['admin', 'test'] as const;
type Subdomain = (typeof VALID_SUBDOMAINS)[number];

function getSubdomain(host: string): Subdomain | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Handle *.localhost for local development
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    return VALID_SUBDOMAINS.includes(sub as Subdomain) ? (sub as Subdomain) : null;
  }

  // Handle production subdomains (e.g. admin.mapadevalores.com)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    return VALID_SUBDOMAINS.includes(sub as Subdomain) ? (sub as Subdomain) : null;
  }

  return null;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // Let static assets, Next.js internals, and API routes pass through
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(host);

  if (!subdomain) {
    // No valid subdomain — show the root page (minimal fallback)
    return NextResponse.next();
  }

  // Block cross-access: admin.* should not serve /test paths and vice versa
  const otherSubdomain = subdomain === 'admin' ? 'test' : 'admin';
  if (pathname.startsWith(`/${otherSubdomain}`)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Already rewritten (path starts with /admin or /test) — pass through
  if (pathname.startsWith(`/${subdomain}`)) {
    return NextResponse.next();
  }

  // Rewrite: admin.mapadevalores.com/ → /admin, admin.mapadevalores.com/foo → /admin/foo
  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
