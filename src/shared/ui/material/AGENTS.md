# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the complete canonical Material 3 Expressive shared-library boundary.

The Material library is an implementation tool consumed by Mioframe. It is not a product layer and must remain independent of product architecture and domain behavior.

Everything canonical and Material-specific lives under this root: implementation, foundations, official component families, accepted patterns, public entry points, documentation, family/domain contracts, owner-local stories, fixtures, and focused tests.

## Required documents

Read only what the current task needs:

- `docs/architecture.md` for boundary, ownership, dependency direction, public API, and workflow ownership;
- `docs/sources.md` for official Material evidence;
- `docs/component-development.md` for the only component workflow and stage gates;
- `docs/foundation-development.md` when a cross-family foundation contract changes;
- `docs/roadmap.md` when selecting or changing the active family.

Family contracts live beside implementation in `components/<family>/README.md`. Foundation-domain contracts live in `foundation/<domain>/README.md` only after a real owner exists.

Do not create registries, inventories, durable audit reports, checklists, progress ledgers, or additional workflow documents.

## Routing

- Use `material-component` as the sole implementation orchestrator for one official Material family.
- `material-component-contract` owns only the ready family contract before production edits.
- `material-component-implementation` owns the primary vertical slice, representative consumer validation, complete supported family, Storybook, and proportional proof.
- `material-component-adoption` owns remaining consumer migration and complete removal of obsolete ownership.
- Use `material-component-review` only for review-only assessment; it never fixes production files.
- Use `material-foundation` only for a real cross-family foundation contract change reported by the contract stage or requested as focused standalone work.
- Use `material3-guidelines` for official source lookup and Material usage decisions.
- Use `material-library-status` only for concise read-only roadmap, PR, and verification status.
- Use Vue and testing skills only at the exact implementation checkpoint and proof layer required by `docs/component-development.md`.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

Implementation follows one sequence:

```text
material-component
→ material-component-contract
→ material-foundation when required
→ material-component-implementation
   primary slice
   → representative consumer
   → complete supported family
→ material-component-adoption
→ material-component-review
→ verification
```

Only `material-component` chooses the next stage and updates the roadmap. Internal stage skills do not invoke each other, select another family, or create a second plan.

Do not stop after research, contract writing, Storybook preparation, a primary slice, or focused checks when end-to-end implementation was requested.

## Isolation and dependency direction

```text
product and project-specific shared UI
  └─ imports → @shared/ui/material

@shared/ui/material
  ├─ may import → Material-owned local code
  ├─ may import → Vue and browser platform contracts
  └─ may import → correctly owned generic shared/lib infrastructure
```

- Production code must not import entities, features, widgets, pages, panes, app shells, routes, services, workers, stores, domain models, or project-specific presentation components.
- Stories, fixtures, and focused tests remain generic and owner-local.
- Foundation does not import components or patterns.
- Families do not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- Product needs may choose priority and compatibility scope, but must not shape internal Material ownership or public APIs around a domain workflow.

## Public API and new artifacts

- External consumers use `@shared/ui/material` after a real root entry point exists.
- Internal Material modules use owning local public entry points, not the root barrel.
- New official families belong under `components/<family>`.
- New foundation domains belong under `foundation/<domain>` only when current work proves a cross-family need.
- New patterns require official composition evidence and a current reusable scenario.
- Do not add placeholders, universal bases, managers, registries, generic resolvers, speculative extension points, product adapters, or project-specific UI.

## Completion

Use one cohesive family migration by default. Resolve the contract, validate one complete slice in a representative consumer, finish the supported family, migrate remaining consumers, remove obsolete ownership, review the complete result, and run final verification.

Automation proves only deterministic contracts represented by actual tooling. The coding agent owns all non-visual decisions; the operator owns final comparison of prepared visible evidence when required. An automated agent never reports operator acceptance without an explicit recorded result.
