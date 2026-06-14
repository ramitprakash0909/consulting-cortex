# Ramit's Consulting Cortex — ROADMAP

> The plan to take Cortex from a **static, interactive knowledge base (Levels 1-3)** to a
> **dynamic, AI-powered app (Level 4)** using **Supabase** (backend) + **Gemini** (in-app AI).
> Build order is ranked by *increasing complexity / decreasing certainty* — take the next
> unshipped item.

---

## Vision

A live consulting "brain" you (and eventually others) can chat with — grounded in 26 curated
industry primers — that also saves your work and keeps its perishable facts fresh.

- **Today:** 26 primers as static JSON → vanilla-JS front-end (browse, filter, calculate). AI is in
  the *authoring* (`/build-primer`), not the running app.
- **Target:** same front-end, plus a **Supabase backend** for writes/data and **Gemini via Edge
  Functions** for live, grounded answers — without throwing away anything we've built.

---

## Architecture: current → target

```
CURRENT
  Browser (static vanilla JS)  ──fetch──>  /primers/*.json  (+ data.js offline fallback)

TARGET
  Browser (static, on GitHub Pages)
     ├── fetch ──────────────>  /primers/*.json        (evergreen content stays as files)
     ├── supabase-js ────────>  Supabase DB            (cases, user data)  [RLS]
     └── functions.invoke ───>  Supabase Edge Function ──> Gemini API   (key secret, server-side)
                                              └────────> reads primer JSON as grounding (RAG-lite)
```

**Key principle:** the **Gemini API key NEVER lives in the browser** — it sits as a secret in the
Supabase Edge Function, which the front-end calls. The Supabase **anon key + project URL** are
public (safe; Row Level Security protects data). The **service-role key never goes in the front-end
or in chat.**

**Why this shape:** keeps the front-end free/static (GitHub Pages), adds only the backend pieces we
actually need, and reuses all 26 primers as-is. (A full Next.js + Vercel rebuild — your friend's
stack — is an *optional* later upgrade, not required.)

> Provider note: Gemini chosen for its free tier. The Edge Function is provider-agnostic — swapping
> to Claude/OpenAI later is a one-function change.

---

## Phase 0 — Foundations (do first; low complexity, high value)

**Goal:** version control + a real URL + a backend project to build on.

- [ ] `git init` the project; `.gitignore` (node_modules, `.env*`, local junk); first commit; push to a
      new GitHub repo. *(Closes our biggest gap vs the playbook.)*
