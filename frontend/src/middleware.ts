import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Placeholder for JWT authentication
  // const token = request.cookies.get('token')?.value;
  // if (!token && request.nextUrl.pathname.startsWith('/admin')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
