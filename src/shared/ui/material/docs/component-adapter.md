# Material component adapter contract

This document defines the minimum accepted contract for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named official Material component and any directly required official Material dependency adapters needed to deliver its selected consumer scenarios.

```text
current product requirement
  → selected official Material and related-component contracts
  → canonical dependency MD* adapters
  → selected parent Vue API, token API, and composition
  → installed-version m3e mappings inside each owner
  → consumer migration and verification
```

Do not derive public `MD*` or token API from legacy Mioframe or m3e.

## Material-first scope

1. Inspect official overview, specs, guidelines, and accessibility pages.
2. Follow related-component placement and composition references.
3. Identify every official Material component participating in the selected scenarios.
4. Implement or complete each required dependency as its own canonical demand-scoped `MD*` adapter.
5. Select only current demand plus the minimum adjacent surface required for a coherent API.
6. Mark other official component and token surface `deferred`.
7. Classify a requirement `not-material` only after selected and related sources have been checked.

A partial official surface is acceptable. A renderer-shaped public API or hidden cross-component implementation is not.

## Evidence rules

- Official prose, normative tables, captions, and diagrams may establish capabilities and supported combinations.
- Token tables establish token paths and values, not the complete capability matrix.
- Absence from one page, token family, m3e, legacy code, or tests is not evidence of prohibition.
- Negative and restrictive decisions require positive official evidence.
- If official sources conflict, record `source-conflict`; do not invent a narrower rule.
- Cross-family mappings must distinguish parent tokens from dependency constraints.
- Installed lockfile-resolved package artifacts and observable browser behavior define consumed m3e behavior; upstream source and changelogs are supporting evidence only.

## Official Material dependencies

An official Material component remains independently owned even when used only inside another component.

Required sequence:

1. identify it in the parent matrix;
2. create or complete its canonical demand-scoped `MD*` adapter;
3. give it its own official-source review, matrix, public Vue API, root export, renderer typing, accessibility contract, token/presentation boundary, divergences, tests, stories, visual proof, and operator review where applicable;
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
- exact installed m3e entry point and documented or inspected mapping;
- renderer status;
- implementation owner and decision;
- required proof;
- stable `M3E-*` ID for confirmed `divergent` behavior.

Renderer statuses:

- `direct` — documented m3e API implements the selected contract;
- `partial` — m3e provides a usable base but another owner completes the contract;
- `missing` — no documented implementation exists;
- `divergent` — documented or consumed behavior differs observably;
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

No production mapping, supported token, or composition may exist without a matrix row.

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

If the API permits states simultaneously, their precedence and restoration behavior must be defined and verified.

A parent action label is not automatically an adequate accessible purpose label for a composed progress component. The matrix must explicitly justify that semantic handoff or expose the smallest demand-scoped separate loading-purpose API.

## Token and theme ownership

The token contract follows `component-tokens.md` and `token-api.md`.

Canonical runtime owners:

| Token layer                                              | Owner                                                   |
| -------------------------------------------------------- | ------------------------------------------------------- |
| supported reference/system foundations                   | `src/shared/ui/material/foundation/tokens.css`          |
| default palette and light/dark color roles               | `src/shared/ui/material/foundation/theme.css`           |
| supported component tokens and private renderer mappings | `src/shared/ui/material/components/<family>/tokens.css` |
| application extensions                                   | outside `src/shared/ui/material`                        |

Rules:

- every supported public token has one declaration owner and a `token-api.md` entry;
- official but unsupported tokens remain `deferred` in the family matrix;
- m3e defaults are not copied merely to expose a complete token catalogue;
- `--m3e-*` and `--md-private-*` remain private;
- parents do not set dependency-private renderer variables;
- CSS value representation must be accepted by every selected current consumer grammar;
- rendered browser proof is required when grammar or mapping changes visible behavior.

`src/shared/lib/md/tokens.css` is a legacy mixed-owner file. A migration that touches it must inventory and split retained declarations, move `--app-*` outside Material, update the global import, populate `token-api.md`, remove the legacy file, and leave no duplicate declaration owner.

Do not create a TypeScript token registry, token DSL, global component-token file, or public aliases for all m3e variables.

## m3e defect registry

`m3e-defects.md` is the canonical cross-component owner for confirmed incorrect m3e implementations and documentation mismatches.

```text
m3e does not implement a Material capability
  → family matrix: `missing`

m3e documents or implements a capability incorrectly
  → family matrix: `divergent` + `M3E-*`
  → `m3e-defects.md`
```

Create or update an `M3E-*` record when installed-version and browser evidence confirms:

- observable m3e behavior differs from the selected official Material contract;
- a documented public API is broken or implemented under a different contract;
- m3e documentation and consumed implementation disagree;
- a renderer defect requires a temporary workaround or blocks a selected scenario.

Do not create a defect record for a missing capability, deferred optional surface, Material source conflict, Mioframe extension, equivalent internal implementation, or unverified suspicion.

Each record owns the stable ID, affected and last-revalidated versions, lifecycle statuses, evidence, affected family matrices, mitigation, correct upstream result, removal trigger, and history.

