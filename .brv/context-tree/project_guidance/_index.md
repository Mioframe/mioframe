---
children_hash: 6f05f47a0014c1b8a79b7ac18a41f528bcc7fa6edc35d5c40f19004aa06f018a
compression_ratio: 0.9089673913043478
condensation_order: 2
covers:
  [
    documentation-policy-keep-guidance-platform-neutral-and-align-test-guidance-with.md,
    readme/_index.md,
  ]
covers_token_total: 736
summary_level: d2
token_count: 669
type: summary
---

## Level d2 structural summary (Project guidance + documentation policy)

### Documentation policy: keep guidance platform-neutral, and align test guidance with durable conventions (`documentation-policy-keep-guidance-platform-neutral-and-align-test-guidance-with.md`)

- **Meta-pattern / architectural decision**
  - Treat certain guidance as **durable conventions** (stable, recall-friendly rules), not optional examples.
  - Prefer **portability-oriented, platform-neutral language** in documentation so guidance doesn’t break across environments.
- **Key relationship**
  - Bridges two domains:
    - **`project_guidance`**: documentation decisions and user-facing guidance.
    - **`facts`**: stable project knowledge and **durable testing conventions** (see testing preferences entries under `facts/` for drill-down).
- **Concrete evidence referenced**
  - Documentation decision (2026-04-18): removed **Apple-specific AirDrop** references in **`README.md`** and **`README.ru.md`**, replaced with generic **file-transfer** terminology.

---

### Project Guidance → README index (`readme/_index.md`)

- **Primary child entry**
  - `product_positioning_and_feature_overview.md` (drill-down for full positioning and feature checklist details).
- **Product stance**
  - Beaver is a **local-first personal data app**, explicitly **not a cloud service**.
  - **No registration**, **no hosted backend**; **offline-by-default**.
- **Storage model (two backends)**
  - **Browser OPFS (Origin Private File System)**
  - **User-selected local folder** on the device
- **Sync / merge approach (core workflow pattern)**
  - **File-transfer sync** (no server): users move data files between devices via **generic file transfer**.
  - **CRDT-based data format** supports merging changes to avoid overwrites.
  - Workflow framing: choose storage (**OPFS or local folder**) → create/edit tables/records → **export/import JSON** → transfer files between devices → **CRDT merges**.
- **Documentation structure decision**
  - README is for **user-facing positioning + roadmap checklists**.
  - **`DEVELOPMENT.md`** is for **setup/tooling** (separation of concerns between product docs and developer docs).
- **Licensing**
  - **Functional Source License (FSL)** with a **3-year non-compete** term.
- **Recent documentation decision (ties to policy entry)**
  - Updated README wording to remove **AirDrop** mentions; replaced with **platform-neutral file-transfer** language in **`README.md`** and **`README.ru.md`**.
- **Related guidance**
  - References conventions in `repo_guidelines/package_scripts/context.md` (drill-down for scripts/tooling conventions that documentation may point to).
