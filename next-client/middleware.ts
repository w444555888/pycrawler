import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要认证的路由
const protectedRoutes = ['/hotels', '/flights', '/orders', '/personal', '/dashboard'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 从 cookie 获取 token（假设服务器设置了）
  const token = request.cookies.get('token')?.value;
  
  // 如果是认证路由，且已登录，重定向到首页
  if (authRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 如果是受保护路由，且未登录，重定向到登录
  if (protectedRoutes.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
