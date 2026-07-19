# Material 3 adoption plan

## Purpose

Build a canonical Material 3 Expressive UI library as an isolated shared subsystem under `src/shared/ui/material`.

The Material library is an implementation tool consumed by Mioframe. It is not the product, a product layer, or the unique goal of the repository.

The library must remain understandable, developable, testable, and reviewable through its own public contracts and Storybook surfaces without depending on Mioframe domain behavior or product composition.

The library is not:

- a general-purpose external UI framework;
- a complete clone of every published Material capability;
- an npm package maintained independently from this repository;
- an abstraction platform for hypothetical future components;
- a place for Mioframe domain, feature, routing, persistence, or screen-composition behavior;
- a documentation, audit, or validation system whose output is more important than working UI.

Material defines the visual and behavioral contract. The Web platform defines native semantics. Repository architecture defines the shared-library boundary, dependency direction, and public entry points. Product code consumes the library but does not become part of it.

## Isolation boundary

All canonical Material production ownership lives under `src/shared/ui/material`.

Library code may depend only on:

- Material-owned foundations, components, patterns, and local support code;
- Vue and browser platform contracts;
- explicitly generic low-level infrastructure from `shared/lib` when Material ownership would be incorrect.

Library code must not depend on:

- entities, features, widgets, pages, panes, app shells, routes, services, workers, or domain models;
- project-specific shared UI, product adapters, or screen-composition helpers;
- a product workflow, fixture, state store, or consumer implementation detail;
- private files of another Material family.

Product-specific wrappers, adapters, compositions, and usage policy stay outside the Material root. External consumers import only the curated Material public API.

Current product needs may determine which official Material surface is implemented first and which compatibility obligations a migration must satisfy. They must not introduce product semantics, domain-shaped props, hidden consumer state, or application ownership into the library contract.

## Development focus

Keep this order of authority and work:

```text
official Material evidence
→ isolated required foundation contracts
→ one component-family contract
→ canonical Storybook laboratory
→ complete vertical implementation slice
→ library-owned proof
→ complete family surface
→ external consumer migration and integration proof
→ old-owner removal
```

The center of library development is the rendered component and its accepted library contract. Documentation, stories, tests, audits, registries, automation, and product integration support that work; they do not replace it or define its internal ownership.

Use these boundaries:

- `foundation` owns only proven cross-family Material contracts;
- a component family owns its generic public API, native semantics, anatomy, states, component tokens, routing, rendering, and family-specific behavior;
- Material patterns exist only after repeated official composition proves a stable shared owner;
- project-specific shared UI and product layers own domain meaning, placement, workflows, adapters, and layout composition outside the library.

Do not move product behavior into Material, family behavior into foundation, or cross-family behavior into one component merely to remove duplication.

## Principle

Adopt Material incrementally through isolated component-family migrations and explicit foundation tasks.

Do not build a complete validation framework, exhaustive migration database, generic test DSL, broad runtime framework, or mass source-tree migration before real library work proves it necessary.

Every in-scope shared UI artifact must eventually reach one accepted terminal outcome:

- canonical official Material component, pattern, or foundation owner;
- explicitly retained project-specific or generic shared UI owner outside Material;
- removed or consolidated obsolete or duplicate owner.

The existing source hierarchy, ownership rules, component architecture, foundation architecture, testing policy, and operator visual acceptance remain authoritative in their owning documents. This plan owns the development sequence and isolation focus.

## Contract before production changes

Before editing a component family, resolve the smallest complete library contract required by the requested official surface:

1. official capability and non-goals;
2. supported and unsupported Material surface;
3. generic public API;
4. native HTML semantics and accessibility ownership;
5. anatomy and DOM ownership;
6. states, sources of truth, precedence, cancellation, and cleanup;
7. component tokens and final rendered-property owners;
8. applicable motion endpoints and Web adaptation;
9. required foundation dependencies and their current owners;
10. library-owned proof and external migration obligations.

Existing consumers may reveal required compatibility, unsupported usage, and migration scope. They do not define Material semantics or justify product-shaped library APIs.

