# Material component adapter contract

This document defines the minimum accepted contract for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named official Material component and any directly required official Material dependency adapters needed to deliver its selected consumer scenarios.

```text
current product requirement
  → selected official Material and related-component contracts
  → canonical dependency MD* adapters
  → selected parent Vue API
  → exact-version m3e mappings inside each owner
  → consumer migration and verification
```

Do not start from the legacy API or the m3e API and infer the public `MD*` contract from them.

## Material-first scope

1. Inspect the official component overview, specs, guidelines, and accessibility pages.
2. Follow official references and search related component pages for documented cross-component composition.
3. Identify every related official Material component used by the composition.
4. Implement or complete each required dependency as its own canonical demand-scoped `MD*` adapter.
5. Select only the subset required by current Mioframe consumers and parent compositions plus the minimum adjacent surface needed to keep each API coherent and forward-compatible.
6. Mark all other official Material capabilities `deferred`.
7. Classify a current requirement `not-material` only after no official selected-component or related-component source can be found.

A partial component surface is acceptable. A non-Material, renderer-shaped, or hidden cross-component implementation is not.

## Source evidence and negative claims

Official sources do not all prove the same thing:

- overview, specs, guidelines, accessibility prose, normative tables, captions, and diagrams may positively establish concepts and supported combinations;
- token tables establish token names, paths, and values, but are not a complete component capability matrix;
- absence from one page, one token family, m3e, legacy code, or tests is not evidence of prohibition.

Before recording a capability as unsupported, a combination as invalid, or a requirement as non-Material, require one of:

1. an explicit official prohibition;
2. a complete normative configuration matrix that excludes it by definition;
3. consistent unambiguous evidence across every relevant official page.

A missing token row is never sufficient negative evidence. When overview or guidelines positively show a capability while token coverage appears incomplete, retain the capability and record a source/token coverage gap.

If official sources conflict, record `source-conflict`, preserve the already supported observable scenario, and do not finalize the affected API until the conflict is resolved. Do not invent the narrower rule.

## Official Material dependency rule

An official Material component remains independently owned even when it is currently used only inside another Material component.

A parent `MD*` adapter must not directly render a raw `m3e-*` element representing another official Material catalog component with its own overview, specs, guidelines, accessibility, tokens, and behavior contract.

Required sequence:

1. identify the official dependency in the parent composition;
2. create or complete the dependency's canonical `MD*` adapter;
3. give the dependency its own source-backed Material–m3e–Vue matrix, demand-scoped public API, public export, exact renderer typing, accessibility contract, tokens, divergence record, tests, stories, visual proof, and operator review where relevant;
4. compose the dependency adapter from the parent;
5. keep raw renderer imports, renderer types, private CSS inputs, geometry normalization, accessibility implementation, and motion assessment inside the dependency adapter.

The dependency adapter is demand-driven. It implements only the official Material subset required by current direct consumers and current parent compositions plus the minimum coherent adjacent surface. This rule does not require implementing the complete component catalog.

A parent may directly use raw m3e only for its own renderer family and renderer-internal primitives that are not separate official Material catalog components.

Example:

```text
MDButton.loading
  → MDLoadingIndicator
      → m3e-loading-indicator
```

`MDButton` owns the loading composition meaning, placement, and state handoff. `MDLoadingIndicator` owns Loading indicator semantics, accessible progress labeling, sizing, official tokens, renderer mapping, divergences, and motion.

If the dependency adapter is missing or unaccepted, the parent remains `migrating` or `blocked`. Passing tests on a raw embedded dependency does not complete the parent.

## Documented cross-component composition

Material guidance owned by another component page still belongs to the Material contract. Examples include a Loading indicator or circular Progress indicator placed inside a Button.

The parent composition may be represented as:

- a prop or state on the selected parent `MD*` component;
- a Material content slot;
- an explicit composition of canonical `MD*` components.

Choose the smallest parent API that expresses the documented behavior and current need. Every official component participant must still be implemented through its own canonical adapter.

Do not create a non-MD component merely because the selected component page does not define a framework-specific prop.

## Required family artifacts

Before production edits, update:

```text
src/shared/ui/material/components/<family>/README.md
```

The parent and every required dependency family must contain a Material–m3e–Vue matrix:

| Material contract and exact source | Required now and evidence | Public Vue representation | m3e exact-version support | Owner | Decision | Verification |
| ---------------------------------- | ------------------------- | ------------------------- | ------------------------- | ----- | -------- | ------------ |

