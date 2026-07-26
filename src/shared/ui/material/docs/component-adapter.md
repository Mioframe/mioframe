# Material component adapter contract

This document defines the minimum accepted contract and implementation sequence for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The migration target is one explicitly named public `MD*` component, or a cohesive inseparable family only when current ownership makes a component-only migration technically unsafe.

```text
required scenarios
  → official Material contract
  → lockfile-resolved m3e public integration contract and exported types
  → accepted Mioframe family contract
  → Vue adapter
  → consumer migration
  → scenario-linked verification
  → obsolete-owner removal
```

Do not split research, architecture, implementation, and migration into permanent independent processes. A focused prerequisite is allowed only when a real cross-family dependency or evidenced upstream blocker prevents a safe complete component PR.

## Family README

Before production edits, create or update:

```text
src/shared/ui/material/components/<family>/README.md
```

It records only decisions required to implement and maintain the selected adapter:

```text
Family:
Migration target:
Renderer viability: unassessed | ready | blocked-upstream
Implementation ownership: legacy | migrating | migrated
Current implementation owner:
Canonical owner after migration:
Public export:
Required scenarios:
Non-goals:
Official Material sources:
Supported Material surface:
Unsupported Material surface:
Public Vue API:
Renderer package, exact lockfile-resolved version, and family entry point:
Renderer type source and Vue typing strategy:
Vue custom-element recognition and registration ownership:
Vue-to-m3e mapping:
Controlled-state contract:
Native form/navigation semantics:
Token mapping and legacy-token classification:
Compatibility deltas:
Affected consumers:
Scenario-to-proof coverage:
Migration and obsolete-owner removal:
Confirmed m3e deviations or defects:
Unresolved: none | <blocking decisions or review findings>
```

Omit inapplicable detail. Do not reproduce the full official Material documentation, m3e documentation, or repository-wide policy.

## Required mapping and proof tables

Use one explicit mapping table for every integration boundary used by the supported surface:

| Mioframe Vue contract                       | m3e public contract                               | Direction              | Owner                               | Notes                                                         |
| ------------------------------------------- | ------------------------------------------------- | ---------------------- | ----------------------------------- | ------------------------------------------------------------- |
| prop, emit, slot, token, or native behavior | property, attribute, event, slot, or CSS variable | Vue → m3e or m3e → Vue | Mioframe, consumer, browser, or m3e | normalization, cancellation, default, or unsupported behavior |

The table must make controlled state, event order, native behavior, type source, and unsupported mappings unambiguous.

For legacy CSS surface, also use the compact evidence table defined by `component-tokens.md`. Distinguish declared, internally consumed, behaviorally effective, externally consumed, publicly documented, test-only, and obsolete tokens before deciding preservation or a renderer blocker.

For every required scenario and retained public styling contract, maintain a compact proof ledger:

| Scenario or contract | Accepted observable result | Primary proof | Additional proof | Status |
| -------------------- | -------------------------- | ------------- | ---------------- | ------ |
| required scenario    | exact preserved outcome    | exact test    | exact baseline   | proven |

A scenario may share proof with another scenario, but it may not disappear behind a generic claim such as “browser coverage” or “visual coverage”.

## Discovery

Inspect only what is needed for the selected migration target:

1. current production owner, public exports, direct consumers, stories, tests, implementation notes, and known defects;
2. required user scenarios and every observable behavior or presentation that must not change;
3. current official Material 3 Expressive component guidance for the supported surface;
4. the exact lockfile-resolved version of a current stable, non-prerelease m3e release using primary package evidence:
   - package version and peer dependencies;
   - package exports and required family entry point;
   - exported element class, value aliases, declarations, `HTMLElementTagNameMap`, and Custom Elements Manifest;
   - properties and reflected attributes;
   - events, cancellation, and update order;
   - slots and content restrictions;
   - form and navigation behavior;
   - focus, keyboard, pointer, disabled, selected, and lifecycle behavior;
   - documented CSS custom properties and their Material semantics;
   - accessibility behavior exposed to consumers;
5. existing Mioframe token and theme owners used by the component;
6. whether each proposed legacy public contract has a real consumer, documented promise, and observable effect;
7. shared build, Storybook, and test configuration required to recognize `m3e-*` as custom elements.

Stop discovery when renderer viability, renderer typing, every required mapping decision, and every compatibility decision are resolved. Do not audit unrelated components or optional Material capabilities.

## Renderer viability

Use:

- `unassessed` before the exact lockfile-resolved version and required integration surface are verified;
- `ready` when every required user, native, accessibility, controlled-state, active public styling, and typing scenario can be implemented through documented public m3e APIs and a thin Vue adapter;
- `blocked-upstream` when a required active contract depends on missing, defective, or unstable public m3e behavior.

A required scenario is an observable user scenario, native or accessibility guarantee, controlled-state contract, or evidenced consumer-facing API. It is not automatically every legacy declaration, internal mechanism, test fixture, alias, or renderer tuning parameter.

