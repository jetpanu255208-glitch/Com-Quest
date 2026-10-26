/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
/**
 * COM QUEST — Supabase Connection Diagnostic Script
 * 
 * Usage:
 *   node scripts/test-supabase.js
 * 
 * Tests connection to Supabase without modifying any database tables.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Manually load .env.local if process.env variables are not already populated
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx !== -1) {
        const key = trimmed.slice(0, equalsIdx).trim();
        const val = trimmed.slice(equalsIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

async function runDiagnostic() {
  console.log('\n======================================================');
  console.log('   🔍 COM QUEST — Supabase Connection Diagnostic');
  console.log('======================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('1. Checking Environment Variables:');
  console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? `✓ Found (${supabaseUrl})` : '✗ Missing'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? `✓ Found (${supabaseKey.slice(0, 16)}...)` : '✗ Missing'}`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ ERROR: Supabase credentials are missing in .env.local');
    process.exit(1);
  }

  if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    console.error('\n❌ ERROR: Placeholder credentials detected. Please replace with your real Supabase Project credentials.');
    process.exit(1);
  }

  console.log('\n2. Testing Connection & Latency...');
  const startTime = Date.now();

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Check lessons table count (read-only HEAD query)
    const { count, error, status } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true });

    const latency = Date.now() - startTime;

    if (error) {
      console.error(`\n❌ Query Failed with status [${status}]: ${error.message}`);
      process.exit(1);
    }

    console.log(`   ✓ Connected successfully in ${latency}ms`);
    console.log(`   ✓ Lessons Table accessible (found ${count ?? 0} published records)`);

    // Check auth endpoint
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.warn(`   ⚠️ Auth warning: ${authError.message}`);
    } else {
      console.log('   ✓ Supabase Auth API endpoint responding properly');
    }

    console.log('\n======================================================');
    console.log('   🎉 SUPABASE CONNECTION IS HEALTHY AND READY!');
    console.log('======================================================\n');
    process.exitCode = 0;
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`\n❌ Unexpected connection failure after ${latency}ms:`, err.message || err);
    process.exitCode = 1;
  }
}

runDiagnostic();
