# Ramit's Consulting Cortex

An interactive, India-aware consulting knowledge system: an MBB-grade "brain" you can talk to,
backed by structured **industry primers**, framework tools, and a saved case archive — surfaced
through an interactive web app.

Owner: Ramit Prakash · Started: 2026-06-14

---

## The vision

A single umbrella "consulting brain" you can ask questions like *"compare Airtel vs Jio"*, sitting on top of:
- **Specialist agents** that divide the work (answer questions, build primers, build deliverables)
- A **structured knowledge base** — especially **industry primers** for every major industry
- An **interactive web app** (not a read-only gallery) you actually use

The seed of the brain is the installed `management-consultant` skill (113 reference files).

---

## Architecture: Factory -> Warehouse -> Showroom

| | What | Job |
|---|---|---|
| **Factory** | Claude Code + agents | *Produce* knowledge (research & write primers, run analyses) |
| **Warehouse** | The saved files (`primers/`, `cases/`) | *Hold* finished knowledge in an agreed shape |
| **Showroom** | The web app (`web/`) | *Show* it — browse, compare, calculate |

Knowledge flows one way: agents **write** files -> files **sit** ready -> the web app **reads** them.
The **primer template is the contract** between factory and showroom (see `docs/primer-template.md`).

---

## Interface plan (web app)

Built at **interactivity Levels 1-3** (run in the browser, free on GitHub Pages):
- **L1** show/hide/filter · **L2** calculators · **L3** load saved files
- **L4** (live AI chat) is designed-in as a placeholder, switched on later via a cheap backend.

Sections: **Home · Industry Explorer · Compare · Tools · Cases**

---

## Storage

- **Master** lives here on the C drive.
- **Mirror** is pushed to a Google Drive folder ("Ramit's Consulting Cortex", personal account)
  via the Drive connector — backup + access anywhere. (Option 1: connector mirror, not auto-sync.)

---

## Folder structure

```
consulting-cortex/
  primers/        # the warehouse: one JSON per industry + _index.json taxonomy
  cases/          # saved analyses (e.g. airtel-vs-jio)
  web/            # the showroom: the interactive app
  docs/           # design docs, incl. the primer template spec
  README.md       # this file (scope + workflow)
```

---

## Agents (build as real jobs appear)

1. **Consultant** — answers questions (the `management-consultant` skill). *Have it.*
2. **Primer Builder** — researches & writes industry primers in the template. *Build next.*
3. **Deliverable Builder** — decks / memos / Google Docs. *Later.*
4. **Orchestrator / umbrella** — routes between them once there's enough to route. *Later.*

---

## Industry fill order

1. **Telecom** (done — the prototype/reference primer)
2. PGPM-covered sectors (ties into coursework)
3. Personal interest / career sectors (TBD)

Full taxonomy (~24 industries across 7 sectors) is in `primers/_index.json` — pending ones
show as "coming soon" in the app.

---

## Status

- [x] Primer template designed (18 sections, decoder-aligned + AI lens + India lens)
- [x] Telecom reference primer written
- [x] Taxonomy / `_index.json` scaffolded
- [x] C drive project + Google Drive mirror set up
- [ ] Web app (Industry Explorer first)
- [ ] Primer Builder agent
- [ ] Remaining primers
