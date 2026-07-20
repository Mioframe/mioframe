# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the complete canonical Material 3 Expressive shared-library boundary.

The Material library is an implementation tool consumed by Mioframe. It is not a product layer and must remain independent of product architecture and domain behavior.

Everything canonical and Material-specific lives under this root: implementation, foundations, official component families, accepted patterns, public entry points, documentation, family/domain contracts, owner-local stories, fixtures, and focused tests.

## Required documents

Read only what the current task needs:

- `docs/architecture.md` for boundary, ownership, dependency direction, convergence, decomposition, and public API;
- `docs/sources.md` for official Material evidence;
- `docs/component-development.md` for the canonical convergence model;
- the current `.agents/skills/material-component*` files for executable responsibility isolation and evidence gates;
- `docs/foundation-development.md` when a cross-family foundation contract changes;
- `docs/roadmap.md` when selecting or changing the active family.

Family contracts live beside canonical implementation in `components/<family>/README.md`. While one active legacy owner remains outside the boundary, its contract may live under `docs/legacy/<family>.md` and moves with the family during relocation.

Do not create registries, inventories, durable audits, separate checklists, progress ledgers, or additional family-state documents. The owning README is the single workflow-state, target, assessment, alignment, dependency, decomposition, proof, and correction record.

## Routing

- Use `material-component` as the sole convergence orchestrator for one official family.
- `material-component-contract` synthesizes an isolated canonical target and a separate current-state audit.
- `material-component-review` runs twice: `contract-gate` before production and `final-gate` after implementation.
- `material-component-implementation` executes only one correction unit approved by the contract gate.
- `material-component-adoption` is conditional and owns only in-scope consumer migration and obsolete-owner removal.
- Use `material-foundation` for a real cross-family prerequisite or standalone foundation correction.
- Use `material3-guidelines` for official source lookup.
- Use Vue and testing skills only for the locked owner and proof lane.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

```text
material-component
→ isolated canonical target
→ target lock
→ isolated current-state audit
→ contract synthesis
→ independent contract gate
→ foundation prerequisite when required
→ one correction unit
→ affected consumers and visual handoff
→ conditional adoption
→ independent final gate
→ verification
```

Production edits are forbidden until the contract gate passes.

## Delegated responsibility

Use read-only delegated agents or fresh isolated sessions to prevent one context from authoring and approving its own assumptions.

Claude Code project roles are defined under `.claude/agents/`:

- `material-canonical-target`;
- `material-current-state-auditor`;
- `material-contract-gate-reviewer`;
- `material-final-reviewer`.

Codex may use separate agent threads or isolated worktrees for the same bounded roles.

The orchestrator remains the only owner of stage transitions, synthesis, repository writes, roadmap changes, and final decisions. Researchers and reviewers are read-only. Do not pass preferred conclusions or implementation reasoning to reviewers. Do not use concurrent writers on the same owner or worktree. If delegated agents are unavailable, use fresh isolated sessions without weakening the gates.

## Evidence rules

- Resolve and lock the canonical target before current component implementation, component tests, stories, snapshots, or prior family conclusions can determine it.
- Record every source contradiction, absence, inference, and platform-specific statement. Token absence does not automatically cancel explicit guidance; token presence does not prove support.
- Android, iOS, and Web guidance are not interchangeable without an explicit platform decision.
- Assess every mandatory concern: API; native, keyboard, form, and event propagation semantics; accessibility; anatomy and DOM; state; token and rendered-property routing; geometry, typography, RTL, responsive and text scaling; motion; extensions; dependencies; owners; consumers; proof; cleanup.
- Each concern receives a classification or `not-applicable` with a reason.
- Existing tests, stories, snapshots, consumers, and green CI are evidence only.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct ownership, faithful proof in the correct lane, and no unresolved contradiction.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, and separate proof. A known defect in the extension or dependency prevents completion.

Every dependency is classified as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation. Repeated use does not make a Material component generic foundation.

## Correction priority and proof

Correction order is:

1. unresolved required source or platform decisions;
2. wrong family, dependency, or foundation ownership;
3. native semantics, event propagation, accessibility, and form behavior;
4. public API and invalid combinations;
5. state ownership;
6. anatomy and DOM;
7. token and rendered-property routing;
8. geometry, responsive behavior, typography, RTL, and text scaling;
9. motion and browser lifecycle;
10. project extensions;
11. adoption;
12. obsolete-owner removal.

Do not bypass a higher-priority blocker with an easier local improvement.

Proof lanes are strict:

- unit/component for deterministic contracts and non-browser wiring;
- browser for layout, focus, keyboard, propagation, pointer/touch, target area, responsive behavior, and motion lifecycle;
- visual for screenshots only;
- consumer for integration and compatibility.

Visual specs do not contain behavior success criteria or large computed-style assertion matrices. Visible changes require official comparison and honest operator-acceptance status.

## Existing implementation policy

Current implementation is editable evidence, not Material authority and not disposable by default. Preserve only independently confirmed owners. Correct misaligned owners through bounded units. Block or narrow unresolved surface. Remove obsolete owners after replacement. Rewrite only the smallest owner when incremental correction would add more workaround logic.

A fresh session resets reasoning, not valid repository progress.

## Isolation and dependency direction

```text
product and project-specific shared UI
  └─ imports → @shared/ui/material

@shared/ui/material
  ├─ may import → Material-owned local code
  ├─ may import → Vue and browser platform contracts
  └─ may import → correctly owned generic shared/lib infrastructure
```

Production code must not import entities, features, widgets, pages, panes, app shells, routes, services, workers, stores, domain models, or project-specific presentation components. Foundation does not import components or patterns. Families do not deep-import another family's private files.

## Implementation ownership

Public Vue artifacts are thin composition roots. Split deterministic logic, lifecycle, styles, rendered-property routing, and motion only when ownership or proof becomes clearer. Do not preserve monoliths because they already exist, fragment files to reduce line count, or add wrapper components or DOM nodes merely for separation.

## Completion

A correction objective is complete only when workflow state, target, source decisions, assessment, dependencies, correction unit, implementation, affected consumers, visual evidence, final review, and verification agree.

The family is complete only when required surface has no `misaligned`, `unresolved`, or `obsolete` concern, one canonical owner remains, required consumers use it, and final review and verification pass.

Automation proves only represented deterministic contracts. The operator owns final visible comparison when required; an automated agent never reports operator acceptance without an explicit result.
