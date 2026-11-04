import { NextResponse, type NextRequest } from 'next/server';

/** Primer filtro: sin cookie de sesión no se entra al panel. La verificación real (firma, usuario, permisos) está en `lib/auth.ts`. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();
  if (!req.cookies.has('mcs_admin')) return NextResponse.redirect(new URL('/admin/login', req.url));
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = { matcher: '/admin/:path*' };
