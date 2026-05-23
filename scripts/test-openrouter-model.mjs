#!/usr/bin/env node
/**
 * Validate OpenRouter free models for RTM Grant Intake (Application Assistant).
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node scripts/test-openrouter-model.mjs
 *   OPENROUTER_API_KEY=sk-or-... node scripts/test-openrouter-model.mjs --model openai/gpt-oss-120b:free
 */

const API_KEY = process.env.OPENROUTER_API_KEY;
const SINGLE_MODEL = process.argv.includes("--model")
  ? process.argv[process.argv.indexOf("--model") + 1]
  : null;

const CANDIDATE_MODELS = [
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

const GRANT_PROMPT = {
  system: `You are the RTM Application Assistant helping a Canadian SME prepare grant application narratives.
Write clear, factual prose. Do not invent financial figures. Output plain text only (no markdown fences).`,
  user: `Grant: Canada Small Business Financing Program (example)
Business: Maple Tech Solutions Inc., Ontario, 12 employees, software development.
Task: Write a 2-paragraph project summary (max 180 words) for funding to expand export sales.`,
};

async function testModel(model) {
  const started = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://grants.rtmbusinessdirectory.com",
      "X-Title": "RTM Grant Intake Model Validation",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        { role: "system", content: GRANT_PROMPT.system },
        { role: "user", content: GRANT_PROMPT.user },
      ],
    }),
  });

  const latencyMs = Date.now() - started;
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      model,
      ok: false,
      latencyMs,
      error: body?.error?.message || body?.error || res.statusText,
      status: res.status,
    };
  }

  const text = body?.choices?.[0]?.message?.content?.trim() ?? "";
  const wordCount = text ? text.split(/\s+/).length : 0;

  return {
    model,
    ok: Boolean(text && wordCount >= 40),
    latencyMs,
    wordCount,
    preview: text.slice(0, 200) + (text.length > 200 ? "…" : ""),
    usage: body?.usage,
  };
}

async function main() {
  if (!API_KEY) {
    console.error("Missing OPENROUTER_API_KEY. Set it in the environment (never commit keys).");
    process.exit(1);
  }

  const models = SINGLE_MODEL ? [SINGLE_MODEL] : CANDIDATE_MODELS;
  console.log("Testing OpenRouter models for grant narrative draft…\n");

  let validated = null;
  const results = [];

  for (const model of models) {
    process.stdout.write(`→ ${model} … `);
    try {
      const result = await testModel(model);
      results.push(result);
      if (result.ok) {
        console.log(`OK (${result.latencyMs}ms, ${result.wordCount} words)`);
        if (!validated) validated = model;
      } else {
        console.log(`FAIL (${result.error || "short/empty response"})`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERROR (${message})`);
      results.push({ model, ok: false, error: message });
    }
  }

  console.log("\n--- Summary ---");
  for (const r of results) {
    console.log(JSON.stringify(r, null, 0));
  }

  if (validated) {
    console.log(`\n✓ Recommended OPENROUTER_MODEL=${validated}`);
    console.log("Set in Supabase Edge secrets: OPENROUTER_API_KEY, OPENROUTER_MODEL");
    process.exit(0);
  }

  console.error("\n✗ No model passed validation. Check API key credits or try --model <id>.");
  process.exit(1);
}

main();
