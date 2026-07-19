# Material library documentation

This directory contains the complete durable documentation for `src/shared/ui/material`.

Read only the documents required by the current task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, and public API;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — the single workflow for creating, migrating, changing, testing, and reviewing a component family;
- [`foundation-development.md`](./foundation-development.md) — the single workflow for cross-family Material foundations;
- [`roadmap.md`](./roadmap.md) — current family, blocker, and one next action.

Family-specific contracts live beside their implementation in `components/<family>/README.md`. A foundation domain gets `foundation/<domain>/README.md` only after a real runtime or public contract exists.

Do not create separate registries, inventories, audits, checklists, verification manuals, Storybook manuals, or duplicated workflow documents. Code, family/domain contracts, tests, stories, exports, and Git history are the factual implementation record.
