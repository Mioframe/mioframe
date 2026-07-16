# Material 3 token and architecture validation

## Purpose

Validation prevents mechanical architecture drift and makes required review evidence explicit.

It must not pretend that automation can prove Material correctness, family rationale, scenario sufficiency, visual equivalence, or human review from free-form Markdown or screenshots.

Validation is split into three classes:

1. **static blocking** — deterministic repository facts;
2. **structured consistency** — required records and cross-file references;
3. **review blocking** — semantic and visual decisions requiring human or architect judgment.

The implemented validator should expose the class of every finding.

## Implementation status

This document describes the target validation-class model, not what is currently automated.

`scripts/materialStaticValidation.mjs` (the `material-static` verify step) implements only a minimal filesystem baseline: exact canonical placement of new official components (diff-aware), and empty canonical directories, placeholder files, and an empty root barrel. `.oxlintrc.json` enforces dependency-direction boundaries (Material must not import product layers, by alias or by relative path; generic `shared/lib` must not depend on Material; external consumers, including product-layer files, must use the Material public API) through ESLint/oxlint `no-restricted-imports`, proven by tests that execute the real lint path against fixtures rather than inspecting configuration JSON.

Everything else below — architecture profiles, exact production file sets, behavior helper structure, CSS route/state split, `StateMatrix` structure, story and visual-test ownership, migration completeness and legacy residue, and permanent public export structure — is not automated. It remains a **review-blocking** concern for the coding agent and human review until several real component migrations (starting with `MDButton` in M6) establish stable, repeated conventions worth encoding mechanically. Do not implement a check from this catalogue speculatively; add it only after repeated migrations demonstrate the invariant is stable and a meaningful risk of regression exists without automation.

## Canonical inputs

Use:

1. actual paths, imports, exports, CSS, Vue, TypeScript, build configuration, tests, and snapshots;
2. [Library architecture](./library-architecture.md) and the physical migration map;
3. [Component architecture](./component-architecture.md) and the canonical family blueprint;
4. [Foundation architecture](./foundation-architecture.md) and the foundation registry;
5. [Component testing architecture](./component-testing.md);
6. component registry and deviation records;
7. verified Material inventories and recorded source snapshots.

A task handoff is evidence for the current delta, not a durable validator source after merge.

Do not maintain a second handwritten runtime token, state, or component map solely for validation.

## Static blocking checks

These checks are deterministic and should be automated when practical.

### Library boundary

Block:

- a new public official `MD*` component outside `src/shared/ui/material/components/<family>`;
- a new Material-specific foundation owner outside `material/foundation/<domain>`;
- a Material pattern outside `material/patterns/<pattern>`;
- a project-specific component exported as an official Material component;
- a product-layer import inside the Material library;
- a foundation import from components or patterns;
- a cross-family private import;
- an internal library import from the root `@shared/ui/material` barrel;
- an external deep import into `.vue`, `.css`, private helpers, testing adapters, or another family;
- generic `shared/lib` importing the Material library or gaining component-family ownership;
- new Material ownership added to a legacy path;
- empty namespace directories, placeholder production layers, or speculative patterns.

Legacy owners remain advisory until their migration starts. New artifacts and active migrations are blocking immediately.

### Physical migration

Block:

- migration-map entries inconsistent with actual paths or exports;
- incomplete repository consumer-import migration;
- new use of a temporary compatibility export;
- obsolete files, tests, stories, snapshots, risk registrations, imports, or exports after migration;
- a root Material barrel created before a production artifact can be exported honestly;
- unrelated families or foundation domains moved in one focused migration;
- a relocation-only change that modifies API, token values, behavior, rendered output, or verification semantics without a stricter mode.

### Component profile and files

Read the selected profile from the canonical family blueprint.

- `simple`: require `.vue` and `.css`; reject `.routes.css` and `.states.css`.
- `configured`: require `.vue`, `.routes.css`, and `.css`; reject `.states.css`.
- `stateful`: require `.vue`, `.states.css`, and `.css`; reject `.routes.css`.
- `configured-stateful`: require `.vue`, `.routes.css`, `.states.css`, and `.css`.