Each relevant row must identify:

- the exact Material concept and source;
- whether it is required now, deferred, not Material, or source-conflicted;
- the consumer or parent-composition evidence for current need;
- the public Vue prop, value, slot, emit, `v-model`, ref, native mapping, token, or composition;
- exact m3e property, event, slot, CSS input, family entry point, or missing capability;
- implementation owner;
- implementation, deferral, source-conflict, or blocker decision;
- required proof.

The parent matrix must additionally identify every official Material dependency, canonical adapter path, status, public API used by the parent, and required handoff proof.

The dependency matrix must stand on its own. A row in the parent matrix does not replace the dependency's own contract.

For every negative or restrictive decision, include the positive official evidence that establishes the restriction. “Not documented” and “no token route” are not sufficient.

Each artifact must also include:

- exact m3e package range, resolved version, family entry point, and exported type sources owned by that adapter;
- a compact public Vue API summary;
- documented cross-component compositions;
- dependency adapters and statuses;
- deferred Material surface;
- Material/m3e divergences and source gaps;
- true non-Material requirement decisions;
- operator visual and motion review status.

Do not reproduce the complete Material documentation. Group rows where the mapping and ownership are genuinely identical.

## Public Vue API

The API must use official Material terminology and semantics while following Vue mechanics.

Allowed Vue adaptation:

- props for Material options, states, and documented compositions;
- slots for Material content roles;
- emits or `v-model` for Material interaction intent;
- refs and focus methods;
- native HTML properties currently required to represent the Material web behavior correctly.

Forbidden by default:

- raw m3e property, event, or slot names exposed only because they exist;
- legacy Mioframe names that conflict with Material terminology;
- public options or states with no selected-component, related-component, or approved extension source;
- optional native/link/form fields added for hypothetical completeness;
- silently retained project extensions;
- public dependence on another component's renderer type or private renderer CSS inputs.

A parent convenience prop may model an official Material composition when its meaning, state ownership, dependency adapter, accessibility handoff, and rendering rules are explicit in the matrix.

Public types are authored from the selected Material contract. Private mapping results must satisfy package-exported m3e types inside the owning adapter. Parent adapters type against dependency public Vue APIs, not dependency renderer classes.

## m3e coverage statuses

Use one status per matrix row:

- `direct` — documented m3e public API implements the selected Material capability;
- `partial` — m3e provides a usable base but does not complete the selected contract;
- `missing` — no documented m3e implementation exists;
- `divergent` — the documented or inspected result differs observably from Material;
- `not-applicable` — the capability belongs entirely to Vue/native integration.

Use m3e maximally for every `direct` part inside its owning adapter. Do not reimplement it in Vue and do not duplicate a dependency renderer mapping in multiple parents.

## Gap ownership

### Parent wrapper correction

Use the parent Vue adapter for:

- parent Material-to-Vue naming and value normalization;
- composition state and placement;
- parent slots and event normalization;
- controlled parent state;
- parent-to-dependency public API handoff;
- currently required native integration.

### Dependency adapter correction

Use the dependency `MD*` adapter for:

- dependency Material-to-Vue naming and renderer mapping;
- dependency public accessibility and native semantics;
- dependency public tokens and inherited presentation boundary;
- dependency geometry normalization;
- dependency wrapper-owned behavior;
- dependency renderer divergences and motion assessment.

Preserve normal native event propagation unless an accepted contract requires interception. Put ARIA, native state, focus, and interaction semantics on the actual owner. Avoid an extra wrapper when the canonical root can own the required behavior. Prefer inherited `currentColor` or official public `--md-comp-*` tokens over duplicating state/color rules.

### m3e fix

Assign the gap to m3e when it concerns:

- renderer geometry or internal layout;
- private DOM;
- state layer, ripple, focus treatment, elevation, or motion;
- private accessibility behavior;
- a renderer-owned Material state or visual transition.

Do not work around an m3e-owned gap by copying internals, building a second renderer, or duplicating the same dependency workaround in each parent.

### Blocker

Use `blocked` only when a selected Material requirement cannot be delivered safely by either owner. A deferred capability or source/token coverage gap is not a blocker. A missing required dependency adapter is a parent blocker until completed.

## True non-Material requirements

Only after the cross-component source search may a requirement be classified non-Material.

