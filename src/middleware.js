import { NextResponse } from 'next/server';
// import { jwtDecode } from 'jwt-decode'; 

function decodeJwtRole(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).role;
  } catch (e) {
    return null;
  }
}

export function middleware(request) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = decodeJwtRole(token);

  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (path.startsWith('/dashboard/officer') && !['PIA_OFFICER'].includes(role)) {
    if (role === 'DD_LEVEL') return NextResponse.redirect(new URL('/dashboard/dd', request.url));
    if (['MND_OFFICER', 'MND_SUPER_ADMIN'].includes(role)) return NextResponse.redirect(new URL('/dashboard/mnd', request.url));
    if (['SUPER_ADMIN'].includes(role)) return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (path.startsWith('/dashboard/dd') && role !== 'DD_LEVEL') {
    if (['PIA_OFFICER'].includes(role)) return NextResponse.redirect(new URL('/dashboard/officer', request.url));
    if (['MND_OFFICER', 'MND_SUPER_ADMIN'].includes(role)) return NextResponse.redirect(new URL('/dashboard/mnd', request.url));
    if (['SUPER_ADMIN'].includes(role)) return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (path.startsWith('/dashboard/admin') && !['SUPER_ADMIN'].includes(role)) {
    if (['PIA_OFFICER'].includes(role)) return NextResponse.redirect(new URL('/dashboard/officer', request.url));
    if (['MND_OFFICER', 'MND_SUPER_ADMIN'].includes(role)) return NextResponse.redirect(new URL('/dashboard/mnd', request.url));
    if (role === 'DD_LEVEL') return NextResponse.redirect(new URL('/dashboard/dd', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (path.startsWith('/dashboard/mnd') && !['MND_OFFICER', 'MND_SUPER_ADMIN'].includes(role)) {
    if (['PIA_OFFICER'].includes(role)) return NextResponse.redirect(new URL('/dashboard/officer', request.url));
    if (role === 'DD_LEVEL') return NextResponse.redirect(new URL('/dashboard/dd', request.url));
    if (['SUPER_ADMIN'].includes(role)) return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