Before setting `blocked-upstream`, record evidence for all of the following:

1. the missing contract is required by a current user scenario or active public consumer contract;
2. repository evidence identifies the consumer, documented promise, or required observable result;
3. changing or removing the contract causes an observable regression, not only a different custom-property value or internal implementation;
4. no documented m3e property, attribute, event, slot, semantically equivalent CSS variable, exported type, or renderer-owned equivalent behavior can satisfy it through a thin adapter.

The following are not blockers by themselves:

- a legacy token is only declared or read by a value-only test;
- m3e uses a different CSS-variable name with equivalent documented Material semantics;
- m3e owns an equivalent ripple, focus, state-layer, elevation, or motion behavior but does not expose the old internal tuning parameter;
- the new renderer cannot reproduce an unused legacy implementation detail;
- an optional unsupported surface has no current scenario or consumer.

Record those cases as obsolete legacy surface, unsupported optional tuning, or confirmed renderer-owned behavior. Remove obsolete target-owned declarations and tests during atomic migration instead of recreating them.

A similarly named m3e element is not proof of readiness. Conversely, exact internal implementation parity is not required when the documented renderer provides the accepted observable Material behavior.

When viability is genuinely `blocked-upstream`, implementation ownership remains `legacy`. Record the exact missing public contract, evidence of impact, and the condition for reconsideration. Do not start a replacement implementation.

## Implementation ownership

Use:

- `legacy` while the existing component remains the production owner;
- `migrating` while one focused change owns adapter creation, complete consumer migration, obsolete-owner removal, and resolution of all exit-gate findings;
- `migrated` only when the canonical Vue adapter is the single public owner and every required contract and proof is complete.

Removal of the legacy file alone does not make ownership `migrated`. Do not report `migrated` while active token ownership, renderer typing, compatibility, verification, or operator acceptance remains incomplete.

## Public Vue API

The Vue API follows official Material concepts and established project conventions, not the accidental shape of the m3e API.

- expose only current scenarios and the minimum complete supported Material surface;
- keep props, emits, slots, defaults, and invalid combinations typed and explicit;
- use `v-model` or `update:*` for consumer-controlled semantic state where appropriate;
- preserve required native form and navigation behavior;
- normalize m3e events into stable Vue emits;
- keep project extensions explicit and narrowly justified;
- do not expose renderer element instances or renderer-specific event objects as ordinary public API;
- do not copy every m3e attribute into a prop.

## Renderer TypeScript contract

The exact family entry point owns the private renderer type contract.

- Import exported element classes and value types from `@m3e/web/<family>` with type-only imports.
- Keep Mioframe public prop types independently owned, but require every mapped value to satisfy the corresponding renderer-exported type.
- Derive custom-element property typing from the exported element class, exported aliases, or package-provided `HTMLElementTagNameMap`.
- Vue ambient declarations may add only framework glue such as `GlobalComponents` and handler attributes that Vue itself requires.
- Do not hand-copy renderer property lists, literal unions, defaults, or an independent `M3e*Props` interface when the package exports usable types.
- Prefer `Pick`, indexed access, `InstanceType`, or another direct derivation from the package type over a manually synchronized mirror.

A local compatibility shim is allowed only when the exact inspected package exports no usable public type for the required boundary. The family README must record the missing export, why direct derivation is impossible, the minimal local surface, and the condition for removing the shim. Type-check proof must fail when the upstream contract changes incompatibly.

Renderer upgrades require compile-time revalidation in addition to behavioral reinspection.

## Dependency and custom-element integration

Before production component edits, the family contract must record:

- the repository-standard compatible `@m3e/web` semver range;
- the exact lockfile-resolved version that was inspected;
- the required family entry point;
- the exported renderer types used at the integration boundary;
- verified peer dependency requirements and how the repository package manager satisfies them;
- the shared build configuration owner for Vue custom-element recognition across application, Storybook, and tests;
- the family-local import that registers only the required m3e elements.

Do not use `latest`, a wildcard, a prerelease, an all-components import, a global runtime registry, or a family-independent registration framework.

A lockfile-resolved m3e version change requires re-inspection of the affected public contract, exported types, and adapter verification selected by its risk.

## Adapter implementation

The wrapper should normally contain only:

- the required m3e family import;
- type-only imports from the same family entry point;
- explicit property and attribute binding;
- slot placement;
- event normalization;
- controlled-state synchronization;
- required native form/navigation integration;
- narrow semantic token mapping;
- project extensions required by preserved scenarios.

Prefer direct readable code over generic mappings and configuration objects.

Do not add a shared helper, composable, base component, event registry, property schema, token DSL, or wrapper generator for the first adapter. After two unrelated adapters, extract only an identical concrete mechanism whose shared ownership is clearer and whose extraction reduces total complexity.

## Compatibility preservation

