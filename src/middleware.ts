import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const subdomain = hostname.split('.')[0]

  const { pathname } = request.nextUrl

  if (subdomain === 'admin' && !pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin' + (pathname === '/' ? '' : pathname)
    return NextResponse.rewrite(url)
  }

  if (subdomain === 'test' && !pathname.startsWith('/test')) {
    const url = request.nextUrl.clone()
    url.pathname = '/test' + (pathname === '/' ? '' : pathname)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
