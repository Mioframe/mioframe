---
confidence: 0.74
maturity: draft
sources:
  - project_guidance/_index.md
  - facts/_index.md
synthesized_at: '2026-04-18T14:00:16.312Z'
type: synthesis
---

# Local-first, file-based workflows imply in-memory-first testing (avoid external deps)

Because Beaver is explicitly local-first with file-based cross-device transfer and CRDT merges (no hosted backend), the most actionable testing convention is to keep tests fast, isolated, and in-memory—mirroring the product’s offline/no-backend constraints and reducing reliance on slow external integration setups that don’t match the architecture.

## Evidence

- **project_guidance**: Beaver is local-first, offline by default, with no registration and no hosted backend; cross-device workflow is file-based export/import with CRDT-based merges.
- **facts**: Core testing rule: unit tests should stay fast and in-memory; preferred style emphasizes in-memory isolation, minimizing external dependencies, using fakes/in-memory repos/pure-function tests.
