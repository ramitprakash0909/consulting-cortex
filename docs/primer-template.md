# Industry Primer Template (the contract) — v1.0

Every industry primer is one JSON file in `primers/<slug>.json` following **exactly** this shape.
This is the handshake between the agents (which write it) and the web app (which reads it).
Reference implementation: `primers/telecom.json`.

**Design principle:** a primer = the skill's *universal decoder*, pre-answered and deepened for one
industry, in the same structure the agent already thinks in. Mostly **evergreen**; the few perishable
fields are fenced off and flagged.

---

## The 18 sections

| # | Key | Layer | What it holds |
|---|-----|-------|---------------|
| 0 | `meta` | meta | schemaVersion, slug, industry, sector, subSegments, lastUpdated, perishableFields |
| 1 | `essence` | answer-first | 3-5 must-knows — the 60-second version |
| 2 | `definition` | evergreen | oneLiner + jobToBeDone (Q1: what value, for whom) |
| 3 | `valueChain` | evergreen | stages, profitPools, powerShift (Q2 + follow the money) |
| 4 | `businessModels` | evergreen | primaryArchetypes + variants (which of the 7 apply) |
| 5 | `unitEconomics` | evergreen | unitOfRevenue, revenueDrivers, keyKPIs (Q3) |
| 6 | `costStructure` | evergreen | shape, majorPools, leverage (Q4) |
| 7 | `competitionAndMoats` | evergreen | basisOfCompetition, moats, concentration (Q5) |
| 8 | `structuralForces` | evergreen | regulation, cyclicality, substitution, supplier/buyer power |
| 9 | `aiPenetration` | PERISHABLE | maturity, keyUseCases, valueChainImpact, opportunities, threats |
| 10 | `benchmarks` | PERISHABLE | directional KPI ranges ("what good looks like") |
| 11 | `valueLevers` | evergreen | the handful of ways value is created here |
| 12 | `keyTerms` | evergreen | mini-glossary: term -> plain-English definition |
| 13 | `commonCaseTypes` | evergreen | recurring client problems in this industry |
| 14 | `firstLookDiagnostics` | evergreen | questionsToAskFirst, metricsToPullFirst, rookieTraps |
| 15 | `whatsUniqueHere` | evergreen | the one-paragraph "what makes this industry special" tail |
| 16 | `indiaLandscape` | PERISHABLE | India structure, players, regulators, policy, demand drivers, challenges |
| 17 | `crossIndustryLinks` | evergreen | similarTo, relatedPrimers (slugs), relevantFrameworks |
| 18 | `currentState` | PERISHABLE | asOf-stamped snapshot: latest market structure & trends |

`meta.perishableFields` must list the perishable keys so the app can badge them "refresh me":
`["aiPenetration", "benchmarks", "indiaLandscape", "currentState"]`

---

## Conventions

- **Format:** JSON. `{ }` = labelled group, `[ ]` = list.
- **Slugs:** kebab-case, match the filename (`telecom` -> `telecom.json`); used for cross-links.
- **Altitude:** keep fields as flat string lists for v1 (fast to author). Upgrade specific fields to
  richer objects later — `schemaVersion` makes that migration safe.
- **Evergreen vs perishable:** keep the structural "operating system" of the industry separate from
  numbers that age. Perishable fields get a `note` flag and are listed in `meta.perishableFields`.
- **Geography:** the evergreen core stays global; India specifics live in `indiaLandscape` and
  `currentState`.

---

## Adding a new industry

1. Copy `telecom.json` to `primers/<slug>.json`.
2. Refill all 18 sections for the new industry (don't leave telecom content behind).
3. Flip the industry's `status` to `filled` in `primers/_index.json`.
4. The web app picks it up automatically.