Migration preserves the accepted observable contract, not merely prop names.

Before removing the legacy owner, compare old and new behavior for each current scenario:

- visible content and layout;
- size and stable geometry;
- loading and other project-extension presentation;
- keyboard, pointer, focus, disabled, native form, and controlled-state behavior;
- theme and RTL output;
- public token effects;
- motion acquisition, release, and stable final state where relevant.

Any observable difference must be one of:

1. preserved through the adapter;
2. explicitly recorded as an accepted product or architecture change with updated tests and documentation;
3. recorded as an unresolved blocker that prevents completion.

A new baseline is not evidence that a change was intended. Do not silently accept a visual or interaction regression because automation was updated.

## State and event rules

For consumer-controlled state:

- the Vue prop is the source of truth;
- m3e user interaction emits intent or a next value;
- the wrapper emits the stable Vue event;
- the consumer updates the prop;
- the wrapper restores or prevents m3e internal state when necessary to avoid drift;
- programmatic prop updates are reflected without false user-action emits.

Record event ordering and cancellation when it affects correctness. Do not infer controlled state from visual classes or internal DOM.

## Token rules

Follow `component-tokens.md`.

- public consumers use accepted active `--md-ref-*`, `--md-sys-*`, `--md-comp-*`, and `--app-*` contracts only;
- prefer direct shared `--md-sys-*` semantics when documented by m3e;
- map active component contracts to documented semantically equivalent `--m3e-*` variables privately inside the family;
- transfer one canonical default declaration for every retained active `--md-comp-*` token before removing the legacy owner;
- mapping `--m3e-*` to an undefined public variable is incomplete ownership;
- do not require exact variable-name equality when component, state, part, property, and meaning match;
- do not expose `--m3e-*` through documentation or public exports;
- do not target private shadow DOM to compensate for a missing CSS API;
- retain the existing global theme owner unless a separate architecture decision changes it;
- avoid copying m3e defaults into Mioframe unless an active public Mioframe token contract requires it;
- remove declaration-only, test-only, or otherwise obsolete target-owned token surface during migration;
- do not recreate low-level tuning that belongs to renderer-owned behavior and has no evidenced active consumer contract.

## Consumer migration

A migration must move every in-repository consumer of the selected target to the canonical Vue adapter and remove only obsolete ownership that belongs exclusively to that target.

Do not migrate unrelated components merely because they share a legacy directory. Keep still-owned shared modules in place until their remaining owners are migrated or a separate extraction is justified.

Temporary compatibility is allowed only when atomic migration is technically unsafe and must record exact remaining consumers, no-new-usage enforcement, and a removal target.

## Required verification

Every public adapter requires:

- type-check proof that renderer property/value mappings derive from the exact package-exported types;
- a colocated `<Component>.test.ts` component-contract test for its stable Vue API and explicit integration mapping;
- browser proof for renderer upgrade and relevant native interactions;
- visual regression proof for the canonical visible surface;
- representative-consumer proof for migrated usage;
- production-build proof for compiler recognition, family registration, and bundling;
- final repository verification.

For every retained public CSS token selected as a meaningful contract:

- set a non-default value through the public Mioframe surface;
- prove the intended rendered property or observable behavior changes;
- verify the mapping uses documented m3e semantics without inspecting private shadow DOM.

A test that only reads a declared or resolved custom-property value does not prove an active public contract and must not justify `blocked-upstream`.

For renderer-owned motion, prove the claimed public result, not only input acquisition. `:active` alone proves only that the browser acquired a press. Verify release, interruption, stable final state, and reduced-motion behavior through public observables; when the visual effect cannot be inspected without private DOM, pair real interaction proof with bounded visual evidence and record the limitation instead of claiming an unproven effect.

The visual set must include every materially distinct stable visible scenario named in the family contract, including project extensions, themes, or RTL when they change output, or record a specific evidence-based reason why an existing baseline already covers it. Avoid Cartesian-product snapshots.

The proof ledger must identify exact tests and baselines for every required scenario before the target can be complete.

The `MDButton` and `MDSwitch` pilots require all proof types above.

Do not duplicate m3e or Lit internals, inspect private shadow DOM, or infer Material correctness from green automation alone.

## Completion gate

A target is complete only when:

- renderer viability is `ready`;
- implementation ownership is `migrated`;
- one canonical public Vue owner remains;
- renderer integration uses package-exported types without an avoidable handwritten mirror;
- all affected consumers are migrated;
- every accepted observable scenario is preserved or has an explicit approved compatibility change;
- every retained active public token has one canonical declaration and complete semantic renderer mapping;
- obsolete target-owned implementation, exports, tests, stories, compatibility paths, and declaration-only token surface are removed;
- unrelated legacy ownership is preserved;
- supported, unsupported, and defective renderer surface is recorded;
- the scenario-to-proof ledger is complete;
- every required automated proof passes;
- required operator visual acceptance is recorded.