- [ ] Enable **GitHub Pages** on `/web` (or `/docs`) → real URL; generate a QR for phone access. *(Task #3)*
- [ ] Create a **Supabase project** (free tier). Record `SUPABASE_URL` + `anon key`.
- [ ] Add `.env.local.example` (placeholders) + a `web/config.js` that reads public Supabase config.
      Secrets (Gemini key, service-role) go in Supabase, **never** in the repo or chat.
- **Done when:** repo is on GitHub, the app loads at a public URL, and an empty Supabase project exists.

---

## Phase 1 — Supabase data layer + Cases archive (first real "write")

**Goal:** the app can persist user work — the thing static files can't do from the browser.

- [ ] Schema (run in Supabase SQL editor — admin op, not via AI session):
  ```sql
  create table cases (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    user_id uuid,                       -- null until Auth (Phase 5)
    type text,                          -- 'evaluation' | 'comparison' | 'question'
    title text,
    industry_slug text,
    question text,
    content jsonb,                      -- the saved analysis
    score numeric
  );
  alter table cases enable row level security;
  -- start permissive (single user); tighten in Phase 5
  ```
- [ ] Add `supabase-js` (CDN) to the front-end; a small `db.js` wrapper.
- [ ] Wire the **Cases section**: save an analysis/comparison → `cases`; list & reopen them.
- **Decision:** keep primers as **static JSON** (recommended — evergreen, free, version-controlled).
  Only migrate primers into a `primers` table if we later want live in-browser editing.
- **Done when:** you can save a result and see it back in Cases after a refresh.

---

## Phase 2 — Level 4: "Ask the Consultant" (Gemini, grounded) — the headline feature

**Goal:** type any business question → a freshly-reasoned, house-style answer **grounded in our primers**.

- [ ] Edge Function `ask-consultant` (Deno/TypeScript):
  - Input: `{ question, industrySlug?, mode? }`
  - Loads the relevant **primer JSON** (by slug, or infer from the question) + the **scoring rubric**
    as grounding context (RAG-lite — with only 26 primers we don't need a vector DB yet).
  - Calls **Gemini** (`GEMINI_API_KEY` as a function secret) with a system prompt = the
    management-consultant house style + "answer only from/grounded in the provided primer; flag
    perishable figures."
  - Returns `{ answer, usedPrimers, disclaimer }`.
- [ ] Front-end: turn the greyed **"Ask the Consultant"** box into a live input → `functions.invoke('ask-consultant')`
      → render the answer → offer **"Save to Cases."**
- [ ] Guardrails: simple rate limit, a monthly cost cap, graceful errors, and a visible
      "directional — verify perishable data" note.
- **Done when:** "Compare Airtel vs Jio" typed *in the app* returns a grounded answer, savable to Cases.

---

## Phase 3 — Generative augmentation across the app

**Goal:** make the existing primers themselves interactive with AI.

- [ ] **"Explain / go deeper"** buttons on primer sections → Gemini elaboration grounded in that section.
- [ ] **Compare section + AI synthesis** ("which would you back, and why?") on top of the side-by-side.
- [ ] **On-demand company analysis** (Airtel-vs-Jio style) generated from the relevant primer.
- **Done when:** users can drill deeper on any section/comparison without leaving the app.

---

## Phase 4 — Living data (automation) — keeps perishable facts fresh

**Goal:** stop the perishable fields (`currentState`, `benchmarks`, `indiaLandscape`, `aiPenetration`) from rotting.

- [ ] Edge Function `refresh-primer`: uses Gemini (+ web data if available) to propose updated
      perishable fields for a primer and re-stamp `asOf`.
- [ ] **Review gate** — write proposals to a `refresh_log` table for approval; never auto-publish
      unverified market figures.
- [ ] Schedule it (Supabase scheduled functions / `pg_cron`, or a GitHub Actions cron) — e.g. a few
      primers per week.
- **Done when:** primers show a recent `asOf` and a "suggested update" review flow exists.

---

## Phase 5 — Multi-user & sharing (optional)

**Goal:** more than one user; shareable.

- [ ] Supabase **Auth** (Google login) → `user_id` on `cases`; tighten **RLS** so users see only their own.
- [ ] Public **share links** for a primer/analysis.
- **Done when:** two people can log in with separate, private Cases.

---

## Phase 6 — Productionization (optional polish)

- [ ] Product-grade README (tagline, shields.io badges, tech-stack table, getting-started).
- [ ] Security pass: RLS audit, secrets only in env, rate/cost caps confirmed.
- [ ] *Only if it outgrows static:* consider migrating the front-end to **Next.js + Vercel** (your
      friend's stack) for SSR/SEO/integrated cron.

---

## Build order (just take the next box)
**Phase 0 → 1 → 2** are the core path to "actually dynamic." 3-6 are enhancements.
`git + hosting` → `Supabase + Cases` → `Gemini Ask (L4)` → `generative augmentation` → `living data` → `auth/sharing` → `polish`.

## Cost
Supabase **free tier** (Postgres, edge functions, auth) + Gemini **free tier** ≈ effectively free for
personal use. Add a cost cap on the Edge Function before sharing widely.

## Security (non-negotiable, from the playbook §9)
- Gemini key + service-role key: **Supabase secrets / env only** — never in repo, never in chat.
- Anon key + URL in the front-end is fine (public by design); rely on **Row Level Security**.
- Run DB migrations in the Supabase SQL editor, not through an AI session.

## Open decisions (confirm before/during Phase 1-2)
1. Primers stay as files (recommended) or migrate to a DB table?
2. Front-end stays vanilla/static (recommended) or rebuild in Next.js?
3. Single-user now (skip Auth till Phase 5) or build multi-user from the start?

## Shipped markers (update inline as we go)
- _Nothing dynamic shipped yet — Phases 0+ pending. (Static Levels 1-3 + 26 primers + `/build-primer` agent already done.)_
