import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from './types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Fast check: If Supabase credentials are missing or placeholders, pass through immediately
  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseKey.includes('placeholder')
  ) {
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;

  // Protected route 1: Student area
  const isStudentRoute =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/character') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/subjects') ||
    pathname.startsWith('/quest') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/learn') ||
    pathname.startsWith('/quiz') ||
    pathname.startsWith('/mission');

  // Protected route 2: Teacher area
  const isTeacherRoute = pathname.startsWith('/teacher') && pathname !== '/teacher/login';

  // Check for presence of any Supabase auth cookies
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith('sb-'));

  if (!hasAuthCookie) {
    if (isStudentRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (isTeacherRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/teacher/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() to securely validate token and refresh cookies in middleware
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isStudentRoute) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isTeacherRoute) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/teacher/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Server-side role check for admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/profile';
      redirectUrl.searchParams.set('error', 'teacher_access_denied');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
