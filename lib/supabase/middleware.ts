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

  // If Supabase credentials are missing or placeholders, pass through to avoid breaking static generation
  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseKey.includes('placeholder')
  ) {
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

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected route 1: Student area (/profile, /character, /settings, /subjects, /quest, /student)
  const isStudentRoute =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/character') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/subjects') ||
    pathname.startsWith('/quest') ||
    pathname.startsWith('/student');

  if (isStudentRoute) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Protected route 2: Teacher area (/teacher, but not /teacher/login)
  if (pathname.startsWith('/teacher') && pathname !== '/teacher/login') {
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

  // Allow direct access to /login, /register, and /teacher/login so users can register new accounts
  // or switch accounts without being forcefully hijacked into another person's session.

  return supabaseResponse;
}