Record the accepted contract in the family `README.md` using `component-architecture.md`. Every field must affect an implementation decision, a proof artifact, or an explicit unsupported capability. Do not add ceremonial documentation.

## Family development loop

Each family migration follows one practical loop:

1. inspect the current owner, public API, consumers, tests, stories, and known defects to identify migration obligations;
2. resolve the current official Material 3 Expressive contract and minimum complete supported surface;
3. audit only the foundation domains required by that surface;
4. create or update the compact isolated family contract before production edits;
5. prepare a canonical owner-local Storybook laboratory showing distinct visible routes and relevant edge cases without product fixtures;
6. implement one complete vertical slice first: native semantics, DOM, target area, default and interaction states, foundation routing, tokens, motion, accessibility, and real browser behavior;
7. prove the vertical slice entirely inside the library boundary;
8. expand variants, sizes, and optional supported routes only after the primary slice is coherent;
9. complete proportional library-owned proof at the lowest faithful layer;
10. migrate external consumers through the curated public API and add only integration proof for risks introduced by that migration;
11. remove obsolete owners, exports, compatibility paths, and duplicated product adapters;
12. complete independent evidence review and required operator visual acceptance;
13. record process lessons and add automation only when stable repeated evidence justifies it.

The default unit of work is one cohesive family end to end. Split work into separate PRs only when a broad foundation blast radius, reviewability, or a safe independently valid intermediate state requires it.

## Storybook role

Storybook is the primary isolated component development laboratory and the readable catalogue of accepted rendered library surfaces.

Storybook stories and fixtures for the Material library must remain owner-local and generic. They must not import product layers, domain fixtures, feature components, widgets, pages, or app shells.

For visible components provide:

- one canonical bounded example;
- only materially distinct variants and states;
- simultaneous states needed to prove precedence;
- relevant theme and background contexts;
- generic realistic content and supported boundary cases;
- real interaction fixtures for browser-owned behavior.

Do not create Cartesian prop matrices or screenshots that repeat equivalent output. Forced states may stabilize appearance but never prove interaction acquisition, release, cancellation, interruption, trajectory, or cleanup.

## Proof model

Use one primary proof owner for each contract:

- component contract tests: public API, native semantics, attributes, ARIA, controlled state, invalid combinations, and non-browser foundation wiring;
- browser behavior tests: real focus, keyboard, pointer/touch, ripple, expanded targets, motion lifecycle, cancellation, interruption, and cleanup;
- visual regression: protection of an already accepted rendered baseline;
- external integration proof: only compatibility and composition risks created when product or project-specific shared UI consumes the public library API;
- operator visual acceptance: perceived fidelity to the accepted Material reference after objective library gates close.

Product E2E or consumer tests do not prove internal Material semantics, token routing, browser lifecycle, or visual fidelity. Library tests do not prove product workflow correctness. Keep proof ownership separate.

Green tests prove only their owned contracts. They do not establish correspondence with current Material sources or replace visual review.

## Focus guard

Reject or simplify work when it:

- imports product or project-specific shared UI into the Material boundary;
- shapes a public component API around one Mioframe feature, domain record, route, pane, or workflow;
- uses a product consumer as the primary fixture or proof of library correctness;
- adds a validator, registry, manager, generic API, helper layer, or test framework before repeated real work proves the need;
- optimizes documents, audits, or agent reports while the rendered component remains defective;
- expands foundation for hypothetical reuse;
- implements all variants before one complete vertical slice works correctly;
- preserves an obsolete owner, permanent compatibility path, or parallel mechanism;
- delegates unresolved source, semantics, accessibility, ownership, lifecycle, or migration decisions to operator visual review;
- treats screenshots or forced states as proof of real interaction behavior;
- broadens a component migration into unrelated library or product cleanup.

If two correction rounds retain the same objective defect, add workarounds, or create new ownership ambiguity, stop patching and reconstruct the contract and implementation strategy.

## Phase 0: operating model

Status: complete.

