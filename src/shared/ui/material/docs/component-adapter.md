# Material component adapter contract

This document defines the minimum accepted contract and implementation sequence for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The migration target is one explicitly named public `MD*` component, or a cohesive inseparable family only when current ownership makes a component-only migration technically unsafe.

```text
required scenarios
  → official Material contract
  → exact m3e public integration contract
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
Renderer package, exact version, and family entry point:
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
4. a current stable, non-prerelease m3e version using primary package evidence:
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

- `unassessed` before the exact version and required integration surface are verified;
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

- the exact pinned `@m3e/web` version;
- the required family entry point;
- verified peer dependencies;
- the shared build configuration owner for Vue custom-element recognition across application, Storybook, and tests;
- the family-local import that registers only the required m3e elements.

Do not use a version range, all-components import, global runtime registry, or family-independent registration framework.

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

For a legacy migration target:

1. create the canonical adapter owner;
2. migrate every affected in-repository import and usage of that target;
3. preserve required product scenarios and explicitly accepted API changes;
4. update applicable stories, tests, visual mappings, and public barrels;
5. remove the old target implementation, exports, tests, and exclusively owned compatibility paths;
6. leave unrelated components in the legacy directory unchanged;
7. set implementation ownership to `migrated`.

A temporary compatibility path requires exact remaining consumers, prohibition of new usage, and a removal target. It is not the default.

## Verification

Every public `MD*` adapter requires a colocated `<Component>.test.ts` component-contract test for props, emits, slots, defaults, explicit attribute/property mapping, controlled state, native/ARIA ownership, invalid combinations, and non-browser wiring.

Add the lowest faithful proof for remaining risks:

- browser tests for custom-element upgrade, focus, keyboard, pointer/touch, form submission, navigation, cancellation, and lifecycle where applicable;
- visual regression for stable visible surfaces with material regression risk;
- representative consumer proof when migration changes shared usage;
- production build proof for custom-element recognition, family registration, and bundled entry points.

The `MDButton` and `MDSwitch` pilots require component-contract, browser, visual, production-build, and representative-consumer proof because they establish the integration boundary.

Do not test m3e internals, Lit behavior, or generic browser behavior that Mioframe does not change or constrain.

## Exit gate

A component PR is complete only when:

- renderer viability is `ready`;
- implementation ownership is `migrated`;
- public Vue and mapping contracts are explicit;
- no m3e detail leaks outside the Material library;
- controlled state and native semantics are correct;
- required consumers are migrated;
- obsolete ownership for the migration target is removed;
- unrelated legacy components remain valid;
- confirmed m3e limitations are recorded without private workarounds;
- required focused checks and final repository verification pass.

If the exit gate cannot be reached, keep implementation ownership `legacy`; use `blocked-upstream` when renderer capability is the blocker and do not merge a partially owned replacement.