A confirmed `divergent` matrix row without its `M3E-*` reference is incomplete. A workaround for a confirmed m3e defect without a complete registry record is forbidden.

Every m3e update revalidates all non-resolved entries for affected renderer families against the newly installed artifact and owned proof. Upstream status `fixed` does not resolve Mioframe work by itself.

## Gap ownership

### Material foundation

Owns supported reference/system token declarations, standard theme roles, CSS grammar, and foundation catalogue entries.

### Parent adapter

Owns parent naming, composition state and placement, slots/events, controlled state, current native integration, and parent-to-dependency public handoff.

### Canonical owning adapter

Owns renderer import and typed mapping, public accessibility/native semantics, family tokens, presentation boundary, geometry normalization, wrapper-owned behavior, divergence records, tests, stories, visual proof, and root export.

### m3e

Owns private DOM, internal layout, private defaults, state layer, ripple, focus treatment, elevation, motion, private accessibility behavior, and renderer-owned transitions.

Do not copy renderer internals, build a second renderer, or duplicate one workaround in several parents.

## Controlled exact-version renderer workaround

Documented m3e APIs remain preferred. A confirmed renderer defect does not have to block delivery when a narrow owning-adapter workaround is safe.

A `temporary-renderer-workaround` is accepted only when:

1. the selected current Material scenario requires the behavior;
2. documented m3e API is missing, broken, or observably divergent;
3. the installed lockfile-resolved artifact confirms a host-level property, attribute, CSS custom property, or host dimension that produces the required observable result;
4. the workaround exists only inside the canonical owning adapter;
5. it does not access private DOM/methods or recreate interaction, accessibility, state, geometry engine, or motion systems;
6. it does not leak to public Vue API, token catalogue, parent adapters, or consumers;
7. the matrix records `divergent`, `temporary-renderer-workaround`, long-term owner `m3e-fix`, exact version, risk, removal trigger, and `M3E-*` ID;
8. the registry entry records current statuses, evidence, mitigation, correct result, and history;
9. focused tests cover the observable behavior;
10. every dependency update revalidates or removes it from owned evidence.

A workaround meeting this gate is tracked technical debt, not a blocker. Undocumented renderer usage without this gate is forbidden.

## Renderer typing boundary

- Import exact exported element classes and value aliases with type-only imports.
- Derive Vue custom-element glue from the element class or `HTMLElementTagNameMap`.
- Handwritten `new () => HTMLElement` glue is not package-derived.
- Keep public Material types independent and constrain private mapping with exact package types.
- Keep renderer declaration glue with its canonical adapter.

## Accessibility and native behavior

- Put ARIA/native state/focus/interaction semantics on the actual owner.
- Preserve normal native event propagation unless an accepted contract requires interception.
- DOM attribute assertions alone do not prove custom-element accessibility.
- Browser proof must resolve required role and accessible name from actual rendered semantics.
- For a progress component inside an interactive component, verify both owners in the browser accessibility tree or record an explicit accepted alternative.

## Verification

For each parent and dependency adapter require:

- package-derived type-check;
- colocated contract tests for selected API and adapter-owned mappings;
- browser tests for current native and accessibility scenarios;
- observable browser or visual proof for selected renderer-owned hover, focus, pressed, ripple, and motion behavior; host state or source inspection alone is insufficient;
- meaningful independent stories for selected presentation states;
- executable visual-regression proof when the adapter owns stable visible geometry or presentation;
- public token declaration/catalogue/mapping/grammar agreement and representative override proof;
- exact-version divergence and reduced-motion assessment;
- complete `M3E-*` records for confirmed renderer defects;
- operator visual and motion review where applicable.

A Storybook story, a `visual` tag, or a behavior/accessibility test is not visual-regression proof. Accepted automated visual proof requires a visual-runner test and committed baseline.

For each composition require:

- parent renders the dependency adapter, not raw dependency m3e;
- exact state, label, accessibility, size, color/token, disabled, and slot handoff;
- coverage of every production-representable selected-state interaction;
- restoration after transient composition state;
- normal event bubbling;
- final `pnpm verify`.

A parent screenshot does not substitute for dependency-owned visual-regression proof. Do not duplicate m3e or Lit internal tests.

## Completion gate

A target completes only when:

- its matrix is accepted;
- public API is the selected official Material subset;
- all public combinations and handoffs are resolved;
- every dependency has an accepted adapter and root export;
- renderer glue is package-derived;
- browser accessibility semantics are proven where required;
- required visual-regression specs and baselines exist;
- supported public tokens have canonical owners and catalogue entries;
- no duplicate or legacy token owner remains in target scope;
- selected gaps have the correct owner;
- divergences and workarounds have exact versions, risks, tests, and removal triggers;
- every confirmed incorrect m3e implementation has a complete linked record;
- consumers use canonical APIs and obsolete ownership is removed;
- final verification passes;
- operator accepts required visual and motion behavior.

README, token catalogue, and roadmap statements must map to exact implementation and proof. Green CI alone is not architecture approval.
