## Key points

- Beaver is positioned as a **local-first personal data app**, explicitly **not a cloud service**: **no registration** and **no hosted backend**.
- Supports **offline-by-default** usage.
- Offers two **storage options**: **browser OPFS** or a **user-selected local folder** on the device.
- **Sync/merge model**: users move files between devices via **generic file transfer**, and a **CRDT-based data format** merges changes to avoid overwriting work.
- **Roadmap and feature status** are maintained as **README checklists** spanning multiple product areas (workspace, modeling, entry, presentation, management).
- **Licensing**: **Functional Source License (FSL)** with a **3-year non-compete** term.
- Documentation maintenance note: README wording was updated to remove **Apple-specific AirDrop** mentions in favor of neutral file-transfer language.

## Structure / sections summary

- **Frontmatter metadata**: title, summary, related doc link (`repo_guidelines/package_scripts/context.md`), importance/recency/maturity, timestamps.
- **Reason**: states intent to capture durable positioning, storage/sync model, and roadmap from README in EN/RU.
- **Raw Concept**
  - **Task**: document README positioning + feature/roadmap.
  - **Changes**: replace AirDrop references with neutral file-transfer language.
  - **Files**: `README.md`, `README.ru.md`, `DEVELOPMENT.md`.
  - **Flow**: storage choice → create/edit data → export/import JSON → move files between devices → CRDT merge.
  - **Timestamp**.
- **Narrative**
  - **Structure**: describes EN/RU READMEs and their role (positioning + checklists).
  - **Dependencies**: OPFS + CRDT; dev setup delegated to `DEVELOPMENT.md`.
  - **Highlights**: reiterates core claims and roadmap checklist concept.
  - **Rules**: separates user-facing README content from development/tooling docs.
- **Facts**: enumerated claims about positioning, storage, offline behavior, sync model, licensing, roadmap tracking convention, and the recent documentation change.

## Notable entities, patterns, or decisions mentioned

- **Entities / technologies**
  - **OPFS (Origin Private File System)** as a browser storage mechanism.
  - **CRDT** as the merge/synchronization data format/strategy.
  - **Export/import JSON** as part of the data portability workflow.
  - Documents: `README.md`, `README.ru.md`, `DEVELOPMENT.md`; related: `repo_guidelines/package_scripts/context.md`.
- **Patterns**
  - **Local-first + file-based sync**: users synchronize by transferring local files (not via a server).
  - **Checklist-driven roadmap** embedded directly in README for transparency and tracking.
  - **Doc layering**: README for user-facing overview; `DEVELOPMENT.md` for setup/tooling.
- **Decisions**
  - Product stance: **no cloud**, **no accounts**, **offline-first**.
  - Storage choice offered to users: **OPFS vs local folder**.
  - Sync approach: **CRDT merging** to prevent overwrites during multi-device file transfer.
  - Licensing choice: **FSL with a 3-year non-compete**.
  - Documentation decision: remove platform-specific (Apple/AirDrop) terminology in favor of neutral phrasing.
