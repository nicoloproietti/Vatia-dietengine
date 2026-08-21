/// <reference lib="deno.ns" />
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Daily cap: keeps the free Groq/Gemini tier well below any billing risk.
const DAILY_LIMIT = 10;

interface RequestBody {
  food_id: string;
}

interface Suggestion {
  name: string;
  reason?: string;
  food_id?: string;
  source: 'llm' | 'cache' | 'fallback';
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  if (!body.food_id) return json({ error: 'food_id_required' }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // 1. Resolve the food.
  const { data: foodRow, error: foodErr } = await supabase
    .from('foods')
    .select('id,name,macro_category,category,kcal,protein,carbs,fat')
    .eq('id', body.food_id)
    .maybeSingle();
  if (foodErr || !foodRow) return json({ error: 'food_not_found' }, 404);

  const cacheKey = `sub:${foodRow.id}`;

  // 2. Cache lookup.
  const { data: cached } = await supabase
    .from('ai_substitution_cache')
    .select('result')
    .eq('cache_key', cacheKey)
    .maybeSingle();
  if (cached?.result) {
    return json({ suggestion: { ...cached.result, source: 'cache' } });
  }

  // 3. Rate limit check.
  const today = new Date().toISOString().slice(0, 10);
  const { data: rate } = await supabase.rpc('ai_rate_limit_bump', {
    p_day: today,
    p_limit: DAILY_LIMIT,
  });
  const allowed = Array.isArray(rate) ? rate[0]?.allowed : false;

  // 4. Ask LLM if allowed and configured; otherwise fall back to SQL similarity.
  let suggestion: Suggestion | null = null;
  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (allowed && groqKey) {
    try {
      suggestion = await askGroq(groqKey, foodRow);
    } catch (_e) {
      suggestion = null;
    }
  }
  if (!suggestion) {
    suggestion = await sqlFallback(supabase, foodRow);
  }
  if (!suggestion) {
    return json({ error: 'no_suggestion' }, 500);
  }

  // 5. Cache the LLM result (never cache fallbacks — data may improve later).
  if (suggestion.source === 'llm') {
    await supabase.from('ai_substitution_cache').insert({
      cache_key: cacheKey,
      result: { name: suggestion.name, reason: suggestion.reason, food_id: suggestion.food_id },
    });
  }

  return json({ suggestion });
});

async function askGroq(
  apiKey: string,
  food: { name: string; macro_category: string | null; kcal: number | null;
          protein: number | null; carbs: number | null; fat: number | null },
): Promise<Suggestion> {
  const prompt =
    `Suggerisci un alimento italiano simile a "${food.name}" ` +
    `(macro-categoria: ${food.macro_category ?? 'sconosciuta'}; ` +
    `per 100g: ${food.kcal ?? '?'} kcal, ` +
    `P ${food.protein ?? '?'} / C ${food.carbs ?? '?'} / F ${food.fat ?? '?'}). ` +
    `Rispondi con un JSON del tipo {"name": "...", "reason": "una frase in italiano"}.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Rispondi solo in JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 200,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const parsed = JSON.parse(content) as { name?: string; reason?: string };
  if (!parsed.name) throw new Error('llm_bad_shape');
  return { name: parsed.name, reason: parsed.reason, source: 'llm' };
}

// SQL fallback: pick the closest food by squared macro distance in the
// same macro_category (excluding the input row). Cheap, deterministic,
// no external call.
async function sqlFallback(
  supabase: ReturnType<typeof createClient>,
  food: { id: string; name: string; macro_category: string | null;
          protein: number | null; carbs: number | null; fat: number | null },
): Promise<Suggestion | null> {
  if (!food.macro_category) return null;
  const { data } = await supabase
    .from('foods')
    .select('id,name,protein,carbs,fat')
    .eq('macro_category', food.macro_category)
    .eq('usable_for_meal_generator', true)
    .neq('id', food.id)
    .limit(200);

  const rows = (data ?? []) as Array<{
    id: string; name: string; protein: number | null; carbs: number | null; fat: number | null;
  }>;
  if (!rows.length) return null;

  const dp = food.protein ?? 0, dc = food.carbs ?? 0, df = food.fat ?? 0;
  let best = rows[0];
  let bestDist = Infinity;
  for (const r of rows) {
    const d =
      Math.pow((r.protein ?? 0) - dp, 2) +
      Math.pow((r.carbs ?? 0) - dc, 2) +
      Math.pow((r.fat ?? 0) - df, 2);
    if (d < bestDist) { bestDist = d; best = r; }
  }
  return {
    name: best!.name,
    reason: 'Macronutrienti simili (fallback SQL, senza AI).',
    food_id: best!.id,
    source: 'fallback',
  };
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
