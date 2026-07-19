# Material library documentation

This directory contains the complete durable documentation for `src/shared/ui/material`.

Read only the documents required by the current task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, and public API;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — the single workflow for creating, migrating, changing, testing, and reviewing a component family;
- [`foundation-development.md`](./foundation-development.md) — the single workflow for cross-family Material foundations;
- [`roadmap.md`](./roadmap.md) — current family, blocker, and one next action.

Canonical family contracts live beside migrated implementation in `components/<family>/README.md`. While a legacy Material family still lives elsewhere under `src/shared/ui`, its current contract may live under `docs/legacy/<family>.md` and must move with the family during canonical migration. A foundation domain gets `foundation/<domain>/README.md` only after a real runtime or public contract exists.

Do not create separate registries, inventories, audits, checklists, verification manuals, Storybook manuals, or duplicated workflow documents. Code, family/domain contracts, tests, stories, exports, and Git history are the factual implementation record.
