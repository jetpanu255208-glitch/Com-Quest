import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { Database, DEFAULT_CHARACTER_CONFIG } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = requestUrl.searchParams.get('next');
  const oauthError =
    requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
  const origin = requestUrl.origin;

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const cookiesToForward: {
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }[] = [];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToForward.push({ name, value, options });
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore in route handlers if response headers are handled
            }
          });
        },
      },
    });

    const redirectWithCookies = (targetUrl: string) => {
      const response = NextResponse.redirect(targetUrl);
      cookiesToForward.forEach(({ name, value, options }) => {
        response.cookies.set(
          name,
          value,
          options as Parameters<typeof response.cookies.set>[2]
        );
      });
      return response;
    };

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    if (data?.user) {
      const meta = data.user.user_metadata || {};
      const fullName = String(meta.full_name || meta.name || '').trim();
      const extractedFirstName =
        meta.given_name ||
        meta.first_name ||
        (fullName ? fullName.split(/\s+/)[0] : null);
      const extractedLastName =
        meta.family_name ||
        meta.last_name ||
        (fullName && fullName.split(/\s+/).length > 1
          ? fullName.split(/\s+/).slice(1).join(' ')
          : null);

      const emailLocal = (data.user.email || '').split('@')[0] || '';
      const emailStudentIdMatch = emailLocal.match(/(?:^|\D)(\d{11})(?:\D|$)/);
      const rawMetaStudentId = meta.student_id ? String(meta.student_id).trim() : null;
      const extractedStudentId =
        rawMetaStudentId && /^\d{11}$/.test(rawMetaStudentId)
          ? rawMetaStudentId
          : emailStudentIdMatch
          ? emailStudentIdMatch[1]
          : null;

      // Determine user's role from public.profiles
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      // Ensure profile exists for Google OAuth users if missing in profiles table
      if (!profile) {
        const emailPrefix = data.user.email
          ? data.user.email
              .split('@')[0]
              .replace(/[^a-zA-Z0-9_]/g, '_')
              .slice(0, 20)
          : 'student';
        const shortId = data.user.id.replace(/-/g, '').slice(0, 5);
        const baseUsername =
          meta.username || extractedFirstName || emailPrefix || `quest_${shortId}`;

        // Try inserting with baseUsername first; if username is already taken, fallback to unique username
        let { data: created, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            first_name: extractedFirstName,
            last_name: extractedLastName,
            student_id: extractedStudentId,
            username: baseUsername,
            role: 'user',
            character_config: DEFAULT_CHARACTER_CONFIG,
          })
          .select('*')
          .maybeSingle();

        if (insertErr) {
          const uniqueUsername = `${baseUsername}_${shortId}`;
          const retry = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              first_name: extractedFirstName,
              last_name: extractedLastName,
              student_id: extractedStudentId,
              username: uniqueUsername,
              role: 'user',
              character_config: DEFAULT_CHARACTER_CONFIG,
            })
            .select('*')
            .maybeSingle();
          created = retry.data;
        }

        if (created) {
          profile = created;
        }
      } else {
        // Profile row already created by DB trigger: auto-fill missing student_id (11 digits from email) and first/last name from Google
        const needsStudentId = !profile.student_id && Boolean(extractedStudentId);
        const needsFirstName = !profile.first_name && Boolean(extractedFirstName);
        const needsLastName = !profile.last_name && Boolean(extractedLastName);

        if (needsStudentId || needsFirstName || needsLastName) {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({
              student_id: profile.student_id || extractedStudentId,
              first_name: profile.first_name || extractedFirstName,
              last_name: profile.last_name || extractedLastName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id)
            .select('*')
            .maybeSingle();

          if (updatedProfile) {
            profile = updatedProfile;
          }
        }
      }

      if (profile?.role === 'admin') {
        return redirectWithCookies(`${origin}/teacher`);
      }

      if (nextPath && nextPath.startsWith('/')) {
        return redirectWithCookies(`${origin}${nextPath}`);
      }

      return redirectWithCookies(`${origin}/profile`);
    }
  }

  // If no ?code= and no ?error= in query params, Supabase may have returned #access_token or #error_description in URL hash
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>กำลังยืนยันตัวตน...</title>
</head>
<body style="background:#060913;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <script>
    (function() {
      var hash = window.location.hash ? window.location.hash.substring(1) : '';
      if (hash) {
        var params = new URLSearchParams(hash);
        var err = params.get('error_description') || params.get('error');
        if (err) {
          window.location.replace('/login?error=' + encodeURIComponent(err));
          return;
        }
        if (params.get('access_token')) {
          window.location.replace('/login' + window.location.hash);
          return;
        }
      }
      window.location.replace('/login?error=oauth_failed');
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
