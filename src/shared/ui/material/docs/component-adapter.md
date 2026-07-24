# Material component adapter contract

This document defines the minimum accepted contract and implementation sequence for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The migration target is one explicitly named public `MD*` component, or a cohesive inseparable family only when current ownership makes a component-only migration technically unsafe.

```text
required scenarios
  → official Material contract
  → lockfile-resolved m3e public integration contract
  → accepted Mioframe family contract
  → Vue adapter
  → consumer migration
  → verification
  → obsolete-owner removal
```

Do not split research, architecture, implementation, and migration into permanent independent processes. A focused prerequisite is allowed only when a real cross-family dependency or upstream blocker prevents a safe complete component PR.

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
Vue custom-element recognition and registration ownership:
Vue-to-m3e mapping:
Controlled-state contract:
Native form/navigation semantics:
Token mapping:
Confirmed m3e deviations or defects:
Affected consumers:
Migration and obsolete-owner removal:
Required verification:
Unresolved: none | <blocking decisions>
```

Omit inapplicable detail. Do not reproduce the full official Material documentation, m3e documentation, or repository-wide policy.

## Required mapping table

Use one explicit table for every integration boundary used by the supported surface:

| Mioframe Vue contract                       | m3e public contract                               | Direction              | Owner                               | Notes                                                         |
| ------------------------------------------- | ------------------------------------------------- | ---------------------- | ----------------------------------- | ------------------------------------------------------------- |
| prop, emit, slot, token, or native behavior | property, attribute, event, slot, or CSS variable | Vue → m3e or m3e → Vue | Mioframe, consumer, browser, or m3e | normalization, cancellation, default, or unsupported behavior |

The table must make controlled state, event order, native behavior, and unsupported mappings unambiguous.

## Discovery

Inspect only what is needed for the selected migration target:

1. current production owner, public exports, direct consumers, stories, tests, implementation notes, and known defects;
2. required user scenarios and behavior that must not change;
3. current official Material 3 Expressive component guidance for the supported surface;
4. the exact lockfile-resolved version of a current stable, non-prerelease m3e release using primary package evidence:
   - package version and peer dependencies;
   - package exports and required family entry point;
   - TypeScript declarations and Custom Elements Manifest;
   - properties and reflected attributes;
   - events, cancellation, and update order;
   - slots and content restrictions;
   - form and navigation behavior;
   - focus, keyboard, pointer, disabled, selected, and lifecycle behavior;
   - documented CSS custom properties;
   - accessibility behavior exposed to consumers;
5. existing Mioframe token and theme owners used by the component;
6. shared build, Storybook, and test configuration required to recognize `m3e-*` as custom elements.

Stop discovery when renderer viability and every required mapping decision are resolved. Do not audit unrelated components or optional Material capabilities.

## Renderer viability

Use:

- `unassessed` before the exact lockfile-resolved version and required integration surface are verified;
- `ready` only when every required scenario can be implemented through documented public m3e APIs and a thin Vue adapter;
- `blocked-upstream` when a required scenario depends on missing, defective, or unstable public m3e behavior.

A similarly named m3e element is not proof of readiness.

When viability is `blocked-upstream`, implementation ownership remains `legacy`. Record the exact missing public contract and the condition for reconsideration. Do not start a replacement implementation.

## Implementation ownership

Use:

- `legacy` while the existing component remains the production owner;
- `migrating` only while one focused change owns adapter creation, complete consumer migration, and obsolete-owner removal;
- `migrated` only when the canonical Vue adapter is the single public owner for the migration target.

Do not report `migrated` because a new wrapper exists while legacy consumers or exports remain.

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

## Dependency and custom-element integration

Before production component edits, the family contract must record:

- the repository-standard compatible `@m3e/web` semver range;
- the exact lockfile-resolved version that was inspected;
- the required family entry point;
- verified peer dependency requirements and how the repository package manager satisfies them;
- the shared build configuration owner for Vue custom-element recognition across application, Storybook, and tests;
- the family-local import that registers only the required m3e elements.

Do not use `latest`, a wildcard, a prerelease, an all-components import, a global runtime registry, or a family-independent registration framework.

A lockfile-resolved m3e version change requires re-inspection of the affected public contract and the adapter verification selected by its risk.

## Adapter implementation

The wrapper should normally contain only:

- the required m3e family import;
- explicit property and attribute binding;
- slot placement;
- event normalization;
- controlled-state synchronization;
- required native form/navigation integration;
- narrow token mapping;
- project extensions required by preserved scenarios.

Prefer direct readable code over generic mappings and configuration objects.

Do not add a shared helper, composable, base component, event registry, property schema, token DSL, or wrapper generator for the first adapter. After two unrelated adapters, extract only an identical concrete mechanism whose shared ownership is clearer and whose extraction reduces total complexity.

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

- public consumers use accepted `--md-ref-*`, `--md-sys-*`, `--md-comp-*`, and `--app-*` contracts only;
- map to documented `--m3e-*` variables privately inside the family;
- do not expose `--m3e-*` through documentation or public exports;
- do not target private shadow DOM to compensate for a missing CSS API;
- retain the existing global theme owner unless a separate architecture decision changes it;
- avoid copying m3e defaults into Mioframe unless a public Mioframe token contract requires it.

## Consumer migration

A migration must move every in-repository consumer of the selected target to the canonical Vue adapter and remove only obsolete ownership that belongs exclusively to that target.

Do not migrate unrelated components merely because they share a legacy directory. Keep still-owned shared modules in place until their remaining owners are migrated or a separate extraction is justified.

Temporary compatibility is allowed only when atomic migration is technically unsafe and must record exact remaining consumers, no-new-usage enforcement, and a removal target.

## Required verification

Every public adapter requires:

- a colocated `<Component>.test.ts` component-contract test for its stable Vue API and explicit integration mapping;
- browser proof for renderer upgrade and relevant native interactions;
- visual regression proof for the canonical visible surface;
- representative-consumer proof for migrated usage;
- production-build proof for compiler recognition, family registration, and bundling;
- final repository verification.

The `MDButton` and `MDSwitch` pilots require all proof types above.

Do not duplicate m3e or Lit internals, inspect private shadow DOM, or infer Material correctness from green automation alone.

## Completion gate

A target is complete only when:

- renderer viability is `ready`;
- implementation ownership is `migrated`;
- one canonical public Vue owner remains;
- all affected consumers are migrated;
- obsolete target-owned implementation, exports, tests, stories, and compatibility paths are removed;
- unrelated legacy ownership is preserved;
- supported, unsupported, and defective renderer surface is recorded;
- every required proof passes.
