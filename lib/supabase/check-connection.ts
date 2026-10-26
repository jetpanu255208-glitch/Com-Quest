import { createClient } from '@supabase/supabase-js';

export interface SupabaseConnectionStatus {
  success: boolean;
  code:
    | 'CONNECTED'
    | 'MISSING_ENV'
    | 'INVALID_URL'
    | 'UNAUTHORIZED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
  details: {
    url?: string;
    hasKey: boolean;
    latencyMs?: number;
    error?: string;
  };
}

/**
 * Checks connection to Supabase and returns structured diagnostic status.
 * Safe for both Client and Server execution.
 * Does not expose sensitive secret keys.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 1. Check if environment variables exist and are not placeholders
  if (!url || !key) {
    return {
      success: false,
      code: 'MISSING_ENV',
      message: 'ไม่พบ Environment Variables สำหรับเชื่อมต่อ Supabase (NEXT_PUBLIC_SUPABASE_URL หรือ NEXT_PUBLIC_SUPABASE_ANON_KEY)',
      details: {
        url: url || undefined,
        hasKey: Boolean(key),
      },
    };
  }

  if (url.includes('placeholder') || key.includes('placeholder') || url.includes('your-project')) {
    return {
      success: false,
      code: 'MISSING_ENV',
      message: 'Environment Variables ยังเป็นค่า Placeholder กรุณากำหนดค่าจริงจาก Supabase Dashboard',
      details: {
        url,
        hasKey: true,
      },
    };
  }

  // 2. Validate URL format
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('Protocol must be http or https');
    }
  } catch {
    return {
      success: false,
      code: 'INVALID_URL',
      message: `รูปแบบ Supabase URL ไม่ถูกต้อง (${url})`,
      details: {
        url,
        hasKey: true,
      },
    };
  }

  // 3. Test ping / lightweight query
  const startTime = Date.now();
  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Perform read-only count query to check DB & Auth headers
    // Using head: true so no data payload is fetched
    const { error, status } = await supabase
      .from('lessons')
      .select('count', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      // Analyze error type
      if (status === 401 || status === 403 || error.message.toLowerCase().includes('apikey') || error.message.toLowerCase().includes('jwt')) {
        return {
          success: false,
          code: 'UNAUTHORIZED',
          message: `การยืนยันตัวตนด้วย API Key ไม่ผ่าน (Status ${status}): ${error.message}`,
          details: {
            url,
            hasKey: true,
            latencyMs,
            error: error.message,
          },
        };
      }

      // If error is table-related or permission-related (RLS), the connection to Supabase itself still succeeded!
      if (status >= 200 && status < 300) {
        return {
          success: true,
          code: 'CONNECTED',
          message: `เชื่อมต่อ Supabase สำเร็จ (การตอบสนอง: ${latencyMs}ms)`,
          details: {
            url,
            hasKey: true,
            latencyMs,
          },
        };
      }

      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: `เกิดข้อผิดพลาดในการเรียกฐานข้อมูล Supabase (${status || 'Unknown'}): ${error.message}`,
        details: {
          url,
          hasKey: true,
          latencyMs,
          error: error.message,
        },
      };
    }

    return {
      success: true,
      code: 'CONNECTED',
      message: `เชื่อมต่อ Supabase สำเร็จเรียบร้อย (การตอบสนอง: ${latencyMs}ms)`,
      details: {
        url,
        hasKey: true,
        latencyMs,
      },
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Network / DNS error
    if (
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('fetch failed')
    ) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: `ไม่สามารถเชื่อมต่อไปยัง Host ของ Supabase ได้ (${url}) ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือ URL`,
        details: {
          url,
          hasKey: true,
          latencyMs,
          error: errorMsg,
        },
      };
    }

    return {
      success: false,
      code: 'UNKNOWN_ERROR',
      message: `เกิดข้อผิดพลาดที่ไม่คาดคิด: ${errorMsg}`,
      details: {
        url,
        hasKey: true,
        latencyMs,
        error: errorMsg,
      },
    };
  }
}
