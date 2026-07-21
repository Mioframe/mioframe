# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is Mioframe's canonical Material 3 Expressive shared-library boundary.

The library is a reusable implementation tool, not a product layer. Material production code must remain independent of product architecture and domain behavior.

## Read by task

- `docs/architecture.md` — boundary, ownership, dependency direction, decomposition, and public API;
- `docs/tokens.md` — token taxonomy, naming, location, dependency graph, routing, and verification;
- `docs/sources.md` — official Material evidence and source-conflict rules;
- `docs/component-development.md` — canonical component convergence workflow and agent responsibility model;
- `docs/foundation-development.md` — canonical cross-family foundation workflow;
- `docs/roadmap.md` — active family, blocker, and one next action;
- the owning family or foundation README — current contract and workflow state.

Read only documents required by the current task.

## Routing

- `material-component` is the sole implementation orchestrator for one official component family.
- `material-canonical-target` researches only delegated official target claims.
- `material-semantics-audit`, `material-token-audit`, and `material-web-audit` own separate read-only concern lanes and run only when selected by the orchestrator.
- `material-component-review` reviews one correction contract or implemented correction unit.
- `material-pr-review` reviews complete PR merge readiness against the actual base/head.
- `material-foundation` owns one proven cross-family Material prerequisite or correction.
- `material3-guidelines` resolves official component choice and source evidence.
- Internal contract, implementation, and adoption skills run only when delegated by an orchestrator.
- Vue and testing skills run only for the locked implementation owner and proof lane.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

## Boundary

Canonical Material-owned implementation, foundations, component families, accepted patterns, public entry points, owner-local stories, fixtures, focused tests, and contracts belong under this root.

Existing official Material owners outside this root are legacy owners. They may be corrected in place until one complete valid relocation can replace them. Do not create parallel active owners or relocate before correctness.

Project-specific and generic shared UI remains outside Material ownership.

## Dependency direction

```text
Vue and browser platform
        ↓
generic shared/lib infrastructure
        ↓
material/foundation
        ↓
material/components
        ↓
material/patterns
        ↓
project-specific shared UI and product layers
```

- Material production does not import product layers, domains, routes, services, workers, stores, app shells, or project-specific presentation components.
- Foundation does not import components or patterns.
- Families do not deep-import another family's private files.
- Internal Material code uses owning local entry points; external consumers use the curated Material public API when ready.

## Token invariant

Official token names and dependency direction follow `docs/tokens.md`. New canonical code must not invent ambiguous `--md-<component>-*` aliases, declare component tokens outside the owning family token file, or expose `--md-private-*` routes as public API.

## Durable records

The owning family or foundation README is the single current contract and workflow-state record. It contains current truth only. Do not create separate registries, inventories, durable audits, review histories, shell transcripts, checklists, scorecards, progress ledgers, or duplicate workflow policy.

`AGENTS.md` routes work and states stable local invariants. Detailed procedures belong to the canonical workflow documents and skills.

## Completion

A correction objective requires its contract gate, implementation evidence, correction final review, complete PR review, affected consumer/visual handling, and repository verification. Full family completion additionally requires an `aligned` status and one canonical owner.
