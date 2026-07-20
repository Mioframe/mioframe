# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the complete canonical Material 3 Expressive shared-library boundary.

The Material library is an implementation tool consumed by Mioframe. It is not a product layer and must remain independent of product architecture and domain behavior.

Everything canonical and Material-specific lives under this root: implementation, foundations, official component families, accepted patterns, public entry points, documentation, family/domain contracts, owner-local stories, fixtures, and focused tests.

## Required documents

Read only what the current task needs:

- `docs/architecture.md` for boundary, ownership, dependency direction, convergence, implementation decomposition, public API, and workflow ownership;
- `docs/sources.md` for official Material evidence;
- `docs/component-development.md` for the only component convergence workflow and exit gates;
- `docs/foundation-development.md` when a cross-family foundation contract changes;
- `docs/roadmap.md` when selecting or changing the active family.

Family contracts live beside canonical implementation in `components/<family>/README.md`. While one active legacy owner remains outside the boundary, its contract may live under `docs/legacy/<family>.md` and moves with the family during relocation. Foundation-domain contracts live in `foundation/<domain>/README.md` only after a real owner exists.

Do not create registries, inventories, durable audit reports, separate checklists, progress ledgers, or additional workflow documents. Structured canonical-target, assessment, alignment, decomposition, proof, and correction-unit sections inside the owning README are required records.

## Routing

- Use `material-component` as the sole convergence orchestrator for one official Material family.
- `material-component-contract` owns the independent canonical target, current implementation assessment, alignment map, correction units, decomposition, proof, compatibility, and foundation decisions.
- `material-component-implementation` owns proof-first execution of documented correction units and validation of affected real consumers.
- `material-component-adoption` is conditional and owns only in-scope consumer migration and obsolete-owner removal after the canonical owner is ready.
- Use `material-component-review` only for independent review-only assessment; it never fixes production files.
- Use `material-foundation` for focused convergence of a real cross-family foundation contract reported by the component contract or requested as standalone work.
- Use `material3-guidelines` for official source lookup and Material usage decisions.
- Use `material-library-status` only for concise read-only roadmap, PR, and verification status.
- Use Vue and testing skills only at the exact correction checkpoint and proof layer required by `docs/component-development.md`.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

Implementation follows one sequence:

```text
material-component
→ canonical target and current-state assessment
→ alignment map and correction units
→ material-foundation when required
→ proof-first correction-unit implementation
→ affected representative consumers
→ conditional adoption
→ independent review
→ verification
→ next correction unit or family completion
```

Only `material-component` chooses the next stage and updates the roadmap. Internal stage skills do not invoke each other, select another family, or create a second plan.

A correction objective may complete while the family remains `converging`. This is valid only when the repository state is independently correct, remaining gaps are explicit and non-blocking, and one next correction unit is recorded. Do not require full-family rewrite or full consumer migration for every correction.

## Existing implementation policy

- Current implementation is evidence and editable state, not Material authority and not disposable by default.
- Resolve the canonical target before using legacy API, DOM, CSS, state, tests, stories, snapshots, or consumers to make Material decisions.
- Preserve owners classified `confirmed-compliant` or `project-extension`.
- Correct `misaligned` owners through bounded units.
- Block or narrow `unresolved` surface.
- Remove `obsolete` owners only after replacement is complete.
- Existing proof must be classified before reuse; passing legacy tests or snapshots do not establish canonical correctness.
- Rewrite only the smallest owner when its contract is predominantly wrong or incremental repair would add more workaround logic.
- A fresh agent session resets reasoning, not valid repository progress.

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

## Implementation ownership

- Public Vue artifacts are thin composition roots for public API, native host, minimum anatomy, and integration of internal owners.
- A non-trivial visual contract has explicit owner-local style and motion ownership. Inline scoped styles are limited to short, linear contracts that are clearer when colocated.
- Deterministic normalization, invalid combinations, configuration selection, and state precedence use owner-local TypeScript modules when they have independent proof or reasons to change.
- Vue and browser lifecycle uses focused composables; do not introduce hidden managers or duplicate state owners.
- Split by responsibility and proof ownership, not by a universal file template or line count.
- Do not introduce wrapper components or DOM nodes merely to achieve file separation.

## Public API and new artifacts

- External consumers use `@shared/ui/material` only after the relevant canonical owner is ready for them.
- Internal Material modules use owning local public entry points, not the root barrel.
- New official families belong under `components/<family>`.
- Existing legacy families may be corrected in place until a complete relocation is safe; never create parallel active owners.
- New foundation domains belong under `foundation/<domain>` only when current work proves a cross-family need.
- New patterns require official composition evidence and a current reusable scenario.
- Do not add placeholders, universal bases, managers, registries, generic resolvers, speculative extension points, product adapters, or project-specific UI.

## Completion

A correction objective is complete when its canonical target, alignment map, correction units, implementation, affected consumers, review, operator evidence, and verification agree and the repository remains independently valid.

The family is complete only when required surface has no `misaligned`, `unresolved`, or `obsolete` concern; one canonical owner remains; all required consumers use it; and final review and verification pass.

Automation proves only deterministic contracts represented by actual tooling. The coding agent owns non-visual implementation decisions; the operator owns final comparison of prepared visible evidence when required. An automated agent never reports operator acceptance without an explicit recorded result.
