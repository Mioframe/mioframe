---
children_hash: d9b5d75f5e010a4d828c01f9e8060ba29accdece01517e1e5cfeaca403a62520
compression_ratio: 0.8818565400843882
condensation_order: 2
covers:
  [
    context.md,
    local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md,
    project/_index.md,
  ]
covers_token_total: 711
summary_level: d2
token_count: 627
type: summary
---

## facts (domain) — Structural Summary (d2)

### Domain intent (`context.md`)

- **Purpose:** Stable, easy-to-recall **project-level facts**: technical choices, operating preferences, and durable conventions.
- **Scope included:** tech/architecture facts, testing expectations + environment constraints, project-wide configuration and operational preferences.
- **Scope excluded:** personal profile facts; detailed feature implementation notes.
- **Usage pattern:** keep entries concise and durable; use for “defaults” that guide decisions across the repo.

---

### Key cross-domain synthesis (`local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md`)

- **Architectural premise (from `project_guidance`):**
  - Beaver is **local-first** and **offline by default**
  - **No registration** and **no hosted backend**
  - Cross-device workflow is **file-based export/import** with **CRDT-based merges**
- **Testing convention derived from architecture (ties to `facts/project/testing_preferences.md`):**
  - Prefer **fast, isolated, in-memory unit tests** to match offline/no-backend constraints.
  - Avoid **external dependencies** (real DB/network/services) in the unit-test layer; instead use **fakes, in-memory repositories, and pure-function tests**.
- **Relationship:** This synthesis explicitly links product constraints (local-first + CRDT + file transfer) to test strategy (in-memory-first), and cites both **`project_guidance`** and **`facts`** as evidence sources.

---

### Project testing constraints & preferences index (`project/_index.md`)

- **What it summarizes:** testing constraints/preferences shaping how automated tests are written and maintained.
- **Core rule (verbatim, from `testing_preferences.md`):** “**Unit tests should stay fast and in-memory.**”
- **Intent/impact:** unit tests should be **isolated** with **minimal external deps**, avoiding slow integration-style setups.
- **Process flow:** `test execution -> in-memory isolation -> fast feedback`
- **Recorded fact:** `unit_test_execution` (category: **convention**) capturing the same rule.
- **Provenance metadata:** timestamp **2026-04-17**, author **user**, maturity **core** (importance 85).

---

### Drill-down map (child entries)

- **Domain definition:** `context.md`
- **Architecture→testing synthesis:** `local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md`
- **Testing topic summary:** `project/_index.md` (covers `context.md`, `testing_preferences.md`)