For every true non-Material requirement, record one explicit decision:

- `consumer-composition`;
- `separate-non-md-component`;
- `approved-md-extension`;
- `remove-or-migrate`;
- `unresolved`.

`approved-md-extension` requires an architecture decision and must remain clearly documented as non-standard. The default is composition or a separate component without the `MD` prefix.

When `separate-non-md-component` is selected, apply `.agents/skills/shared-ui-implementation/SKILL.md`. The component requires its own preflight, meaningful root, actual ARIA/native owner, presentation ownership, colocated stories outside the Material family, consumer review, and verification.

Do not complete migration while a current true non-Material requirement is silently embedded in the `MD*` API.

## Renderer type boundary

- Import exact family element classes and value aliases with type-only imports inside the owning adapter.
- Derive Vue custom-element glue from exported package types or `HTMLElementTagNameMap`.
- Keep public Material Vue types independent.
- Require every mapper output to satisfy the exact m3e type.
- Do not publish m3e types or hand-copy renderer interfaces and literal unions.
- Keep each renderer declaration with its canonical adapter; parents must not maintain declaration glue for dependency renderers.

## Tokens and composed presentation

Public component tokens are selected Material API.

- Use verified official Material token paths and names.
- Expose only the subset required now.
- Map selected tokens to documented semantic m3e inputs inside the owning adapter.
- Do not create a public alias for every m3e variable.
- Parent-to-dependency presentation uses dependency public props, slots, inherited color, or official public `--md-comp-*` tokens.
- Parents must not set dependency-private `--m3e-*` variables.
- Follow official placement and contrast rules for composed indicators; inherit the rendered label/icon color when Material specifies that relationship.
- Non-Material styling extensions require the same explicit decision as non-Material props.

## Consumer migration

Migrate consumers to the selected Material Vue API, not merely to the new import path.

- Update legacy prop names and values where they conflict with Material.
- Keep documented Material compositions in the Material owner.
- Replace raw official Material renderer dependencies inside parents with canonical `MD*` adapters.
- Move true non-Material behavior to the decided owner.
- Remove the obsolete target owner only after all current scenarios have a valid new path.
- Leave unrelated components intact.

## Verification

Verification is selected-contract and dependency-contract based.

For the parent and each dependency adapter:

- package-derived type-check for Vue-to-m3e mappings;
- colocated component-contract tests for public Material names, values, defaults, valid/invalid combinations, slots, events, controlled state, native behavior, ARIA owner, and wrapper-owned mappings;
- browser tests for current user, accessibility, and native scenarios;
- stable colocated stories and visual baselines for selected Material states;
- exact-version renderer divergence and reduced-motion assessment;
- operator visual and motion review where applicable.

For the composition:

- prove the parent renders the dependency `MD*` adapter rather than raw m3e;
- prove parent-to-dependency state, label, accessibility, size, color/token, disabled, and slot handoff;
- cover production-used combinations such as disabled plus loading and selected plus loading;
- preserve normal event bubbling;
- run final `pnpm verify`.

Do not duplicate m3e or Lit tests. Direct m3e delegation does not require one test per renderer field.

## Renderer-owned motion

- Inspect the exact installed source and record relevant state, interruption, and reduced-motion paths.
- Confirm the owning adapter does not disable, replace, or duplicate the implementation.
- Use operator manual testing for visual quality and timing.
- Do not use `:active`, screenshots, or private DOM inspection as proof of internal animation.

## Completion gate

A target completes when:

- its Material–m3e–Vue matrix is accepted;
- the public API is a selected subset of official Material, expressed idiomatically in Vue;
- every public capability has a selected-component source, related-component composition source, or explicitly approved extension decision;
- every negative and restrictive decision passes the source-evidence gate;
- selected gaps are assigned to and completed by the correct owner;
- every required official Material dependency has an accepted canonical `MD*` adapter;
- the parent composes dependencies through their public Vue boundaries with no raw dependency m3e usage;
- deferred Material surface, source gaps, and m3e divergences are recorded by the owning adapter;
- consumers use the canonical APIs and obsolete ownership is removed;
- relevant verification passes;
- operator accepts the final visual and motion behavior.

Do not keep a target `migrating` because deferred Material surface is not implemented. Do not mark it complete while an official dependency adapter, true non-Material extension, source conflict, m3e blocker, verification, or operator review remains unresolved.
