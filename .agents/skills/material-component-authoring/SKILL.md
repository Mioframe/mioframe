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
- `docs/material-3/audits/README.md` and the current family audit when one exists;
- `library-roadmap.md` and `ui-library-inventory.md` for active work and queue state.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

## 1. Select the family and change mode

Select one cohesive family from the active roadmap or highest-priority ready queue item.

Record one change mode:

- `new-component`;
- `end-to-end-migration`;
- `library-relocation-only`;
- `alignment-only`.

Resolve physical ownership before selecting the mode.

- `src/shared/ui/material/components/<family>` is the canonical owner for an official public component family.
- Any production implementation under an existing `src/shared/ui/<LegacyFamily>` directory remains a legacy owner even when it is the only implementation and already satisfies much of the Material contract.
- When a legacy owner exists, use `end-to-end-migration` by default. Do not downgrade to `alignment-only` because the legacy file is mature, because a previous PR was scoped narrowly, or because a prior audit called it canonical.
- Existing PR title, body, branch name, and historical task scope are context only. An explicit `material-component <family>` invocation requests the complete applicable migration. Expand the current PR or report one exact technical reason that a separate branch is required.

Use `end-to-end-migration` by default for sequential legacy migration. Split work only when a wider foundation blast radius, public compatibility decision, reviewability, or a safer independently valid intermediate state justifies it.

Do not mix unrelated families or broad shared cleanup.

## 2. Resolve sources, audit findings, and supported scope

1. Inspect the current family, public exports, direct consumers, stories, tests, known defects, and `docs/material-3/audits/<family-slug>.md` when present.
2. Compare any audit metadata with the implementation ref and commit under work.
3. Start from named scenarios and affected consumers.
4. Resolve the current official Material 3 Expressive contract.
5. Use the official Design Kit only for applicable visual decisions unresolved by published guidance.
6. Define the minimum complete supported surface.
7. Record unused official capability as unsupported.
8. Add no Mioframe extension without an explicit requirement and owner.

When a current or stale audit exists:

- investigate every confirmed finding;
- resolve findings that remain valid;
- record evidence when a finding is obsolete or invalidated by newer sources or implementation;
- do not treat the audit as Material authority;
- do not silently delete or rewrite the audit during implementation;
- require a final `material-component-review` run to publish the compliance state of the completed implementation commit.

An absent audit does not block authoring.

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

Before production edits, create or update:

```text
src/shared/ui/material/components/<family>/README.md
```

using `component-architecture.md`.

A README beside the legacy implementation does not satisfy this gate for an end-to-end migration. The contract must name both the current legacy owner and final canonical owner until migration completes.

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
- visual and motion evidence;
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

A component-level invocation must not silently ignore a required foundation defect. Either fix the shared owner through `material-foundation`, split it with an exact blocker and dependency, or report the family blocked. A public token or motion contract that reaches an intermediate variable but does not affect final rendered behavior is a defect, not merely an evidence gap.

## 6. Plan the end-to-end passes

Use a compact pass order without repeating the family contract:

1. source-backed contract and directly affected records;
2. required foundation work or accepted dependency wiring;
3. canonical production family and public export;
4. consumer migration;
5. proportional contract, browser, pure, consumer, visual, and motion proof;
6. obsolete-path removal;
7. agent evidence review and fresh final compliance audit;
8. operator visual package when required;
9. queue and roadmap update.

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

For official spring-driven motion, token names or endpoint geometry are not enough. The implementation must use the official spring model or a traceable Web adaptation whose derivation and observed trajectory are verified. An undocumented duration/easing approximation must not be described as Material-compliant spring motion.

## 8. Migrate consumers and ownership

For an end-to-end migration:

1. create the canonical family owner under `src/shared/ui/material/components/<family>`;
2. create or update the canonical Material root export;
3. migrate every affected in-repository consumer and public export;
4. preserve accepted product behavior except for named deltas;
5. remove obsolete component files and legacy exports;
6. allow a temporary compatibility path only when atomic migration is technically unsafe, with exact consumers, no new usage, and a removal target;
7. update only documents and records whose owned facts changed.

A sibling legacy directory may remain for other official families, but it must no longer own or export the migrated component.

Do not report a family migrated while an active obsolete owner, legacy public export, undocumented parallel path, or direct legacy consumer remains.

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

For visible interactive motion:

- run real acquisition and release input on the canonical story or product surface;
- inspect at least resting, onset, one meaningful intermediate sample, release, and settled state;
- verify actual property ownership, interruption, cancellation, and reduced-motion behavior;
- for spring-driven motion, prove the real trajectory or traceable Web approximation rather than only final values, CSS declarations, or transition metadata;
- fail the proof when the interaction visibly behaves incorrectly even if screenshots and endpoint assertions pass.

Do not build a generic test DSL or family-specific forced-state system.

## 10. Review and visual handoff

Perform the source-backed agent review defined by `autonomous-review.md`.

Confirm:

- architecture and physical ownership;
- Material 3 Expressive contract;
- native semantics and accessibility;
- state, lifecycle, browser behavior, and empirical interaction motion;
- foundation dependencies and final rendered property routes;
- proportional proof;
- consumer migration and obsolete-path removal;
- rule coherence;
- every applicable audit finding is resolved or evidence-backed as stale.

Do not accept existing tests as proof that they cover the right contract. Reproduce visible interactions yourself in a real browser. The operator must not be used to discover agent-owned motion, behavior, ownership, or token-routing defects.

After implementation and final repository verification, run `material-component-review <family>` against the final implementation commit. If the fresh audit reports a still-current critical, high, or required non-visual defect, continue the implementation loop. If it reports unavailable required evidence, report blocked. Do not complete with an audit that points to an earlier commit.

After all agent-owned gates pass, prepare operator visual evidence when visible acceptance is required. The operator checks final visible fidelity only.

The agent reports operator acceptance as `required` or `blocked`, never `accepted`.

## 11. Completion and continuation

Before completion:

- use `component-conversion-checklist.md`;
- run existing applicable focused checks and final repository verification;
- ensure code, canonical family contract, root export, consumers, applicable tests, stories, map, and directly affected records agree;
- ensure the final family audit records the final implementation commit and contains empirical interaction evidence when applicable;
- summarize audit findings resolved or invalidated;
- ensure required operator visual acceptance is recorded;
- update the selected family to its terminal queue state.

`complete` is forbidden while the component remains physically owned by a legacy path, the final audit is stale, real interaction motion is unreviewed, a required final rendered route is broken, or obsolete ownership remains.

After completion, select the next highest-priority ready family without starting another implementation cycle in the same PR.

Escalate only for a genuine product decision, materially unresolved official source, cross-project public-contract change, unsafe foundation blast radius, unresolved verification failure, unavailable required empirical evidence, or rejected operator visual evidence.
