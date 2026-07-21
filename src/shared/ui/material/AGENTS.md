# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is Mioframe's canonical Material 3 Expressive shared-library boundary.

The library is a reusable implementation tool, not a product layer. Material production code remains independent of product architecture and domain behavior.

## Read by task

- `docs/architecture.md` — boundary, ownership, dependency direction, decomposition, and public API;
- `docs/tokens.md` — token taxonomy, naming, location, dependency graph, routing, and verification;
- `docs/sources.md` — official Material evidence and source-conflict rules;
- `docs/component-development.md` — autonomous component-family convergence and portable agent responsibility model;
- `docs/foundation-development.md` — autonomous cross-family foundation convergence;
- `docs/roadmap.md` — active family, blocker, and one next action;
- the owning family or foundation README — current contract and workflow state.

Read only documents required by the current task.

## Routing

- `material-component` is the sole writer and orchestrator for one official component family. A family name is sufficient input.
- `material-foundation` is the sole writer and orchestrator for one real cross-family Material contract or exact delegated prerequisite.
- `material-canonical-target` researches only delegated official target claims.
- `material-semantics-audit`, `material-token-audit`, and `material-web-audit` own separate read-only concern lanes selected by an orchestrator.
- `material-component-review` independently reviews one proposed or implemented correction unit.
- `material-family-review` independently reviews the complete current family only after no known required gap remains.
- Internal contract, implementation, and adoption skills run only inside the owning orchestrator workflow.
- Vue and testing skills run only for the locked implementation owner and proof lane.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

Portable `.agents/skills` and canonical Material documents own workflow policy. Tool-specific agent directories, model configuration, permissions, Git state, and publication workflow are not Material policy owners.

## Boundary

Canonical Material-owned implementation, foundations, component families, accepted patterns, public entry points, owner-local stories, fixtures, focused tests, and contracts belong under this root.

Existing official Material owners outside this root are legacy owners. They may be corrected in place until one complete valid relocation replaces them. Do not create parallel active owners or relocate before correctness.

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

## Agent execution

Keep orientation, contract synthesis, implementation, adoption, workflow state, and continuation in the owning orchestrator context.

Use isolated read-only contexts only for self-contained source research, verbose concern audits, browser-evidence analysis, or independent review. When isolation is unavailable, execute the same portable skill sequentially with the same bounded input and result contract.

Do not restart complete orientation or accepted audits after each correction. Reopen only facts invalidated by new evidence.

## Token invariant

Official token names and dependency direction follow `docs/tokens.md`. New canonical code must not invent ambiguous `--md-<component>-*` aliases, declare component tokens outside the owning family token file, or expose `--md-private-*` routes as public API.

## Durable records

The owning family or foundation README is the single current contract and workflow-state record. It contains current truth only. Do not create separate registries, inventories, durable audits, review histories, shell transcripts, checklists, scorecards, progress ledgers, or duplicate workflow policy.

`AGENTS.md` routes work and states stable local invariants. Detailed procedures belong to canonical workflow documents and skills.

## Completion

A correction requires a passed contract gate, implementation evidence, focused proof, and correction-final review. The orchestrator continues successive correction units while known required gaps remain.

Full family completion additionally requires closed dependencies, completed prerequisites and adoption, one canonical owner, required operator comparison, independent `material-family-review: complete`, and final repository verification.
