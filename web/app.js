/* ===== Ramit's Consulting Cortex — Industry Explorer =====
 * Reads JSON from the "warehouse" (../primers) and displays it (the "showroom").
 *   L1 = show / hide / filter   |   L2 = calculate   |   L3 = load saved files
 */

const PRIMERS = "../primers/";
let indexData = null;

/* Load JSON over the network (L3); if that fails (e.g. opened as a file://
   page where fetch is blocked), fall back to the embedded copy in data.js. */
async function loadJson(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) {
    if (fallback !== undefined && fallback !== null) return fallback;
    throw e;
  }
}

/* ---- start up: L3 load the taxonomy, then build the sidebar ---- */
async function init() {
  try {
    indexData = await loadJson(PRIMERS + "_index.json", window.CORTEX_INDEX); // L3 (+ offline fallback)
    renderSidebar(indexData);
  } catch (e) {
    document.getElementById("industryList").innerHTML =
      `<div class="error">Couldn't load industries.</div>`;
  }
  document.getElementById("filter").addEventListener("input", onFilter);       // L1
  document.getElementById("themeToggle").addEventListener("click", toggleTheme); // L1
}

/* ---- build the left list, grouped by sector ---- */
function renderSidebar(data) {
  const wrap = document.getElementById("industryList");
  wrap.innerHTML = "";
  data.sectors.forEach((sec) => {
    const group = document.createElement("div");
    group.className = "sector-group";
    group.innerHTML = `<div class="sector-name">${sec.sector}</div>`;
    sec.industries.forEach((ind) => {
      const item = document.createElement("button");
      item.className = "industry-item" + (ind.status === "filled" ? "" : " pending");
      item.dataset.name = ind.name.toLowerCase();
      item.innerHTML =
        `<span>${ind.name}</span>` +
        (ind.status === "filled" ? `<span class="dot ok"></span>` : `<span class="soon">soon</span>`);
      item.addEventListener("click", () => {
        setActive(item);
        selectIndustry(ind);
      });
      group.appendChild(item);
    });
    wrap.appendChild(group);
  });
}

/* ---- L1: filter the list as you type ---- */
function onFilter(e) {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll(".industry-item").forEach((it) => {
    it.style.display = it.dataset.name.includes(q) ? "" : "none";
  });
}

