---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Mioframe Material component or inseparable family as a stable Vue MD* API backed privately by @m3e/web.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/ui/**/MD*.vue'
---

# Material component adapter

Implement one explicitly selected public Material component end to end through the Mioframe Vue-to-m3e boundary.

## Canonical rules

Read first:

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- the selected family README;
- applicable parent `AGENTS.md` files.

Normal ownership:

```text
product consumers
  → public Mioframe Vue MD* component
  → private documented @m3e/web custom element
```

Use `architect-handoff` only when the task changes cross-family ownership, renderer strategy, global theme ownership, or another unresolved architecture decision.

## Scope

A component name is sufficient input.

The supported surface is the minimum complete union of:

1. current Mioframe consumer scenarios;
2. documented m3e capabilities that map directly to the canonical Material/Vue component without custom renderer reconstruction.

Do not expand the task to:

- optional Material capabilities unsupported by both Mioframe and m3e;
- every raw m3e property, event, slot, or CSS variable;
- a complete Material component-token catalogue;
- unrelated components or general shared UI cleanup.

For M1, migrate `MDButton` only. Leave `MDIconButton`, `MDFab`, and `MDExtendedFab unchanged.

## 1. Resolve current scenarios and ownership

Inspect:

- current production implementation and public exports;
- direct consumers;
- props, emits, slots, native behavior, controlled state, and project extensions;
- stable visible behavior that current consumers depend on;
- stories, tests, known defects, family README, and roadmap.

Record:

- migration target;
- current and canonical owner;
- affected consumers;
- required current scenarios;
- m3e capabilities selected for the canonical public API;
- non-goals;
- change mode: `new-adapter`, `end-to-end-migration`, or `adapter-change`;
- ownership: `legacy`, `migrating`, or `migrated`.

Preserve current Mioframe behavior unless an explicit product decision approves a change.

## 2. Resolve Material requirements

Use the configured `material3` MCP and validated cache snapshot.

Inspect only the official guidance relevant to:

- current Mioframe scenarios;
- the selected documented m3e surface;
- accessibility, state, visual, and interaction requirements needed to judge m3e conformance.

Do not reproduce the complete Material documentation or audit unrelated optional surface.

## 3. Inspect the exact m3e contract

Inspect the exact lockfile-resolved stable m3e version through primary package evidence:

- package version, exports, and peer requirements;
- family entry point;
- exported element class and value types;
- declarations, `HTMLElementTagNameMap`, and Custom Elements Manifest;
- documented properties, attributes, events, slots, native behavior, accessibility, and CSS variables;
- implementation source only where necessary to assess renderer-owned behavior such as animation.

Record the package range, exact version, entry point, and exported types in the family README.

Do not use another version's examples, prereleases, private shadow DOM, copied internals, or undocumented APIs.

## 4. Compare m3e with Material

Compare only the supported surface.

For each confirmed difference, record:

| Material expectation | m3e behavior    | Required by Mioframe | Decision                                                   |
| -------------------- | --------------- | -------------------- | ---------------------------------------------------------- |
| expected behavior    | actual behavior | yes or no            | accept, wrapper correction, upstream follow-up, or blocker |

Classify differences:

- **not required by Mioframe** — record for possible m3e improvement and continue without wrapper work;
- **required and thinly correctable** — implement the smallest explicit correction through documented m3e APIs or Mioframe-owned light DOM;
- **required but not safely correctable** — set `blocked-upstream` and retain legacy ownership.

Equivalent observable behavior implemented through another internal mechanism is not a divergence.

## 5. Decide renderer viability

Use:

- `unassessed` — the exact required contract is not verified;
- `ready` — current scenarios and selected m3e surface can be delivered through documented public APIs and a thin adapter;
- `blocked-upstream` — a Mioframe-required behavior is missing or defective and cannot be safely corrected in the wrapper.

Do not block migration because m3e lacks an unused Material capability, legacy tuning parameter, or internal implementation detail.

## 6. Complete the family contract

Update `src/shared/ui/material/components/<family>/README.md` with only implementation-relevant decisions:

- supported current scenarios and selected m3e surface;
- public Vue API and renderer mapping;
- renderer package, entry point, and package-derived typing;
- controlled-state and native semantics;
- project extensions;
- active public token contracts, if any;
- confirmed m3e divergences and decisions;
- required verification;
- unresolved blockers.

Do not mechanically copy the whole m3e or Material API.

## 7. Implement dependency, typing, and registration

- Import only the required `@m3e/web/<family>` entry point.
- Use type-only imports for exported renderer element and value types.
- Keep Mioframe props independently defined, but require mapped values to satisfy m3e types.
- Vue ambient declarations may contain only framework glue derived from package types.
- Do not add a direct Lit dependency, all-components import, runtime registry, multiple-version support, or handwritten renderer type mirror.

## 8. Implement the thin adapter

Normally implement only:

- explicit typed property and attribute bindings;
- slot placement;
- event normalization;
- controlled-state synchronization;
- required native integration;
- current Mioframe extensions;
- narrow corrections for Mioframe-required m3e divergences;
- active public token mapping only when Mioframe actually exposes that token.

Do not duplicate m3e ripple, focus, state-layer, elevation, or motion systems. Do not add a generic adapter framework.

## 9. Tokens

Follow `component-tokens.md`.

- Preserve tokens only when repository evidence or intentional Mioframe documentation makes them active public contracts.
- A documented `--m3e-*` variable does not require a public `--md-comp-*` mirror.
- Prefer existing `--md-sys-*` roles when m3e already implements the correct Material semantics.
- Remove unused declaration-only and test-only legacy token routes.
- Do not complete or verify a full unused token matrix.

## 10. Migrate consumers and remove obsolete ownership

For an end-to-end migration:

- create the canonical adapter;
- migrate all target consumers and exports;
- preserve required current scenarios;
- remove the obsolete target implementation and target-exclusive compatibility paths;
- leave unrelated family components and shared modules intact.

## 11. Verify Mioframe-owned contracts

Required baseline:

- package-derived type-check;
- colocated component-contract tests for Vue API, mapping, extensions, and controlled state;
- focused browser tests for current user/native behavior changed or constrained by the adapter;
- stable visual baselines only for Mioframe-visible states with meaningful regression risk;
- final `pnpm verify`.

Add representative-consumer or dedicated build proof only when the migration changes that boundary and final verification does not already cover it.

Do not require dedicated theme, RTL, token, or optional m3e capability tests unless Mioframe customizes them or a current scenario depends on them.

### Renderer-owned animation

Animation quality cannot be proven through proxy host assertions when the effect is inside private renderer DOM.

For m3e-owned animation:

1. inspect the exact installed source and record the relevant implementation path, state transitions, interruption handling, and reduced-motion branch;
2. verify the adapter does not override or disable that implementation;
3. require operator manual testing for actual visual behavior and timing;
4. do not use `:active`, screenshots, or private DOM inspection as false automated proof of the animation itself.

Automated browser tests may verify public input acquisition when that is a Mioframe scenario, but must describe only what they actually prove.

## 12. Completion

A target may be `migrated` when:

- renderer viability is `ready` for the resolved supported surface;
- one canonical Vue owner remains and consumers are migrated;
- package-derived renderer typing is used;
- current Mioframe scenarios and extensions are preserved;
- required m3e divergences are recorded and required thin corrections are complete;
- only active accepted public tokens are retained;
- risk-based automated verification passes;
- operator accepts the first canonical visual result and renderer-owned motion where applicable.

Do not keep implementation ownership `migrating` merely because optional Material or m3e surface lacks exhaustive tests.

A run must complete all repository-local work inside the resolved scope. It must not invent new scope to avoid finishing. `partial` is valid when implementation and automated verification are complete and only operator acceptance or a genuine external blocker remains.

## Completion report

```text
MATERIAL ADAPTER RESULT
Family:
Migration target:
Change mode:
Renderer package range, resolved version, and entry point:
Renderer type source:
Renderer viability: unassessed | ready | blocked-upstream
Implementation ownership: legacy | migrating | migrated
Current Mioframe scenarios:
Selected m3e surface:
Public Vue API:
Confirmed m3e divergences: none | <summary and decisions>
Wrapper corrections: none | <summary>
Active public tokens: none | <summary>
Consumers migrated:
Legacy target removal: complete | not applicable | blocked
Automated verification:
Operator visual and motion acceptance: accepted | required | blocked
Status: complete | partial (<operator/external remainder>) | blocked (<exact reason>)
```
