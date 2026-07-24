# Material component adapter contract

This document defines the minimum family contract and implementation sequence for a Mioframe Vue component backed by m3e.

## Unit of work

The default unit is one official Material component family migrated end to end:

```text
required scenarios
  → official Material contract
  → m3e public integration contract
  → Mioframe Vue adapter
  → consumer migration
  → verification
  → legacy owner removal
```

Do not split research, architecture, implementation, and migration into permanent independent processes. Use a focused prerequisite only when a real cross-family dependency or upstream blocker prevents a safe complete family PR.

## Family README

Before production edits, create or update:

```text
src/shared/ui/material/components/<family>/README.md
```

It records only decisions required to implement and maintain the adapter:

```text
Family:
Status: ready | blocked-upstream | retain-legacy | migrating | migrated
Current owner:
Canonical owner:
Public export:
Required scenarios:
Non-goals:
Official Material sources:
Supported Material surface:
Unsupported Material surface:
Public Vue API:
Renderer package, version, and entry point:
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

| Mioframe Vue contract | m3e public contract | Direction | Owner | Notes |
| --- | --- | --- | --- | --- |
| prop, emit, slot, token, or native behavior | property, attribute, event, slot, or CSS variable | Vue → m3e or m3e → Vue | Mioframe, consumer, browser, or m3e | normalization, cancellation, default, or unsupported behavior |

The table must make controlled state, event order, and native behavior unambiguous.

## Discovery

Inspect only what is needed for the selected family:

1. current production owner, public exports, direct consumers, stories, tests, and known defects;
2. required user scenarios and behavior that must not change;
3. current official Material 3 Expressive component guidance for the supported surface;
4. the exact public API of the pinned m3e component entry point:
   - properties and reflected attributes;
   - events, cancellation, and update order;
   - slots and content restrictions;
   - form and navigation behavior;
   - focus, keyboard, pointer, disabled, and selected behavior;
   - documented CSS custom properties;
   - accessibility behavior exposed to consumers;
5. the existing Mioframe token and theme owners used by the component.

Stop discovery when renderer viability and every required mapping decision are resolved. Do not audit unrelated component families or optional Material capabilities.

## Viability decision

Use `ready` only when all required scenarios can be implemented through documented m3e public APIs and a thin Vue adapter.

Use `blocked-upstream` when a required scenario depends on missing, defective, or unstable m3e public behavior.

Use `retain-legacy` when the current implementation remains safer than working around the blocker. Record the exact missing contract and the condition for reconsideration.

Do not classify a family as ready merely because an m3e element with a similar name exists.

## Public Vue API

The Vue API follows official Material concepts and established project conventions, not the accidental shape of the current m3e API.

- expose only current scenarios and the minimum complete supported Material surface;
- keep props, emits, slots, defaults, and invalid combinations typed and explicit;
- use `v-model` or `update:*` for consumer-controlled semantic state where appropriate;
- preserve native form and navigation behavior when required;
- normalize m3e events into stable Vue emits;
- keep project extensions explicit and narrowly justified;
- do not expose renderer element instances or renderer-specific event objects as ordinary public API;
- do not copy every m3e attribute into a prop.

## Adapter implementation

The wrapper should normally contain only:

- the required m3e family import;
- explicit property and attribute binding;
- slot placement;
- event normalization;
- controlled-state synchronization;
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
- programmatic prop updates must be reflected without emitting false user actions.

Record event ordering and cancellation when it affects correctness. Do not infer controlled state from visual classes or internal DOM.

## Token rules

- public consumers use accepted `--md-ref-*`, `--md-sys-*`, `--md-comp-*`, and `--app-*` contracts only;
- map to documented `--m3e-*` variables privately inside the family;
- do not expose `--m3e-*` through documentation or public exports;
- do not target private shadow DOM to compensate for a missing CSS API;
- retain the existing global theme owner unless a separate architecture decision changes it;
- avoid copying m3e default values into Mioframe unless a public Mioframe token contract requires it.

## Consumer migration

For a legacy family:

1. create the canonical adapter owner;
2. migrate every affected in-repository import and usage;
3. preserve required product scenarios and explicitly accepted API changes;
4. update applicable stories, tests, visual mappings, and public barrels;
5. remove the old implementation, exports, tests, and obsolete compatibility paths;
6. update the family status to `migrated`.

A temporary compatibility path requires exact remaining consumers, prohibition of new usage, and a removal target. It is not the default.

## Verification

Use the lowest faithful proof for contracts owned by Mioframe:

- component contract tests for props, emits, slots, defaults, attribute/property mapping, controlled state, ARIA wiring, and non-browser structure;
- browser tests for custom-element upgrade, focus, keyboard, pointer/touch, form submission, navigation, cancellation, and lifecycle where applicable;
- visual regression for stable visible surfaces with material regression risk;
- representative consumer proof when migration changes shared usage;
- production build proof for custom-element registration and bundled entry points.

Do not test m3e internals, Lit behavior, or generic browser behavior that Mioframe does not change or constrain.

## Exit gate

A family PR is complete only when:

- renderer viability is `ready`;
- public Vue and mapping contracts are explicit;
- no m3e detail leaks outside the Material library;
- controlled state and native semantics are correct;
- required consumers are migrated;
- obsolete ownership is removed;
- confirmed m3e limitations are recorded without private workarounds;
- applicable focused checks and final repository verification pass.

If the exit gate cannot be reached, keep or restore `blocked-upstream` or `retain-legacy`; do not merge a partially owned replacement.