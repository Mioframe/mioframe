---
children_hash: 5af4de713e897f326a2943bcda9accd998d3e1e1a9372de163b38805f42d768a
compression_ratio: 0.26459143968871596
condensation_order: 1
covers: [product_positioning_and_feature_overview.md]
covers_token_total: 1542
summary_level: d1
token_count: 408
type: summary
---

## Project Guidance → README

### Product Positioning and Feature Overview (`product_positioning_and_feature_overview.md`)

- **Product stance**
  - Beaver is a **local-first personal data app**, explicitly **not a cloud service**.
  - **No registration** and **no hosted backend**; **offline-by-default** usage.
- **Storage model**
  - Two supported storage backends:
    - **Browser OPFS (Origin Private File System)**
    - **User-selected local folder** on the device
- **Sync / merge approach**
  - **File-transfer sync**: users move data files between devices via **generic file transfer** (no server involved).
  - **CRDT-based data format** merges changes to avoid overwriting work.
  - Core workflow (from README framing): choose storage (**OPFS or local folder**) → create/edit tables/records → **export/import JSON** → move files between devices → **CRDT merges**.
- **Roadmap + documentation structure**
  - Implemented/planned features tracked as **README checklists** across areas like **workspace, modeling, entry, presentation, management**.
  - **Doc layering decision**: README for user-facing positioning/roadmap; **`DEVELOPMENT.md`** for setup/tooling details.
- **Licensing**
  - **Functional Source License (FSL)** with a **3-year non-compete** term.
- **Recent documentation decision**
  - README wording updated to remove **Apple-specific AirDrop** mentions; replaced with **platform-neutral file-transfer language** (applies to **`README.md`** and **`README.ru.md`**).
- **Relationship**
  - Related guidance: `repo_guidelines/package_scripts/context.md` (for scripts/tooling conventions referenced by docs).
