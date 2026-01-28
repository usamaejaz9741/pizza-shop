import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const adminSession = request.cookies.get('admin_session');
        if (!adminSession && request.nextUrl.pathname !== '/admin/login') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};