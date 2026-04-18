---
children_hash: 00e22141cb59ca13c580b304b1633b1afcfea95bc86b5d4bd7f0c51526f244b6
compression_ratio: 0.578839590443686
condensation_order: 3
covers: [facts/_index.md, project_guidance/_index.md]
covers_token_total: 1465
summary_level: d3
token_count: 848
type: summary
---

## Structural Summary (d3)

### 1) `facts/_index.md` (domain summary)

- **Domain role (`facts/context.md`):** Central place for _durable, repo-wide facts_ (tech choices, operating preferences, conventions).
  - **Included:** architecture/tech facts, testing expectations, environment constraints, project-wide defaults.
  - **Excluded:** personal profile facts; deep implementation notes.
  - **Usage:** short, stable rules that guide decisions across the repo.

- **Architecture → testing convention linkage (`local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md`):**
  - Product constraints (sourced from `project_guidance`): **local-first**, **offline-by-default**, **no registration**, **no hosted backend**.
  - Cross-device model: **file-based export/import** + **CRDT-based merges**.
  - Derived testing stance (ties to `facts/project/testing_preferences.md`): prefer **fast, isolated, in-memory unit tests**; avoid **external dependencies** (DB/network/services) at the unit-test layer; use **fakes/in-memory repositories/pure functions**.

- **Testing topic index (`project/_index.md`):**
  - Core rule (verbatim from `testing_preferences.md`): **“Unit tests should stay fast and in-memory.”**
  - Intent: unit tests should be **isolated** and minimize external dependencies for fast feedback.
  - Metadata: timestamp **2026-04-17**, author **user**, maturity **core**, importance **85**.
  - Drill-down: `facts/project/testing_preferences.md` (+ related abstract/overview entries).

- **Drill-down map:**
  - Domain definition: `facts/context.md`
  - Architecture→testing synthesis: `local-first-file-based-workflows-imply-in-memory-first-testing-avoid-external-de.md`
  - Testing conventions index: `facts/project/_index.md` → `facts/project/testing_preferences.md`

---

### 2) `project_guidance/_index.md` (domain summary)

- **Documentation policy (`documentation-policy-keep-guidance-platform-neutral-and-align-test-guidance-with.md`):**
  - Treat guidance as **durable conventions** (stable rules), not brittle examples.
  - Prefer **platform-neutral wording** to keep docs portable across environments.
  - Explicit cross-domain relationship:
    - `project_guidance` provides user-facing/documentation decisions.
    - `facts` holds the stable conventions that docs should align with (notably testing conventions).
  - Concrete change (2026-04-18): removed **Apple-specific AirDrop** references in **`README.md`** and **`README.ru.md`**, replaced with generic **file-transfer** language.

- **README guidance index (`readme/_index.md` → `product_positioning_and_feature_overview.md`):**
  - Product stance: Beaver is a **local-first personal data app**, **not a cloud service**; **no registration**; **no hosted backend**; **offline-by-default**.
  - Storage backends: **Browser OPFS (Origin Private File System)** and **user-selected local folder**.
  - Sync/merge workflow: **export/import JSON** + **file-transfer between devices** + **CRDT-based merges** (to avoid overwrites).
  - Documentation structure decision: **README** = positioning/roadmap checklists; **`DEVELOPMENT.md`** = setup/tooling (separation of concerns).
  - License: **Functional Source License (FSL)** with **3-year non-compete**.
  - Related pointer: mentions `repo_guidelines/package_scripts/context.md` for script/tooling conventions that documentation may reference.
