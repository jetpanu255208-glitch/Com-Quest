import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in route handlers if response headers are handled
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Determine user's role from public.profiles
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      // Ensure profile exists for Google OAuth users if missing in profiles table
      if (!profile) {
        const meta = data.user.user_metadata || {};
        const fullName = meta.full_name || meta.name || '';
        const firstName = meta.first_name || (fullName ? fullName.split(' ')[0] : null);
        const lastName =
          meta.last_name ||
          (fullName && fullName.includes(' ')
            ? fullName.substring(fullName.indexOf(' ') + 1)
            : null);
        const emailPrefix = data.user.email
          ? data.user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
          : 'student';
        const fallbackUsername =
          meta.username || emailPrefix || ('quest_' + data.user.id.replace(/-/g, '').slice(0, 8));

        const { data: created } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            first_name: firstName,
            last_name: lastName,
            username: fallbackUsername,
            role: 'user',
          })
          .select('*')
          .maybeSingle();

        if (created) {
          profile = created;
        }
      }

      if (profile?.role === 'admin') {
        return NextResponse.redirect(`${origin}/teacher`);
      }

      return NextResponse.redirect(`${origin}/profile`);
    }
  }

  // Return the user to an error page or login with error query param
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
