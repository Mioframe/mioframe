# Material component adapter contract

This document defines the minimum accepted contract for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named official Material component and any directly required official Material dependency adapters needed to deliver its selected consumer scenarios.

```text
current product requirement
  → selected official Material and related-component contracts
  → canonical dependency MD* adapters
  → selected parent Vue API and composition
  → exact-version m3e mappings inside each owner
  → consumer migration and verification
```

Do not derive public `MD*` API from legacy Mioframe or m3e.

## Material-first scope

1. Inspect official overview, specs, guidelines, and accessibility pages.
2. Follow related-component placement and composition references.
3. Identify every official Material component participating in the selected scenarios.
4. Implement or complete each required dependency as its own canonical demand-scoped `MD*` adapter.
5. Select only current demand plus the minimum adjacent surface required for a coherent API.
6. Mark other official surface `deferred`.
7. Classify a requirement `not-material` only after selected and related component sources have been checked.

A partial official surface is acceptable. A renderer-shaped public API or hidden cross-component implementation is not.

## Evidence rules

- Official prose, normative tables, captions, and diagrams may establish capabilities and supported combinations.
- Token tables establish token paths and values, not the complete capability matrix.
- Absence from one page, token family, m3e, legacy code, or tests is not evidence of prohibition.
- Negative and restrictive decisions require positive official evidence.
- If official sources conflict, record `source-conflict`; do not invent a narrower rule.
- Cross-family composition mappings must distinguish parent tokens from dependency constraints. A parent icon token is not automatically an official dependency component size.

## Official Material dependencies

An official Material component remains independently owned even when used only inside another component.

Required sequence:

1. identify it in the parent matrix;
2. create or complete its canonical demand-scoped `MD*` adapter;
3. give it its own official-source review, matrix, public Vue API, root export, renderer typing, accessibility contract, presentation boundary, divergences, tests, stories, visual proof, and operator review where applicable;
4. compose it through the dependency public Vue API;
5. keep raw renderer imports, private renderer inputs, geometry normalization, accessibility implementation, and motion assessment inside the dependency adapter.

A parent may directly use raw m3e only for its own renderer family and non-catalog renderer-internal primitives.

Example:

```text
MDButton.loading
  → MDLoadingIndicator
      → m3e-loading-indicator
```

The parent owns composition meaning, placement, and state handoff. The dependency adapter owns its Material semantics and private renderer integration.

## Required family matrix

Before production edits, the parent and every dependency family README must contain:

| Material contract and exact source | Required now and evidence | Public Vue representation | m3e exact-version support | Owner | Decision | Verification |
| ---------------------------------- | ------------------------- | ------------------------- | ------------------------- | ----- | -------- | ------------ |

Each relevant row identifies:

- exact official source and selected scenario;
- public Vue prop/value/default/slot/emit/native mapping/token/composition;
- exact m3e entry point and documented or inspected mapping;
- renderer status;
- implementation owner and decision;
- required proof.

Renderer statuses:

- `direct` — documented m3e API implements the selected contract;
- `partial` — m3e provides a usable base but another owner completes the contract;
- `missing` — no documented implementation exists;
- `divergent` — documented or inspected m3e behavior differs observably;
- `not-applicable` — no renderer mapping is required.

Decisions:

- `implement-now`;
- `defer`;
- `wrapper-correction`;
- `temporary-renderer-workaround`;
- `m3e-fix`;
- `blocked`;
- `source-conflict`.

For every dependency, the parent matrix also records adapter path, root export, status, public API used, exact handoff, and proof required before parent completion.

## Public Vue API

The public API uses official Material terminology and Vue mechanics.

Allowed:

- props for selected Material options, states, and documented compositions;
- slots for Material content roles;
- emits or `v-model` for controlled intent;
- refs and current required native mappings.

Forbidden by default:

- renderer vocabulary exposed merely because m3e supports it;
- conflicting legacy names or hidden project extensions;
- unused native/link/form surface for hypothetical completeness;
- public dependence on renderer classes or private renderer inputs.

If the API permits states simultaneously, their precedence and restoration behavior must be defined and verified. “Current consumers do not combine them” is not an invalid-combination contract.

A parent action label is not automatically an adequate accessible purpose label for a composed progress component. The matrix must explicitly justify that semantic handoff for the selected scenario, or the parent must expose the smallest demand-scoped separate loading-purpose API and migrate current consumers.

## Gap ownership

### Parent adapter

Owns parent naming, composition state and placement, slots/events, controlled state, current native integration, and parent-to-dependency public handoff.

### Canonical owning adapter

Owns its renderer import and typed mapping, public accessibility/native semantics, presentation boundary, geometry normalization, wrapper-owned behavior, divergence records, tests, stories, visual proof, and root export.

