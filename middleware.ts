import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export default function middleware(req: NextRequest) {
  const { userId } = getAuth(req);
  const publicPaths = ['/', '/api/health-advisor', '/patient/facility-finder'];

  // If the path is public or the user is authenticated, continue
  const path = req.nextUrl.pathname;
  if (publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))) {
    return NextResponse.next();
  }

  // If the user is not authenticated and the path is not public, redirect to sign-in
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