The repository already provides:

- the canonical Material 3 Expressive source hierarchy;
- the `src/shared/ui/material` ownership target;
- component and foundation contracts;
- family-local documentation and testing ownership;
- proportional proof layers;
- independent agent review and operator-only visual acceptance;
- registries, inventory ownership, and migration-map ownership.

No additional validator or full-library inventory gate is required before implementation.

## Phase 1: first end-to-end pilot — `MDButton`

Use Button as the first pilot unless current consumer reach proves another family is materially more valuable. Consumer reach changes priority only; it does not change the isolated library architecture.

The pilot must validate the complete library development loop, not calibrate a documentation or audit framework. It includes:

- current implementation and migration-obligation audit;
- exact supported Material 3 Expressive surface;
- only foundation readiness work required by Button;
- canonical isolated Button family ownership;
- one complete primary vertical slice before family expansion;
- generic API, native semantics, accessibility, interaction, token, state, anatomy, DOM, motion, and rendered-property ownership;
- canonical owner-local Storybook laboratory and real interaction evidence;
- complete library-owned proof before product integration;
- external consumer migration through the public API;
- removal of obsolete Button owners and compatibility paths;
- proportional integration proof, independent review, and operator visual acceptance.

Focused prerequisite or foundation PRs are allowed only when they preserve a valid intermediate state and materially improve reviewability. They do not complete the pilot by themselves.

At the end of the pilot, record which rules were useful, which duplicated work, which foundation gaps were real, and which repeated defects justify a small precise guard.

## Phase 2: independent stateful pilot

Migrate a high-priority stateful family with a materially different interaction model. `MDSwitch` is the default candidate unless current evidence identifies a stronger alternative.

The second pilot must challenge the process with:

- controlled state without hidden copies;
- keyboard and pointer/touch behavior;
- cancellation and cleanup where applicable;
- disabled and presentation contracts;
- multiple anatomy or DOM owners;
- property-specific coexistence;
- focus, ripple, motion, shape, color, accessibility, and target-area dependencies;
- separation of stable visual-state evidence from real browser behavior;
- preservation of the isolated library boundary during external migration.

After two pilots, consolidate only workflow and automation that both migrations prove stable and valuable.

## Phase 3: sequential migration

After the pilots, maintain a short evidence-backed `P0`/`P1` queue rather than requiring exhaustive classification before useful work begins.

Select the highest-priority ready family whose dependencies are satisfied. Priority considers:

- consumer reach;
- critical repeated workflows;
- interaction frequency;
- Material and foundation leverage;
- current correctness and maintenance risk;
- dependency readiness;
- migration blast radius;
- removal or consolidation value.

Inventory work remains just in time. Fully inspect the selected family, keep directly affected records current, and progressively classify the rest without blocking high-value migrations.

## Rule refinement

Project rules are durable working contracts, not immutable assumptions.

When real implementation exposes an inaccurate, contradictory, incomplete, obsolete, or unnecessarily complex rule:

1. identify the concrete case and evidence;
2. identify the narrowest owning document or skill;
3. distinguish a rule defect from implementation non-compliance;
4. make the smallest artifact-independent correction;
5. update only directly affected owners;
6. resume implementation after the applicable rules are coherent.

Do not create component-specific exceptions, duplicate corrected rules, or broaden a correction into unrelated architecture work.

## Evidence-driven automation

Automation is a consequence of migration evidence, not a prerequisite.

Add a guard only when it protects a stable accepted contract, addresses a repeated or materially risky failure, has low false-positive risk, fits existing repository tooling, and costs less to maintain than the review burden it removes.

Do not automate semantic completeness, anatomy correctness, source interpretation, or visual fidelity through Markdown validators or generic rule engines.

## Program completion

The program is complete when every in-scope shared UI artifact has a terminal outcome and every Material-owned artifact has one canonical current owner inside the isolated library boundary.

Exhaustive inventory is a completion requirement, not a prerequisite for useful migrations. The program does not require implementing every optional component or capability published by Material.
