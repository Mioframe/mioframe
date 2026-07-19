---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family. Owns end-to-end execution after the family is resolved, while all Material-specific contracts and program facts remain under src/shared/ui/material.'
paths:
  - 'src/shared/ui/material/**'
---

# Material component authoring

Use this as the primary execution router for official public Material component work.

It applies to:

- a new public `MD*` component;
- migration of a legacy `MD*` family into `src/shared/ui/material`;
- Material 3 Expressive alignment of a canonical family;
- a material change to a migrated family's public contract or visible behavior.

It does not apply to project-specific shared UI or a strict legacy repair that truthfully records `Architecture impact: none`.

All Material-specific architecture, roadmap, source interpretation, registries, audits, authoring rules, testing policy, and review policy are owned under `src/shared/ui/material`. This skill must load and execute those owners rather than duplicate them.

## Companion instructions

Read and use:

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/README.md`;
- `src/shared/ui/material/docs/adoption-plan.md`;
- `src/shared/ui/material/docs/library-roadmap.md`;
- `src/shared/ui/material/docs/source-of-truth.md`;
- `src/shared/ui/material/docs/component-architecture.md`;
- `src/shared/ui/material/docs/component-testing.md`;
- `src/shared/ui/material/docs/autonomous-review.md`;
- `src/shared/ui/material/docs/audits/README.md` and the current family audit when one exists;
- `src/shared/ui/material/docs/ui-library-inventory.md` and registries for current status.

Use:

- `material3-guidelines` for current official sources and component choice;
- `material-foundation` only when a cross-family foundation contract changes;
- `vue-component-implementation` for Vue mechanics;
- `component-contract-testing`, `ui-browser-behavior`, and `visual-regression-testing` only for applicable proof layers;
- `verification` for focused and final repository checks.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

## 1. Select the family and change mode

Select one cohesive family from the explicit request, active roadmap, or highest-priority ready queue item.

Record one change mode:

- `new-component`;
- `end-to-end-migration`;
- `library-relocation-only`;
- `alignment-only`.

Use `end-to-end-migration` by default for sequential legacy migration. Split work only when a wider foundation blast radius, public compatibility decision, reviewability, or a safer independently valid intermediate state justifies it.

Do not mix unrelated families or broad shared cleanup.

## 2. Resolve sources, audit findings, and supported scope

1. Inspect the current family, public exports, direct consumers, owner-local stories, tests, known defects, and `src/shared/ui/material/docs/audits/<family-slug>.md` when present.
2. Compare audit metadata with the implementation ref and commit under work.
3. Resolve the current official Material 3 Expressive contract before preserving legacy structure.
4. Use the official Design Kit only for visual decisions unresolved by published guidance.
5. Define the minimum complete supported official surface.
6. Record unused official capability as unsupported.
7. Treat product consumers as compatibility evidence only; they do not define the internal library contract.
8. Add no Mioframe extension without an explicit requirement, generic contract, and owner outside product semantics.

When an audit exists:

- investigate every confirmed finding;
- resolve findings that remain valid;
- record evidence when a finding is obsolete or invalidated;
- do not treat the audit as Material authority;
- do not silently rewrite the audit during implementation;
- require a later `material-component-review` run to publish current compliance state.

An absent audit does not block authoring.

Stop only when a genuine product-scope, source, ownership, compatibility, or required foundation decision remains unresolved.

## 3. Validate and refine applicable rules

Before relying on rules:

1. identify applicable owners under `src/shared/ui/material`;
2. verify that they describe the real family and migration accurately;
3. distinguish a rule defect from agent non-compliance or an implementation defect;
4. when a rule is inaccurate, contradictory, incomplete, obsolete, or needlessly complex, identify concrete evidence and the narrowest owning file;
5. make the smallest correction supported by official sources and repository architecture;
6. update only directly affected owners inside the Material boundary;
7. continue after the rules are coherent.

Do not silently violate a rule, preserve it through a family-specific exception, duplicate a replacement outside the Material root, or delegate a resolvable technical inconsistency to operator visual review.

## 4. Complete the family contract

Before production edits, create or update the family `README.md` using `src/shared/ui/material/docs/component-architecture.md`.

Resolve the mandatory core:

- family and ownership;
- library scenarios and non-goals;
- official sources and snapshot;
- supported and unsupported surface;
- generic public API, native semantics, accessibility, and invalid combinations;
- anatomy and DOM ownership when applicable;
- state ownership, precedence, cancellation, and cleanup when applicable;
- token routes and final rendered-property owners when applicable;
- applicable foundation dependencies;
- production/public files and owner-local proof;
- external compatibility obligations;
- extensions or deviations;
- readiness and unresolved decisions.

Do not create ceremonial fields or speculative decisions.

## 5. Prepare the owner-local laboratory

Before broad family implementation:

- create or update a canonical bounded Storybook surface beside the Material owner;
- include only materially distinct visible routes and relevant edge cases;
- use generic content and fixtures without product imports;
- prepare real interaction fixtures for browser-owned behavior;
- do not use Cartesian prop matrices or forced states as substitutes for behavior proof.

The Storybook laboratory is a development surface and catalogue, not a product fixture.

## 6. Resolve foundation dependencies

For every applicable foundation domain:

1. identify the accepted owner and required capability;
2. reuse the accepted contract when sufficient;
3. name exact non-blocking gaps for partial or deviated status;
4. treat missing or blocked required capability as a blocker;
5. use `material-foundation` when the cross-family contract changes.

Use a focused foundation PR when its blast radius is materially wider than the family migration. Do not create a local substitute or parallel owner.

## 7. Implement one complete vertical slice

Before expanding variants, sizes, and optional routes, complete one primary slice containing all applicable:

- native element and semantics;
- public API and controlled state;
- anatomy and minimal DOM;
- geometry and target area;
- foundation wiring;
- token declaration, configuration routing, state resolution, and final rendering;
- default and interaction states;
- motion endpoints and reduced-motion behavior;
- accessibility;
- acquisition, release, cancellation, disabled, failure, and cleanup behavior;
- owner-local contract, browser, and visual proof.

Do not proceed to family-wide expansion while this slice remains objectively defective.

## 8. Expand the complete supported family

After the primary slice is coherent:

- implement remaining accepted variants, sizes, states, and supported routes;
- keep props, emits, slots, native elements, DOM-critical attributes, and events explicit;
- prefer native HTML activation, form, navigation, and accessibility semantics;
- keep controlled semantic state consumer-owned;
- limit transient state to gesture, overlay, animation, or native coordination owned by the component;
- use exact verified official tokens and the shortest property route;
- create separate files only when they materially improve clarity or focused verification;
- create no empty layers, universal bases, runtime registries, generic resolvers, CSS DSLs, cross-family state machines, broad option bags, or speculative extension points.

## 9. Build library-owned proof

Every new or migrated component requires component-contract tests.

Add applicable layers only:

- one stable canonical visual story for visible output;
- `StateMatrix` only for multiple distinct component-owned visual routes;
- bounded visual regression after the baseline is accepted;
- Storybook browser tests for real focus, keyboard, pointer/touch, ripple, motion, cancellation, interruption, overlay, and cleanup behavior;
- focused pure tests for extracted deterministic logic;
- foundation route proof where shared contracts changed.

Forced state proves appearance only. Screenshots protect an accepted baseline only. Neither proves real interaction behavior or Material fidelity by itself.

Complete library-owned proof before treating product integration as evidence of library correctness.

## 10. Migrate consumers and ownership

For an end-to-end migration:

1. expose the canonical family through its public API;
2. migrate every affected in-repository consumer and public export;
3. preserve accepted product behavior except for named deltas;
4. keep product adapters, composition, domain data, and workflow logic outside the Material root;
5. add integration proof only for risks introduced by the public API or migration;
6. remove obsolete files, legacy exports, tests, stories, and documentation;
7. allow temporary compatibility only when atomic migration is technically unsafe, with exact consumers, no new usage, and a removal target;
8. update only shared Material records whose owned facts changed.

Consumer tests prove external integration only; they do not prove internal Material semantics, routing, lifecycle, or fidelity.

Do not report a family migrated while an active obsolete owner or undocumented parallel path remains.

## 11. Review and visual handoff

Perform the source-backed agent review defined by `src/shared/ui/material/docs/autonomous-review.md`.

Confirm:

- complete ownership inside the Material boundary;
- current Material 3 Expressive contract;
- native semantics and accessibility;
- state, lifecycle, and browser behavior;
- foundation dependencies;
- proportional library-owned proof;
- external migration and obsolete-owner removal;
- rule coherence;
- every applicable audit finding resolved or evidence-backed as stale.

After non-visual gates pass, prepare operator visual evidence when visible acceptance is required. The operator checks visible fidelity only.

The agent reports operator acceptance as `required` or `blocked`, never `accepted` unless explicit acceptance is already recorded.

## 12. Completion and continuation

Before completion:

- use `src/shared/ui/material/docs/component-conversion-checklist.md`;
- run applicable focused checks and final repository verification;
- ensure code, contracts, exports, owner-local proof, consumers, maps, roadmap, inventory, and registries agree;
- summarize audit findings resolved or invalidated;
- state that any pre-existing audit is stale after implementation changes until review replaces it;
- ensure required operator visual acceptance is recorded;
- update the selected family to its terminal queue state;
- remove every obsolete Material owner outside the canonical boundary.

After completion, record the next highest-priority ready family without starting it in the same task.

Escalate only for a genuine product-scope decision, materially unresolved official source, cross-project public-contract change, unsafe foundation blast radius, unresolved verification failure, or rejected operator visual evidence.
