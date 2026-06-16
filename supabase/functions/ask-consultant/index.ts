// "Ask the Consultant" — grounded Q&A over Consulting Cortex industry primers.
//
// Design (locked 2026-06-16):
//   - Grounding source = FETCH FROM PAGES: the chosen primer JSON is fetched live from the
//     published GitHub Pages site at answer-time (single source of truth, no redeploy on edits).
//   - UX = PICK INDUSTRY FIRST: the caller sends { question, industry } where industry is a primer slug.
//
// The Gemini key is a SERVER-SIDE secret (GEMINI_API_KEY) — never sent to the browser.
// Deploy via the Supabase dashboard (Edge Functions). Set "Verify JWT" = OFF for this public endpoint.

const PAGES_BASE = "https://ramitprakash0909.github.io/consulting-cortex/primers";
const MODEL = "gemini-2.5-flash"; // free-tier model; if quota/availability issues, try gemini-flash-latest or gemini-2.0-flash
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  try {
    const { question, industry } = await req.json();
    if (!question || !industry) {
      return json({ error: "Provide both 'question' and 'industry' (a primer slug)." }, 400);
    }

    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return json({ error: "Server is missing the GEMINI_API_KEY secret." }, 500);

    // 1) GROUND — fetch the chosen primer JSON live from Pages
    const primerRes = await fetch(`${PAGES_BASE}/${encodeURIComponent(industry)}.json`);
    if (!primerRes.ok) {
      return json({ error: `Couldn't load the primer for '${industry}'. Check the slug.` }, 404);
    }
    const primer = await primerRes.json();

    // 2) BUILD the grounded, house-style prompt
    const prompt = buildPrompt(question, industry, primer);

    // 3) CALL Gemini
    const gemRes = await fetch(GEMINI_URL(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!gemRes.ok) {
      const detail = await gemRes.text();
      return json({ error: "Gemini call failed.", detail }, 502);
    }
    const data = await gemRes.json();
    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "(The model returned no text.)";

    return json({
      answer,
      usedPrimers: [industry],
      disclaimer:
        "Directional guidance grounded in the Cortex primer. Verify perishable data (benchmarks, current-state figures) independently.",
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function buildPrompt(question: string, industry: string, primer: unknown): string {
  return [
    "You are an MBB-grade management consultant. Answer in a crisp, structured house style:",
    "lead with the answer, then 2-4 supporting points, each tied to evidence from the primer.",
    "Ground your answer ONLY in the industry primer JSON below. If the primer doesn't cover the",
    "question, say so in one line, then give your best general consulting view clearly flagged as",
    "outside the primer. Be concise and decision-oriented. Quantify using the primer's own numbers",
    "where relevant.",
    `\nINDUSTRY: ${industry}`,
    `\nPRIMER (your only grounding):\n${JSON.stringify(primer).slice(0, 28000)}`,
    `\nUSER QUESTION:\n${question}`,
  ].join("\n");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