For every profile:

- require component/family token files only when ownership is declared;
- reject empty token, route, or state files;
- verify exact applicable style order;
- reject undeclared production-file categories;
- treat Storybook fixtures and tests as non-production artifacts.

### Token vocabulary and ownership

Block:

- public `--md-*` names not present in the verified `md.ref`, `md.sys`, or `md.comp` inventory;
- invented, shortened, or normalized component-token names;
- project values under `--md-*`;
- raw Material values bypassing an available official token;
- deprecated compatibility tokens used by new code;
- duplicate canonical declarations;
- component tokens outside the owner named by the blueprint;
- component tokens in reference/system or foundation token owners;
- family token files without at least two declared public component consumers;
- family-private variables referenced outside the family;
- generic foundations reading family-specific tokens or variables.

### Token-file purity

In component/family token files reject:

- configuration selectors;
- semantic or interaction state selectors;
- pseudo-classes;
- rendering properties;
- private or app token declarations;
- tokens declared only for an active configuration/state.

### Layer boundaries

Block detectable violations:

- token declarations or inline component CSS in Vue;
- configuration route variables outside `.routes.css`;
- state source selection outside `.states.css`;
- rendering properties outside `.css` or approved family anatomy CSS;
- configuration selectors in state/rendering layers;
- state selectors in token/route/rendering layers;
- actual properties applied by a DOM owner that contradicts the structured owner reference;
- route variables when no configuration axis exists;
- private aliases used only to rename a directly usable canonical token or route;
- stateful final values assigned outside `.states.css`.

### Foundation registration and imports

Block:

- a public foundation token, utility, primitive, bridge, or verification adapter without a registry record and owner contract;
- a registry owner path that does not exist;
- a public export disagreeing with the registry contract;
- family-specific names or variables inside generic foundation code;
- duplicate theme, unit, state, ripple, focus, typography, motion, icon, or overlay owners;
- product imports of foundation testing adapters;
- parallel active legacy/canonical production owners without a temporary migration contract.

### Test-profile artifacts

For every new or migrated public Material component, block:

- missing colocated `<Component>.test.ts` using `@vue/test-utils`;
- component tests containing visual/computed-style assertions;
- missing or duplicate Storybook export named `StateMatrix`;
- missing canonical root anchor or checkerboard class;
- missing state-matrix coverage table section in the family blueprint;
- missing Playwright visual spec for the canonical story;
- one visual snapshot per matrix cell instead of bounded matrix/section screenshots;
- behavior specs using forced visual-state providers as behavior proof;
- browser-owned behavior without a behavior spec or explicit `not applicable` record;
- extracted pure behavior without focused tests;
- test-only public props, events, classes, or production branches;
- a family-local forced-state provider;
- stale visual/storybook risk registration after migration;
- an automated report claiming human visual review passed.

## Structured-consistency checks

These checks validate presence and references, not semantic correctness.

### Canonical family blueprint

Require the complete schema from `component-architecture.md` and reject:

- missing required sections;
- `Readiness: ready` with unresolved placeholders;
- unknown enum values for authoring mode, profile, migration status, foundation status, or foundation change mode;
- references to nonexistent files, story ids, exports, snapshots, registry records, or consumer paths;
- production/test files omitted from the blueprint;
- library map, component registry, foundation registry, public exports, Storybook paths, tests, snapshots, or risk registration disagreeing with recorded paths/statuses.

Do not parse prose to decide whether a design is correct. Check only required headings, machine-stable values, and references.

### Foundation registry

Require every record to contain:

```text
Status
Official sources
Verified snapshot
Current production owner
Canonical library owner
Migration status
Public contract
Private bridge contract
Verification-only contract
Known consumers
Known gaps
Verification
Last reviewed
```

Block:

- `verified` without a concrete snapshot and named verification;
- `missing` or `blocked` used as a non-blocking component dependency;
- unknown status or change-mode values;
- stale current/canonical owner references after migration;
- a record changed without an updated review date.

For legacy `partial` records, accept the explicit snapshot value `not yet recorded — legacy owner`.

### Component foundation dependencies

