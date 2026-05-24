#!/usr/bin/env node
/**
 * Smoke-test grant-intake-assistant error mapping (no auth — expects 401/502, not 503).
 *
 * Usage:
 *   node scripts/test-grant-intake-assistant-errors.mjs
 */

const BASE =
  process.env.SUPABASE_FUNCTIONS_URL ||
  "https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/grant-intake-assistant";

async function post(body) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  const cases = [
    {
      name: "missing action (no auth)",
      body: {},
      expectStatus: 401,
    },
    {
      name: "generate_draft without auth",
      body: { action: "generate_draft", intake_id: "00000000-0000-0000-0000-000000000000", field_key: "project_summary" },
      expectStatus: [401, 502],
    },
  ];

  let failed = 0;
  for (const c of cases) {
    const { status, json } = await post(c.body);
    const expected = Array.isArray(c.expectStatus) ? c.expectStatus : [c.expectStatus];
    const ok = expected.includes(status);
    const tag = ok ? "OK" : "FAIL";
    console.log(`${tag} ${c.name}: HTTP ${status}`, json?.code ? `code=${json.code}` : "", json?.error ?? "");
    if (!ok) failed++;
    if (status === 503) {
      console.error("  Unexpected 503 — gateway timeout or undeployed function");
      failed++;
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
