---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Material component as a demand-driven Material-first Vue MD* API backed privately by @m3e/web.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/ui/**/MD*.vue'
---

# Material component adapter

Implement one explicitly selected official Material component end to end through the Material → Vue → m3e boundary.

## Read first

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- the selected family README;
- applicable parent `AGENTS.md` files.

A component name is sufficient input. For M1, work on `MDButton` only.

## Core rule

The public `MD*` API is a demand-driven subset of official Material, expressed idiomatically in Vue. It is not derived from the legacy Mioframe API or copied from m3e.

Current consumers determine what is required now. Official Material determines how that requirement is named, modeled, constrained, and expected to behave. m3e determines only how much of the selected Material contract can be delegated to the private renderer.

## 1. Resolve the official Material contract

Inspect the relevant official Material documentation for:

- component and family naming;
- variants, configurations, sizes, shapes, content roles, and states;
- option values and defaults;
- valid and invalid combinations;
- interaction and controlled-state behavior;
- native and accessibility semantics;
- relevant tokens, visuals, and motion.

Do not copy the entire documentation. Capture enough exact source-backed structure to define the current public API without future naming drift.

## 2. Select the required subset

Inspect current consumers, legacy API, stories, tests, and product scenarios.

For each Material capability classify:

- `implement-now` — needed by a current consumer or necessary for a coherent selected API;
- `defer` — official Material capability not needed now;
- `not-material` — current or legacy requirement with no official Material source.

Legacy source and m3e capabilities are evidence, not public API authority.

## 3. Create the Material–m3e–Vue matrix

Before production edits, update the family README with:

| Material contract and source | Required now and evidence | Public Vue representation | m3e exact-version support | Owner | Decision | Verification |
| --- | --- | --- | --- | --- | --- | --- |

Cover every public prop, value, default, slot, event, `v-model`, native mapping, selected token, and materially relevant state included in the target scope.

Use m3e support statuses:

- `direct`;
- `partial`;
- `missing`;
- `divergent`;
- `not-applicable`.

Use decisions:

- `implement-now`;
- `defer`;
- `wrapper-correction`;
- `m3e-fix`;
- `blocked`.

No production API mapping may exist without a matrix row.

## 4. Resolve non-Material requirements

For every `not-material` requirement record one decision:

- `consumer-composition`;
- `separate-non-md-component`;
- `approved-md-extension`;
- `remove-or-migrate`;
- `unresolved`.

Do not silently preserve a legacy extension in `MD*`. `approved-md-extension` requires an explicit architecture decision. The default is consumer composition or a separate shared component without the `MD` prefix.

If a current consumer depends on an unresolved non-Material capability, stop only that API finalization and report the exact decision required. Continue all unrelated repository-local analysis and corrections that remain valid.

## 5. Inspect the exact m3e contract

Inspect the exact lockfile-resolved stable family entry point:

- package range and resolved version;
- exports and family registration entry;
- element class and value types;
- declarations, tag map, manifest, documented properties, attributes, events, slots, native behavior, accessibility, and CSS inputs;
- implementation source only where renderer-owned behavior such as geometry, accessibility, or motion must be assessed.

Do not use another version, prerelease behavior, private shadow DOM, copied internals, or undocumented APIs.

## 6. Assign implementation ownership

Use m3e maximally for every selected Material capability it supports directly.

### Vue adapter ownership

- Material-to-Vue names and values;
- typed property and attribute mapping;
- slots and event normalization;
- controlled-state synchronization;
- native form, link, keyboard, and focus integration;
- narrow light-DOM composition;
- selected public Material token mapping.

### m3e ownership

- renderer geometry and internal layout;
- private DOM;
- state layer, ripple, focus treatment, elevation, and motion;
- private accessibility behavior;
- renderer-owned Material states and visual transitions.

Use `wrapper-correction` only when the missing selected Material behavior can be added through documented m3e APIs or Mioframe-owned light DOM without recreating renderer internals.

Use `m3e-fix` when the gap belongs inside the renderer. Do not build a parallel renderer in Vue.

Use `blocked` only when the selected Material capability cannot be delivered safely by either owner. Deferred capabilities are never blockers.

## 7. Define the public Vue API

- Use official Material terminology and semantics.
- Use Vue props, slots, emits, `v-model`, refs, and native mappings idiomatically.
- Keep public types authored from the selected Material contract.
- Keep defaults and invalid combinations aligned with Material.
- Do not expose raw m3e vocabulary or types.
- Do not retain legacy names that conflict with Material.
- Do not add non-Material options without the resolved extension decision.

## 8. Implement the adapter

- Import only the required m3e family entry point.
- Derive private renderer types from package exports.
- Require mapper outputs to satisfy exact m3e types.
- Keep Vue ambient declarations to package-derived framework glue.
- Implement only matrix-approved public API and corrections.
- Keep m3e implementation details private.

Do not add Lit directly, access private shadow DOM, copy internals, duplicate renderer interaction systems, or create a generic adapter framework.

## 9. Tokens

- Public token names and semantics must follow verified official Material paths.
- Expose only the selected token subset required now.
- Map selected Material tokens to documented semantic m3e inputs.
- Do not mirror all m3e variables.
- Non-Material styling hooks require the same extension decision as non-Material props.

## 10. Migrate consumers

Migrate consumers to the selected Material Vue API, not merely to a new import path.

- Rename or normalize legacy props and values that conflict with Material.
- Move non-Material behavior to its decided owner.
- Remove obsolete target ownership only after every current scenario has a valid destination.
- Leave unrelated components unchanged.

## 11. Verify

Required baseline:

- package-derived type-check;
- component-contract tests for Material public names, values, defaults, invalid combinations, slots, events, controlled state, and wrapper-owned behavior;
- focused browser tests for current user/native scenarios affected by the adapter;
- meaningful visual baselines for selected stable Material states;
- final `pnpm verify`.

Do not duplicate m3e or Lit tests. Direct delegation does not require one test per renderer capability.

### Renderer-owned animation

- Inspect exact installed source and record relevant state, interruption, and reduced-motion paths.
- Confirm the adapter does not disable, replace, or duplicate it.
- Require operator manual testing for visual quality and timing.
- Do not use `:active`, screenshots, or private DOM tests as proof of internal animation.

## 12. Completion

A target may be `migrated` when:

- the Material–m3e–Vue matrix is accepted;
- public API is a selected official Material subset expressed in Vue;
- every public capability has a Material source or an explicitly approved extension;
- selected gaps are implemented by the correct owner;
- deferred Material surface and m3e divergences are recorded;
- consumers use the canonical API and obsolete ownership is removed;
- relevant verification passes;
- operator accepts final visual and motion behavior.

Complete all repository-local work inside the resolved scope. `partial` is valid only for an explicit architecture decision, required m3e change, operator acceptance, or genuine external blocker.

## Report

```text
MATERIAL ADAPTER RESULT
Material component:
Migration target:
Material sources:
Selected Material surface:
Deferred Material surface:
Non-Material requirements and decisions:
Public Vue API:
Renderer package, resolved version, entry point, and type source:
Material–m3e–Vue matrix status:
m3e direct coverage:
Wrapper corrections:
m3e fixes required:
Confirmed divergences:
Consumers migrated:
Automated verification:
Operator visual and motion acceptance: accepted | required | blocked
Implementation ownership: legacy | migrating | migrated
Status: complete | partial (<exact decision/external remainder>) | blocked (<exact selected Material capability>)
```