function setActive(item) {
  document.querySelectorAll(".industry-item").forEach((i) => i.classList.remove("active"));
  item.classList.add("active");
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

/* ---- selecting an industry: L3 load its primer file ---- */
async function selectIndustry(ind) {
  setActiveTab("explorer"); // clicking an industry returns to the Explorer view
  const content = document.getElementById("content");
  if (ind.status !== "filled") {
    content.innerHTML = `<div class="placeholder">📋 The <b>${ind.name}</b> primer is coming soon.</div>`;
    return;
  }
  content.innerHTML = `<div class="placeholder">Loading ${ind.name}…</div>`;
  try {
    const primer = await loadJson(PRIMERS + ind.slug + ".json", (window.CORTEX_PRIMERS || {})[ind.slug]); // L3 (+ fallback)
    renderPrimer(primer);
  } catch (e) {
    content.innerHTML = `<div class="error">Couldn't load ${ind.slug}.json</div>`;
  }
}

/* ---- small helpers that turn data into HTML ---- */
const ul = (arr) => `<ul>${arr.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const chips = (arr) => `<div class="chips">${arr.map((x) => `<span class="chip">${x}</span>`).join("")}</div>`;
const para = (t) => `<p>${t}</p>`;
const prettify = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const kv = (obj) =>
  `<dl class="kv">${Object.entries(obj).map(([k, v]) => `<dt>${prettify(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
const glossary = (obj) =>
  `<dl class="kv">${Object.entries(obj).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;

function card(title, body, opts = {}) {
  return `<div class="card ${opts.cls || ""} ${opts.open ? "open" : ""}">
    <button class="card-head">${title}<span class="chev">▾</span></button>
    <div class="card-body">${body}</div></div>`;
}

/* ---- Tier 1 visual: turn the value-chain stages into a flowchart ---- */
function flow(stages) {
  return (
    `<div class="flow">` +
    stages
      .map((s, i) => {
        const arrow = i < stages.length - 1 ? `<div class="flow-arrow">→</div>` : "";
        return `<div class="flow-step">${s}</div>${arrow}`;
      })
      .join("") +
    `</div>`
  );
}
function powerShiftHtml(t) {
  return `<div class="note powershift">↗ <b>Power shift:</b> ${t.replace(/->/g, "→")}</div>`;
}

/* ---- Tier 1 visual: competitive forces canvas (Porter-style) ---- */
function forcesHtml(p) {
  const c = p.competitionAndMoats, s = p.structuralForces;
  const box = (area, title, body) =>
    `<div class="force ${area}"><div class="force-t">${title}</div><div class="force-b">${body}</div></div>`;
  return `<div class="forces">
    ${box("entrants", "🚪 New Entrants", "Barriers: " + c.moats.join("; "))}
    ${box("supplier", "🏭 Supplier / Buyer Power", s.supplierBuyerPower)}
    ${box("rivalry", "⚔️ Competitive Rivalry", c.concentration + `<br><small>${c.basisOfCompetition.join(" · ")}</small>`)}
    ${box("regulation", "🏛 Regulation", s.regulation)}
    ${box("substitutes", "🔄 Substitutes", s.substitution)}
  </div>`;
}

/* ---- Tier 1 visual: value-lever map (hub + branches) ---- */
function leverMapHtml(levers) {
  return `<div class="lever-map">
    <div class="hub">🎯 Value Creation</div>
    <div class="levers">${levers.map((l) => `<div class="lever-card">${l}</div>`).join("")}</div>
  </div>`;
}

/* ---- Tier 1 visual: diagnostics decision flow ---- */
function diagFlowHtml(d) {
  const steps = d.questionsToAskFirst
    .map((q, i) => `<div class="dflow-step"><span class="dnum">${i + 1}</span>${q}</div>`)
    .join(`<div class="dflow-arrow">↓</div>`);
  return (
    `<div class="dflow">${steps}</div>` +
    `<div style="margin-top:12px"><b>📥 Pull first:</b> ${chips(d.metricsToPullFirst)}</div>` +
    `<div style="margin-top:8px"><b>⚠️ Rookie traps:</b>${ul(d.rookieTraps)}</div>`
  );
}

/* ---- Tier 1 visual: cross-industry hub & spoke ---- */
function crossGraphHtml(x, industry) {
  return `<div class="hubspoke">
    <div class="hub center">${industry}</div>
    <div class="spoke-groups">
      <div class="spoke-group"><div class="spoke-label">↔ Similar economics</div>${x.similarTo.map((s) => `<div class="spoke">${s}</div>`).join("")}</div>
      <div class="spoke-group"><div class="spoke-label">🔗 Related primers</div>${chips(x.relatedPrimers)}</div>
      <div class="spoke-group"><div class="spoke-label">🧰 Frameworks</div>${chips(x.relevantFrameworks)}</div>
    </div>
  </div>`;
}

/* ---- Tier 1 visual: revenue equation (parsed from drivers, graceful fallback) ---- */
function revenueEqHtml(u) {
  const m = u.revenueDrivers.match(/^(.+?)\s*[x×]\s*(.+?)\s*\./);
  let eq = "";
  if (m && m[1].length < 28 && m[2].length < 28) {
    eq = `<div class="equation">
      <div class="eq-term">${m[1].trim()}</div><div class="eq-op">×</div>
      <div class="eq-term">${m[2].trim()}</div><div class="eq-op">=</div>
      <div class="eq-term rev">Revenue</div></div>`;
  }
  return (
    eq +
    para(`<b>Unit of revenue:</b> ${u.unitOfRevenue}`) +
    para(`<b>Drivers:</b> ${u.revenueDrivers}`) +
    `<b>Key KPIs:</b>` + ul(u.keyKPIs) + calculatorHtml()
  );
}

function indiaHtml(i) {
  return (
    para(`<b>Market structure:</b> ${i.marketStructure}`) +
    `<b>Major players:</b>` + chips(i.majorPlayers) +
    `<b>Regulators &amp; policy:</b>` + ul(i.regulatorsAndPolicy) +
    `<b>Policy tailwinds:</b>` + ul(i.policyTailwinds) +
    `<b>Demand drivers:</b>` + ul(i.demandDrivers) +
    `<b>Structural challenges:</b>` + ul(i.structuralChallenges) +
    `<div class="note">${i.note}</div>`
  );
}

/* ---- the Level 2 calculator (lives inside Unit Economics) ---- */
function calculatorHtml() {
  return `<div class="calc">
    <div class="calc-title">⚡ Quick TAM estimator (Level 2 — live math)</div>
    <label>Population <input type="number" id="c_pop" value="1400000000" /></label>
    <label>% target segment <input type="number" id="c_seg" value="35" /></label>
    <label>Adoption % <input type="number" id="c_adopt" value="60" /></label>
    <label>Annual spend (₹) <input type="number" id="c_spend" value="6000" /></label>
    <div class="calc-out">Market size ≈ <span id="c_result">—</span></div>
  </div>`;
}
function wireCalculator() {
  const ids = ["c_pop", "c_seg", "c_adopt", "c_spend"];
  const calc = () => {
    const pop = +document.getElementById("c_pop").value || 0;
    const seg = (+document.getElementById("c_seg").value || 0) / 100;
    const ad = (+document.getElementById("c_adopt").value || 0) / 100;
    const sp = +document.getElementById("c_spend").value || 0;
    const m = pop * seg * ad * sp;
    document.getElementById("c_result").textContent = "₹ " + Math.round(m).toLocaleString("en-IN");
  };
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calc); // L2
  });
  calc();
}

/* ---- render the whole primer into the main panel ---- */
function renderPrimer(p) {
  const perish = (p.meta.perishableFields || []);
  const badge = (key) =>
    perish.includes(key) ? ` <span class="perish" title="Perishable — refresh periodically">🔄</span>` : "";

  let html = `
    <div class="primer-header">
      <h1>${p.meta.industry}</h1>
      <div class="sub">${p.meta.sector} · updated ${p.meta.lastUpdated}</div>
      ${chips(p.meta.subSegments)}
    </div>`;

  // essence — highlighted, open by default
  html += card("✨ Essence — the 60-second version", ul(p.essence), { open: true, cls: "essence" });

  // every other section, in order
  const sections = [
    ["📌 Overview", () => para(`<b>What it is:</b> ${p.definition.oneLiner}`) + para(`<b>Job to be done:</b> ${p.definition.jobToBeDone}`)],
    ["🔗 Value Chain & Profit Pools", () => flow(p.valueChain.stages) + `<div class="callout sm">💰 <b>Profit pools:</b> ${p.valueChain.profitPools}</div>` + powerShiftHtml(p.valueChain.powerShift)],
    ["🏗 Business Model", () => chips(p.businessModels.primaryArchetypes) + ul(p.businessModels.variants)],
    ["💰 Unit Economics", () => revenueEqHtml(p.unitEconomics)],
    ["🧾 Cost Structure", () => para(`<b>Shape:</b> ${p.costStructure.shape}`) + `<b>Major pools:</b>` + ul(p.costStructure.majorPools) + para(`<b>Leverage:</b> ${p.costStructure.leverage}`)],
    ["⚔️ Competition & Moats", () => forcesHtml(p)],
    ["🌐 Structural Forces", () => kv(p.structuralForces)],
    ["🤖 AI Penetration" + badge("aiPenetration"), () => para(`<b>Maturity:</b> ${p.aiPenetration.maturity}`) + `<b>Key use cases:</b>` + ul(p.aiPenetration.keyUseCases) + para(`<b>Value-chain impact:</b> ${p.aiPenetration.valueChainImpact}`) + `<b>Opportunities:</b>` + ul(p.aiPenetration.opportunities) + `<b>Threats / disruption:</b>` + ul(p.aiPenetration.threatsDisruption) + `<div class="note">${p.aiPenetration.note}</div>`],
    ["📊 Benchmarks" + badge("benchmarks"), () => ul(p.benchmarks.ranges) + `<div class="note">${p.benchmarks.note}</div>`],
    ["🎯 Value Levers", () => leverMapHtml(p.valueLevers)],
    ["📖 Key Terms", () => glossary(p.keyTerms)],
    ["🧩 Common Case Types", () => ul(p.commonCaseTypes)],
    ["🔍 First-Look Diagnostics", () => diagFlowHtml(p.firstLookDiagnostics)],
    ["⭐ What's Unique Here", () => `<div class="callout">${p.whatsUniqueHere}</div>`],
    ["🇮🇳 India Landscape" + badge("indiaLandscape"), () => indiaHtml(p.indiaLandscape)],
    ["↔️ Cross-Industry Links", () => crossGraphHtml(p.crossIndustryLinks, p.meta.industry)],
    ["🕐 Current State" + badge("currentState"), () => para(`<i>As of ${p.currentState.asOf}</i>`) + para(p.currentState.marketStructure) + `<b>Key trends:</b>` + ul(p.currentState.keyTrends) + `<div class="note">${p.currentState.note}</div>`],
  ];

  sections.forEach(([title, fn]) => { html += card(title, fn()); });

  document.getElementById("content").innerHTML = html;
  wireCards();       // L1 collapse/expand
  wireCalculator();  // L2 live math
  window.__cortexCurrent = p;                                            // for "Save to Cases"
  window.__explorerHTML = document.getElementById("content").innerHTML;  // to restore after viewing Cases
}

/* ---- L1: make every card collapsible ---- */
function wireCards() {
  document.querySelectorAll(".card-head").forEach((h) => {
    h.addEventListener("click", () => h.parentElement.classList.toggle("open"));
  });
}

init();

/* ===== Phase 1: Cases (Supabase) ===== */
function setActiveTab(which) {
  document.querySelectorAll(".tabs .tab").forEach((t) => t.classList.remove("active"));
  const el = document.getElementById(which === "cases" ? "tabCases" : "tabExplorer");
  if (el) el.classList.add("active");
}

function showExplorer() {
  setActiveTab("explorer");
  document.getElementById("content").innerHTML =
    window.__explorerHTML || `<div class="placeholder">← Select an industry to explore its primer.</div>`;
}

async function showCases() {
  setActiveTab("cases");
  const content = document.getElementById("content");
  if (!window.cortexDB || !cortexDB.enabled()) {
    content.innerHTML = `<div class="error">Cases need Supabase config (web/config.js) + an internet connection.</div>`;
    return;
  }
  content.innerHTML = `<div class="placeholder">Loading your cases…</div>`;
  try {
    const rows = await cortexDB.listCases();
    if (!rows.length) {
      content.innerHTML = `<div class="placeholder">No saved cases yet. Open an industry and hit 💾 Save.</div>`;
      return;
    }
    content.innerHTML =
      `<div class="primer-header"><h1>🗂 Cases</h1><div class="sub">${rows.length} saved</div></div>` +
      rows.map((r) =>
        `<div class="card open"><button class="card-head">${r.title || r.industry_slug || "Case"}` +
        `<span class="chev" style="font-size:12px;color:var(--muted)">${(r.created_at || "").slice(0, 10)}</span></button>` +
        `<div class="card-body"><p>${r.question || r.type || ""}</p>` +
        `<button class="case-del" data-id="${r.id}" style="border:1px solid var(--line);background:none;color:#c0392b;border-radius:8px;padding:4px 10px;cursor:pointer">Delete</button></div></div>`
      ).join("");
    content.querySelectorAll(".case-del").forEach((b) =>
      b.addEventListener("click", async () => {
        try { await cortexDB.deleteCase(b.dataset.id); showCases(); }
        catch (e) { alert("Delete failed: " + e.message); }
      })
    );
    wireCards();
  } catch (e) {
    content.innerHTML = `<div class="error">Couldn't load cases: ${e.message}</div>`;
  }
}

async function saveCurrentToCases() {
  const p = window.__cortexCurrent;
  if (!p) { alert("Open an industry first, then hit Save."); return; }
  if (!window.cortexDB || !cortexDB.enabled()) { alert("Cases need Supabase config + internet."); return; }
  try {
    await cortexDB.saveCase({
      type: "bookmark",
      title: p.meta.industry,
      industry_slug: p.meta.slug,
      question: "Saved primer: " + p.meta.industry,
      content: { essence: p.essence }
    });
    alert('Saved "' + p.meta.industry + '" to Cases.');
  } catch (e) { alert("Save failed: " + e.message); }
}

(function wireDynamic() {
  const tCases = document.getElementById("tabCases");
  const tExpl = document.getElementById("tabExplorer");
  const sBtn = document.getElementById("saveBtn");
  if (tCases) tCases.addEventListener("click", showCases);
  if (tExpl) tExpl.addEventListener("click", showExplorer);
  if (sBtn) sBtn.addEventListener("click", saveCurrentToCases);
})();
