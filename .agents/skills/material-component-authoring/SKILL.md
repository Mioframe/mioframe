---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family. Owns the end-to-end execution order from source lookup and adaptive family contract through implementation, consumer migration, proportional proof, rule refinement, evidence review, and operator visual handoff.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use this as the primary workflow for official public Material component work.

It applies to:

- a new public `MD*` component;
- migration of a legacy `MD*` family into `src/shared/ui/material`;
- Material 3 Expressive alignment of a canonical family;
- a material change to a migrated family's public contract or visible behavior.

It does not apply to project-specific shared UI or a strict legacy repair that truthfully records `Architecture impact: none`.

## Companion instructions

Use:

- `material3-guidelines` for current official sources, component choice, usage, and minimum supported surface;
- `material-foundation` only when a cross-family foundation contract changes;
- `vue-component-implementation` for Vue mechanics;
- `component-contract-testing`, `ui-browser-behavior`, and `visual-regression-testing` only for applicable proof layers;
- `verification` for focused and final repository checks;
- `docs/material-3/autonomous-review.md` for agent review and operator visual handoff;
- `library-roadmap.md` and `ui-library-inventory.md` for active work and queue state.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

## 1. Select the family and change mode

Select one cohesive family from the active roadmap or highest-priority ready queue item.

Record one change mode:

- `new-component`;
- `end-to-end-migration`;
- `library-relocation-only`;
- `alignment-only`.

Use `end-to-end-migration` by default for sequential legacy migration. Split work only when a wider foundation blast radius, public compatibility decision, reviewability, or a safer independently valid intermediate state justifies it.

Do not mix unrelated families or broad shared cleanup.

## 2. Resolve sources and supported scope

1. Inspect the current family, public exports, direct consumers, stories, tests, and known defects.
2. Start from named scenarios and affected consumers.
3. Resolve the current official Material 3 Expressive contract.
4. Use the official Design Kit only for applicable visual decisions unresolved by published guidance.
5. Define the minimum complete supported surface.
6. Record unused official capability as unsupported.
7. Add no Mioframe extension without an explicit requirement and owner.

Stop only when a genuine product, source, ownership, compatibility, or required foundation decision remains unresolved.

## 3. Validate and refine applicable rules

Before relying on project rules:

1. identify the documents, skills, checklists, registries, or scoped instructions applicable to the family;
2. verify that they describe the real migration accurately and coherently;
3. when a rule is inaccurate, contradictory, incomplete, obsolete, or needlessly complex, identify the concrete evidence and owning source;
4. make the smallest correction supported by official Material sources, repository architecture, and accepted product behavior;
5. update only directly affected rule owners;
6. continue after the applicable rules are coherent.

Do not silently violate a rule, preserve it through a family-specific exception, duplicate a replacement elsewhere, or delegate a resolvable technical inconsistency to operator visual review.

## 4. Complete the adaptive family contract

Before production edits, create or update the family `README.md` using `component-architecture.md`.

Resolve the mandatory core:

- family and ownership;
- scenarios and non-goals;
- official sources and snapshot;
- supported and unsupported surface;
- public API, native semantics, accessibility, and invalid combinations;
- applicable foundation dependencies;
- production/public files, consumers, and applicable proof;
- extensions or deviations;
- readiness and unresolved decisions.

Add conditional sections only when the family owns those concerns:

- anatomy and DOM ownership;
- state ownership and lifecycle;
- token and property routing;
- configuration routes;
- browser behavior;
- visual evidence;
- consumer migration;
- foundation change.

Do not create ceremonial fields or speculative decisions for unsupported capability.

## 5. Resolve foundation dependencies

For every applicable foundation domain:

1. identify the accepted owner and required capability;
2. reuse the accepted contract when sufficient;
3. name exact non-blocking gaps for partial or deviated status;
4. treat missing or blocked required capability as a blocker;
5. use `material-foundation` when the shared contract changes.

Use a focused foundation PR when its blast radius is materially wider than the family migration. Do not create a local substitute or parallel owner.

## 6. Plan the end-to-end passes

Use a compact pass order without repeating the family contract:

1. source-backed contract and directly affected records;
2. required foundation work or accepted dependency wiring;
3. production family and public export;
4. consumer migration;
5. proportional contract, browser, pure, consumer, and visual proof;
6. obsolete-path removal;
7. agent evidence review and operator visual package when required;
8. queue and roadmap update.

Run focused verification after risky passes. Reorder or split passes only when repository dependencies require it.

## 7. Implement the family

- Keep props, emits, slots, native elements, DOM-critical attributes, and events explicit.
- Prefer native HTML activation, form, navigation, and accessibility semantics.
- Keep controlled semantic state consumer-owned.
- Limit component transient state to owned gesture, overlay, animation, or native coordination.
- Define acquisition, release, cancellation, disabled, failure, and cleanup behavior when applicable.
- Use exact verified official tokens and the shortest property route.
- Separate token declaration, configuration routing, state resolution, and final rendering conceptually.
- Use separate files only when they materially improve clarity or focused verification.
- Create no empty layers, universal bases, runtime registries, generic resolvers, CSS DSLs, cross-family state machines, broad option bags, or speculative extension points.

## 8. Migrate consumers and ownership

For an end-to-end migration:

1. create the canonical family owner;
2. migrate every affected in-repository consumer and public export;
3. preserve accepted product behavior except for named deltas;
4. remove obsolete files and legacy exports;
5. allow a temporary compatibility path only when atomic migration is technically unsafe, with exact consumers, no new usage, and a removal target;
6. update only documents and records whose owned facts changed.

Do not report a family migrated while an active obsolete owner or undocumented parallel path remains.

## 9. Build proportional proof

Every new or migrated component requires component-contract tests.

Add other layers only when applicable:

- one stable canonical visual story for visible output;
- `StateMatrix` only for multiple distinct component-owned visual routes;
- bounded visual regression when stable regression protection is material;
- Storybook Playwright behavior tests for browser-owned behavior the component constrains;
- focused pure tests for extracted logic or lifecycle;
- consumer-preservation checks when consumers changed.

Use real browser input to prove focus, keyboard, pointer, touch, overlay, motion, cancellation, and cleanup behavior. Forced state proves appearance only.

Do not build a generic test DSL or family-specific forced-state system.

## 10. Review and visual handoff

Perform the source-backed agent review defined by `autonomous-review.md`.

Confirm:

- architecture and ownership;
- Material 3 Expressive contract;
- native semantics and accessibility;
- state, lifecycle, and browser behavior;
- foundation dependencies;
- proportional proof;
- consumer migration and obsolete-path removal;
- rule coherence.

After all non-visual gates pass, prepare operator visual evidence when visible acceptance is required. The operator checks visible fidelity only.

The agent reports operator acceptance as `required` or `blocked`, never `accepted`.

## 11. Completion and continuation

Before completion:

- use `component-conversion-checklist.md`;
- run existing applicable focused checks and final repository verification;
- ensure code, contract, exports, consumers, applicable tests, stories, map, and directly affected records agree;
- ensure required operator visual acceptance is recorded;
- update the selected family to its terminal queue state.

After completion, select the next highest-priority ready family without creating another architecture-planning milestone.

Escalate only for a genuine product decision, materially unresolved official source, cross-project public-contract change, unsafe foundation blast radius, unresolved verification failure, or rejected operator visual evidence.