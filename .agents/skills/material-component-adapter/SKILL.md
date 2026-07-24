---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Mioframe Material component family as a stable Vue MD* API backed privately by @m3e/web when its documented public contract is sufficient.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/ui/**/MD*.vue'
  - 'docs/material-3/**'
---

# Material component adapter

Implement one official Material family end to end through the canonical Mioframe Vue-to-m3e boundary.

## Canonical rules

Read first:

- `docs/material-3/architecture.md`;
- `docs/material-3/component-adapter.md`;
- `docs/material-3/roadmap.md`;
- applicable `AGENTS.md` files;
- the selected family's current or planned `README.md`.

These rules already resolve the normal architecture:

```text
product consumers
  → public Mioframe Vue MD* component
  → private documented @m3e/web custom element
```

Use `architect-handoff` before implementation only when the task changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another decision not resolved by those documents.

## Input and scope

A component or family name is sufficient input. Resolve one cohesive family and complete at most that family in the current task.

Do not combine unrelated families, general shared UI cleanup, global theme replacement, or speculative adapter infrastructure.

## 1. Resolve current scenarios and ownership

Inspect:

- current production implementation and public exports;
- direct consumers and required user flows;
- current props, emits, slots, native behavior, extensions, stories, and tests;
- known defects and compatibility requirements;
- current roadmap milestone and prerequisites.

Record:

- required scenarios and behavior that must not change;
- non-goals and unsupported optional surface;
- current and canonical owner;
- affected consumers;
- change mode: `new-adapter`, `end-to-end-migration`, or `adapter-change`.

Do not infer required scope from the component name alone when current consumers exist.

## 2. Resolve official Material requirements

Use current official Material 3 Expressive sources for only the supported scenarios:

- intended and prohibited usage;
- variants, sizes, configurations, and states;
- content and accessibility requirements;
- relevant visual, interaction, and adaptive behavior;
- applicable official token meaning.

Record exact pages and snapshot/capture metadata used. Official Material defines the target; repository rendering and m3e do not.

Do not reproduce the complete official documentation or implement optional capability without a current scenario.

## 3. Inspect the exact m3e public contract

Inspect the version that will be pinned or is currently pinned. Use primary package evidence:

- package exports and family entry point;
- TypeScript declarations and Custom Elements Manifest;
- documented properties and reflected attributes;
- events, cancellation, and event order;
- slots and content restrictions;
- form and navigation behavior;
- focus, keyboard, pointer/touch, disabled, selected, and lifecycle behavior;
- documented CSS custom properties;
- accessibility behavior exposed through the public element.

Do not rely on a different version, examples without version identity, shadow DOM inspection, memory, or undocumented internals.

## 4. Decide renderer viability

Set exactly one status:

- `ready` — every required scenario is available through documented public m3e APIs and a thin adapter;
- `blocked-upstream` — a required public renderer contract is missing or defective;
- `retain-legacy` — the existing implementation remains the safe production owner until the blocker is resolved.

When blocked, record the exact missing contract and stop before replacement implementation. Do not patch private renderer internals or weaken required scenarios.

The existence of a similarly named m3e element is not proof of readiness.

## 5. Complete the family contract

Create or update:

```text
src/shared/ui/material/components/<family>/README.md
```

Follow `docs/material-3/component-adapter.md`. Include the explicit mapping table for every supported prop, emit, slot, controlled state, native behavior, and token route.

The public Vue API follows Material concepts and established Vue conventions. Do not mechanically copy all m3e attributes or expose renderer element/event types.

Readiness requires:

- required scenarios and non-goals resolved;
- supported and unsupported Material surface explicit;
- public Vue API complete;
- renderer entry point and exact version known;
- property, attribute, event, slot, state, and token mapping explicit;
- controlled state and native semantics unambiguous;
- consumers, verification, and obsolete-owner removal identified;
- unresolved blockers: none.

## 6. Run implementation preflight

Use `implementation-preflight` before production edits. Record compactly:

- the family contract as authoring source;
- owners and public entry points;
- minimum adapter design and simpler alternative;
- exact passes;
- `TEST IMPACT` with existing and planned proof;
- final repository verification.

Do not begin production edits while renderer viability or the family contract is unresolved.

## 7. Implement the thin adapter

Normally implement only:

- the required m3e family import;
- explicit property and attribute binding;
- named slot placement;
- event normalization;
- controlled-state synchronization;
- native form/navigation integration required by scenarios;
- narrow private token mapping;
- explicitly required Mioframe extensions.

Keep code family-local and readable.

Forbidden for the first pilot:

- wrapper generator or universal base component;
- runtime component registry;
- generic property/event schema;
- token mapping DSL;
- broad options object;
- renderer switching;
- private shadow-DOM access;
- copied m3e source or internal CSS;
- parallel state-layer, ripple, focus, or motion implementation already provided correctly by m3e.

After two unrelated adapters, extract only an identical concrete mechanism whose shared owner is clear and whose extraction reduces total complexity.

## 8. Preserve controlled state and native behavior

For a controlled prop:

1. the Vue prop is the source of truth;
2. m3e user interaction supplies intent or a next value;
3. the wrapper emits the stable Vue event;
4. the consumer updates the prop;
5. the wrapper prevents or corrects renderer-state drift;
6. programmatic prop updates do not emit false user actions.

Preserve applicable native button, link, form, focus, keyboard, disabled, readonly, and accessibility semantics. Do not synthesize native behavior to compensate for an incorrect mapping.

## 9. Migrate consumers and remove ownership

For `end-to-end-migration`:

- create the canonical family owner;
- migrate every affected in-repository import and usage;
- preserve required product scenarios and accepted API deltas;
- update applicable barrels, stories, tests, visual impact mappings, and documentation;
- remove obsolete implementation, exports, tests, and compatibility paths;
- leave no new usage of the legacy owner.

Temporary compatibility is allowed only when atomic migration is technically unsafe, with exact remaining consumers, no-new-usage enforcement, and a removal target.

## 10. Verify owned contracts

Use applicable proof only:

- component contract tests for Vue API, mapping, controlled state, ARIA wiring, and structural ownership;
- browser tests for custom-element upgrade, focus, keyboard, pointer/touch, form/navigation behavior, cancellation, and cleanup that the adapter changes or constrains;
- visual regression for stable visible output with material regression risk;
- representative consumer checks for changed shared usage;
- production build for custom-element registration and bundled entry points;
- final repository verification.

Do not duplicate m3e or Lit unit tests, test private DOM, or claim official Material correctness from green automation alone.

## 11. Complete records

Before completion:

- set family status to `migrated` only when one canonical owner remains;
- record confirmed m3e deviations and unsupported surface;
- update `src/shared/ui/material/README.md` when physical ownership changes;
- update `docs/material-3/roadmap.md` only when milestone state, blocker, or next action changes;
- keep unrelated families and records unchanged.

## Completion report

Finish with:

```text
MATERIAL ADAPTER RESULT
Family:
Change mode:
Renderer version and entry point:
Renderer viability: ready | blocked-upstream | retain-legacy
Canonical Vue owner:
Supported surface:
Unsupported surface:
Consumers migrated:
Legacy owner removal: complete | not applicable | blocked
Confirmed m3e deviations: none | <summary>
Verification:
Roadmap update: none | <summary>
Status: complete | blocked (<exact reason>)
```

`complete` requires the family exit gate from `docs/material-3/component-adapter.md`, applicable focused checks, and final repository verification.
