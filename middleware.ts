import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = new URL(request.url);

  if (pathname.startsWith('/api/')) {
    const destination = `http://localhost:5001${pathname}${search}`;
    return NextResponse.rewrite(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};


