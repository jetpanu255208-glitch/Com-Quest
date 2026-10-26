import { NextResponse } from 'next/server';
import { checkSupabaseConnection } from '@/lib/supabase/check-connection';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await checkSupabaseConnection();

    return NextResponse.json(status, {
      status: status.success ? 200 : 503,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: 'Internal server error while checking Supabase connection',
        details: {
          hasKey: false,
          error: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
