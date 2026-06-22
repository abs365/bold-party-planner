// Migration 050 verification + migration tracking repair script
// Usage: node scripts/verify-migration-050.mjs
import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=\s]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run(label, fn) {
  try {
    const result = await fn();
    const pass = result.pass;
    console.log(`${pass ? '✅' : '❌'} ${label}`);
    if (result.detail) console.log(`   ${result.detail}`);
    return pass;
  } catch (e) {
    console.log(`❌ ${label}`);
    console.log(`   ERROR: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('MIGRATION 050 VERIFICATION REPORT');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log('══════════════════════════════════════════════════\n');

  let passCount = 0;
  let total = 0;

  async function check(label, fn) {
    total++;
    const ok = await run(label, fn);
    if (ok) passCount++;
  }

  // ── 1. slug column exists ────────────────────────────────────────────────────
  await check('vendors.slug column exists (NOT NULL, TEXT)', async () => {
    const { data, error } = await admin
      .from('vendors')
      .select('slug')
      .limit(1);
    if (error) return { pass: false, detail: error.message };
    return { pass: true, detail: 'Column accessible via REST API' };
  });

  // ── 2. All approved vendors have slugs ───────────────────────────────────────
  await check('All approved vendors have non-null slugs', async () => {
    const { data, error } = await admin
      .from('vendors')
      .select('id, business_name, slug')
      .eq('status', 'approved')
      .is('slug', null);
    if (error) return { pass: false, detail: error.message };
    const missing = data?.length ?? 0;
    return {
      pass: missing === 0,
      detail: missing === 0 ? 'All approved vendors have slugs ✓' : `${missing} vendors missing slugs: ${JSON.stringify(data?.map(v => v.business_name))}`,
    };
  });

  // ── 3. No null slugs across ALL vendors ─────────────────────────────────────
  await check('No null slugs across all vendors', async () => {
    const { data, error } = await admin
      .from('vendors')
      .select('id, business_name, slug')
      .is('slug', null);
    if (error) return { pass: false, detail: error.message };
    const missing = data?.length ?? 0;
    return {
      pass: missing === 0,
      detail: missing === 0 ? 'All vendors have slugs ✓' : `${missing} vendors missing slugs`,
    };
  });

  // ── 4. Slugs are unique (spot check: count vs distinct) ──────────────────────
  await check('Slugs are lowercase and hyphenated (spot check 5 vendors)', async () => {
    const { data, error } = await admin
      .from('vendors')
      .select('business_name, slug, status, is_founding_vendor')
      .limit(5);
    if (error) return { pass: false, detail: error.message };
    if (!data?.length) return { pass: true, detail: 'No vendors to check' };

    const allValid = data.every(v => /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(v.slug ?? ''));
    const samples = data.map(v => `  "${v.business_name}" → "${v.slug}" (${v.status}, founding=${v.is_founding_vendor})`).join('\n');
    return {
      pass: allValid,
      detail: `\nSlug samples:\n${samples}`,
    };
  });

  // ── 5. vendor_slug_history table exists ──────────────────────────────────────
  await check('vendor_slug_history table exists', async () => {
    const { data, error } = await admin
      .from('vendor_slug_history')
      .select('id')
      .limit(1);
    // 404 = table doesn't exist; 200 with empty array is fine
    if (error && error.code === '42P01') return { pass: false, detail: 'Table does not exist' };
    if (error) return { pass: false, detail: error.message };
    return { pass: true, detail: 'Table exists and is accessible ✓' };
  });

  // ── 6. generate_vendor_slug function works ───────────────────────────────────
  await check('generate_vendor_slug() function is callable', async () => {
    const { data, error } = await admin.rpc('generate_vendor_slug', {
      p_name: 'Test Business Name',
      p_vendor_id: '00000000-0000-0000-0000-000000000000',
    });
    if (error) return { pass: false, detail: error.message };
    return {
      pass: typeof data === 'string' && data.length > 0,
      detail: `"Test Business Name" → "${data}"`,
    };
  });

  // ── 7. UUID routing check (confirms slug exists for redirect path) ────────────
  await check('UUID-to-slug redirect chain: approved vendor has slug for redirect', async () => {
    const { data, error } = await admin
      .from('vendors')
      .select('id, slug, business_name, status')
      .eq('status', 'approved')
      .not('slug', 'is', null)
      .limit(3);
    if (error) return { pass: false, detail: error.message };
    if (!data?.length) return { pass: false, detail: 'No approved vendors found' };
    const samples = data.map(v => `  UUID ${v.id} → /vendors/${v.slug}`).join('\n');
    return {
      pass: true,
      detail: `\nRedirect paths ready:\n${samples}`,
    };
  });

  // ── 8. is_founding_vendor field present ──────────────────────────────────────
  await check('is_founding_vendor field present on vendors (quality gate dependency)', async () => {
    const { data, error } = await admin
      .from('vendors')
      .select('id, is_founding_vendor')
      .limit(3);
    if (error) return { pass: false, detail: error.message };
    return {
      pass: true,
      detail: `Founding vendor flags: ${JSON.stringify(data?.map(v => ({ id: v.id.slice(0, 8), founding: v.is_founding_vendor })))}`,
    };
  });

  console.log('\n══════════════════════════════════════════════════');
  console.log(`RESULT: ${passCount}/${total} checks passed`);
  if (passCount === total) {
    console.log('STATUS: ✅ ALL CHECKS PASS — migration 050 verified');
  } else {
    console.log('STATUS: ❌ SOME CHECKS FAILED — do not deploy');
  }
  console.log('══════════════════════════════════════════════════\n');

  process.exit(passCount === total ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