Validate enum and reference consistency:

```text
Registry status:
missing | partial | verified | deviated | blocked

Change in this PR:
none | library-relocation-only | additive | correction | replacement | refresh
```

Block component readiness when any dependency is `missing` or `blocked`.

### State-matrix structural consistency

Automation may check:

- the coverage table exists;
- every row has a visible matrix location reference;
- referenced visible headings/sections exist in the story fixture;
- the visual spec targets the canonical root/sections;
- stable story id and snapshot names agree.

Automation must not decide whether all visual routes were identified or grouped correctly.

## Review-blocking checks

These findings require human or architect review. They may be produced as checklist items or review evidence requirements, not as claims of automated proof.

### Architecture and scope

Review confirms:

- family ownership basis is valid;
- supported surface is the minimum complete surface for required scenarios;
- optional capabilities and extensions are justified;
- product behavior has not moved into component/foundation ownership;
- foundation additions reduce total complexity and remain generic;
- compatibility and migration decisions are proportionate;
- no simpler architecture satisfies the same requirements.

### Material correctness

Review confirms:

- official pages and snapshots resolve the implementation;
- Design Kit evidence is used when exact visual guidance is otherwise unavailable;
- token meaning, native semantics, accessibility, anatomy, and usage are interpreted correctly;
- deviations are explicit and justified;
- unsupported behavior is not presented as aligned.

### State and property routing

Review confirms:

- every varying rendered property has the correct owner and route;
- winner/coexistence rules are correct;
- grouped rendered-property rows are truly equivalent;
- semantic state is not inferred from visual state;
- transient state lifecycle and cleanup are complete.

### State matrix and visual review

Review confirms:

- every distinct supported component-owned visual route is represented;
- non-visual states are not duplicated as meaningless cells;
- grouped matrix routes are visually equivalent;
- rows/columns/sections are readable and correctly labelled;
- visual sources are sufficient;
- initial/changed baselines match Material or an accepted deviation;
- human review status and persisted review metadata are truthful.

### Verification proportionality

Review confirms:

- component tests do not duplicate browser/framework behavior;
- browser tests cover real acquisition/cancellation/cleanup where needed;
- foundation corrections verify representative consumers for every distinct path;
- no broad test DSL or fixture abstraction was introduced without repeated need.

## Enforcement levels

- `legacy advisory`: reports existing legacy drift without blocking strict local repairs;
- `library authoring blocking`: blocks new Material artifacts and active migrations;
- `foundation authoring blocking`: blocks accepted foundation additions/corrections/replacements;
- `component authoring blocking`: blocks new components and active migrations, including the standard test profile;
- `layered-v1 blocking`: blocks later changes to accepted migrated components;
- `verified foundation blocking`: blocks later changes to a verified foundation contract;
- `review blocking`: blocks merge until required architecture, Material, or visual review evidence is accepted.

A missing validator rule may be recorded as an explicit verification gap during rollout, but the affected artifact must not be described as mechanically protected until the rule exists.

## Rollout

1. Implement the minimal filesystem library-boundary baseline and ESLint/oxlint dependency-direction rules for new work — done (PR 151).
2. Migrate `MDButton` and `MDSwitch` under the minimal baseline, without inventing component-specific validator exceptions.
3. Only after those migrations show a repeated, stable, high-risk pattern, add the specific static or structured check that pattern justifies — standard-test-profile, blueprint/registry reference, or otherwise. Do not implement the full catalogue speculatively ahead of that evidence.
4. Add review checklists/evidence fields for semantic decisions rather than encoding them in a Markdown parser.
5. Introduce shared validator or Storybook helpers only after multiple migrations prove the same concrete need.

## Material PR report

Report:

- authoring/foundation/migration mode and source snapshot;
- current and canonical owners;
- required scenarios, supported surface, and non-goals;
- foundation dependencies and affected registry records;
- architecture profile and exact production layers;
- token classification and ownership;
- public export and consumer migration;
- standard test artifacts and state-matrix coverage;
- static/structured validator results;
- required architecture/Material/visual review status;
- removed legacy paths, deviations, and remaining gaps.