### m3e

Owns private DOM, internal layout, state layer, ripple, focus treatment, elevation, motion, private accessibility behavior, and renderer-owned visual transitions.

Do not copy renderer internals, build a second renderer, or duplicate one workaround in several parents.

## Controlled exact-version renderer workaround

Documented m3e APIs remain preferred. A confirmed renderer defect does not have to block current Mioframe delivery when a narrow owning-adapter workaround is safe.

A `temporary-renderer-workaround` is accepted only when:

1. the selected current Material scenario requires the behavior;
2. documented m3e API is missing, broken, or observably divergent;
3. exact lockfile-resolved source confirms a host-level property, attribute, or CSS custom property that produces the required observable result;
4. the workaround exists only inside the canonical owning adapter;
5. it does not access private DOM/methods or recreate interaction, accessibility, state, geometry engine, or motion systems;
6. it does not leak to public Vue API, parent adapters, or consumers;
7. the matrix records renderer status `divergent`, current decision `temporary-renderer-workaround`, long-term owner `m3e-fix`, exact package version, risk, and removal trigger;
8. focused tests cover the observable behavior;
9. every dependency version update revalidates or removes it.

A workaround meeting this gate is tracked technical debt, not a blocker. Undocumented renderer usage without this gate is forbidden.

## Renderer typing boundary

- Import exact exported element classes and value aliases with type-only imports.
- Derive Vue custom-element glue from the element class or `HTMLElementTagNameMap`.
- Handwritten `new () => HTMLElement` glue is not package-derived.
- There is no exemption merely because no current public prop maps to a typed renderer property.
- Keep public Material types independent and constrain private mapping with exact package types.
- Keep renderer declaration glue with its canonical adapter.

## Tokens and presentation

- Public token names follow verified official Material paths.
- Expose only current selected token surface.
- Prefer documented semantic m3e inputs.
- A private undocumented host input may be used only through the controlled workaround gate above.
- Do not mirror every m3e variable.
- Parents use dependency props, slots, inherited color, or official public `--md-comp-*` tokens.
- Parents must not set dependency-private `--m3e-*` variables.
- When parent geometry and dependency limits conflict, record an explicit composition decision or source conflict. Do not claim a parent token is the dependency's official value.

## Accessibility and native behavior

- Put ARIA/native state/focus/interaction semantics on the actual owner.
- Preserve normal native event propagation unless an accepted contract requires interception.
- DOM attribute assertions alone do not prove custom-element accessibility.
- Browser proof must resolve the required role and accessible name from actual rendered semantics.
- For a progress component inside an interactive component, verify both owners in the browser accessibility tree or record an explicit accepted alternative.

## Verification

For each parent and dependency adapter require:

- package-derived type-check;
- colocated contract tests for selected API and adapter-owned mappings;
- browser tests for current native and accessibility scenarios;
- meaningful independent stories for selected presentation states;
- executable visual-regression proof through the repository visual runner when the adapter owns stable visible geometry or presentation;
- exact-version divergence and reduced-motion assessment;
- operator visual and motion review where applicable.

A Storybook story, a `visual` tag, or a behavior/accessibility test is not visual-regression proof. Accepted automated visual proof requires a visual-runner test that captures the owned surface (currently Playwright `toHaveScreenshot`) and a committed baseline for every claimed stable case.

For each composition require:

- parent renders the dependency adapter, not raw dependency m3e;
- exact state, label, accessibility, size, color/token, disabled, and slot handoff;
- coverage of every production-representable selected-state interaction, including disabled plus loading and selected plus loading when the API permits them;
- restoration after transient composition state;
- normal event bubbling;
- final `pnpm verify`.

A parent screenshot does not substitute for dependency-owned visual-regression proof. Do not duplicate m3e or Lit internal tests.

## Completion gate

A target completes only when:

- its matrix is accepted;
- public API is the selected official Material subset;
- all public combinations and handoffs are resolved;
- every required dependency has an accepted canonical adapter and root public export;
- renderer glue is genuinely package-derived;
- browser accessibility semantics are proven where required;
- required visual-regression specs and baselines exist for every claimed stable visual surface;
- selected gaps have the correct owner;
- divergences and temporary workarounds have exact versions, risks, tests, and removal triggers;
- consumers use canonical APIs and obsolete ownership is removed;
- final verification passes;
- operator accepts required visual and motion behavior.

README and roadmap statements must map to exact existing implementation, tests, stories, baselines, or review evidence. Green CI alone is not architecture approval. Do not mark a target `migrated`, remove blockers, or claim “no further implementation work” while required verification, visual baselines, operator review, source conflict, dependency work, root export, or workaround documentation remains incomplete.
