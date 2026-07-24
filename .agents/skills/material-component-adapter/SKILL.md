---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Mioframe Material component or inseparable family as a stable Vue MD* API backed privately by @m3e/web when its documented public contract is sufficient.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/ui/**/MD*.vue'
---

# Material component adapter

Implement one explicitly selected public Material component, or one proven inseparable family, end to end through the Mioframe Vue-to-m3e boundary.

## Canonical rules

Read first:

- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- applicable `AGENTS.md` files;
- the selected component's current implementation notes and planned family README.

Normal ownership is already resolved:

```text
product consumers
  → public Mioframe Vue MD* component
  → private documented @m3e/web custom element
```

Use `architect-handoff` only when the task changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another decision unresolved by the canonical documents.

## Scope

A component or family name is sufficient input. Resolve one explicit migration target. Expand to a family only when current code ownership makes component-only migration technically unsafe, and record that evidence before implementation.

Do not combine unrelated components, general shared UI cleanup, global theme replacement, or speculative adapter infrastructure.

For M1, the target is `MDButton` only. Do not migrate `MDIconButton`, `MDFab`, or `MDExtendedFab` unless repository evidence proves a technically inseparable owner and the roadmap is updated before production edits.

## 1. Resolve current scenarios and ownership

Inspect the current implementation, public exports, direct consumers, required user flows, props, emits, slots, native behavior, extensions, stories, tests, implementation notes, known defects, and current roadmap milestone.

Record:

- migration target;
- required scenarios and non-goals;
- current implementation owner;
- canonical owner after migration;
- affected consumers;
- change mode: `new-adapter`, `end-to-end-migration`, or `adapter-change`;
- implementation ownership: `legacy`, `migrating`, or `migrated`.

## 2. Resolve Material requirements

Use the configured `material3` MCP and its validated cache snapshot as the coding agent's normative interface to official Material 3 Expressive guidance. Inspect only requirements needed by current scenarios: usage, variants, sizes, states, content, accessibility, visual and interaction behavior, and token meaning.

Record inspected MCP records, original official routes, and snapshot metadata. Do not browse or scrape the Material site directly, rely on memory, reproduce the full documentation, or implement optional surface without a current scenario.

## 3. Select and inspect the exact m3e contract

Inspect a current stable, non-prerelease version through primary package evidence. Verify:

- exact package version and peer dependencies;
- package exports and required family entry point;
- declarations and Custom Elements Manifest;
- properties and reflected attributes;
- events, cancellation, and ordering;
- slots and content restrictions;
- form and navigation behavior;
- keyboard, pointer, disabled, selected, and lifecycle behavior;
- documented CSS variables;
- exposed accessibility behavior.

Record the exact version and entry point in the family README before production edits. Do not use a version range, another version's examples, shadow DOM, copied source, or undocumented internals.

## 4. Decide renderer viability

Set renderer viability independently from implementation ownership:

- `unassessed` — exact version and required contract are not yet verified;
- `ready` — every required scenario is available through documented public APIs and a thin adapter;
- `blocked-upstream` — a required public renderer contract is missing, defective, or unstable.

When blocked, record the exact missing contract, keep implementation ownership `legacy`, and stop before replacement implementation. A similarly named m3e element is not proof of readiness.

## 5. Complete the family contract

Create or update `src/shared/ui/material/components/<family>/README.md` according to `src/shared/ui/material/docs/component-adapter.md`.

The contract must define the explicit migration target, renderer viability, implementation ownership, required scenarios, non-goals, supported and unsupported Material surface, public Vue API, exact renderer version and entry point, custom-element recognition and registration ownership, explicit property/attribute/event/slot/state/token mapping, controlled-state semantics, native semantics, consumers, verification, obsolete-owner removal, and unresolved blockers.

Do not mechanically copy the m3e API or expose renderer element and event types.

## 6. Run implementation preflight

Use `implementation-preflight` before production edits. Record the family contract, owners, public entry points, minimum adapter design, simpler alternative, exact passes, `TEST IMPACT`, and final verification.

Do not implement while renderer viability is not `ready`, the family contract has unresolved decisions, or implementation ownership cannot move atomically from `legacy` through `migrating` to `migrated`.

## 7. Implement dependency and custom-element integration

The first adapter may add only:

- the exact pinned `@m3e/web` dependency and verified peers;
- shared Vue compiler recognition of `m3e-*` for application, Storybook, and tests;
- the selected component's required family entry-point import.

Shared build configuration owns recognition. The selected family owns registration through its implementation import.

Forbidden:

- all-components imports;
- global runtime registration;
- component registry;
- support for multiple m3e versions;
- runtime renderer switching.

## 8. Implement the thin adapter

Normally implement only explicit bindings, named slots, event normalization, controlled-state synchronization, required native integration, narrow private token mapping, and confirmed Mioframe extensions.

Forbidden unless later evidence proves a shared need:

- wrapper generator or universal base component;
- generic property/event schema;
- token mapping DSL;
- broad options object;
- shadow-DOM access;
- copied m3e internals;
- duplicate state-layer, ripple, focus, or motion implementation.

Extract a shared helper only after two unrelated adapters prove an identical concrete need and extraction reduces total complexity.

## 9. Preserve controlled state and native behavior

Vue props remain the source of truth. m3e interaction provides intent, the wrapper emits the stable Vue event, the consumer updates state, and the wrapper prevents renderer drift. Programmatic prop updates must not emit false user actions.

Preserve applicable native button, link, form, focus, keyboard, disabled, readonly, and accessibility semantics.

## 10. Migrate consumers and remove target ownership

For `end-to-end-migration`:

- set implementation ownership to `migrating`;
- create the canonical target owner;
- migrate every affected target usage;
- preserve required scenarios;
- update target-owned barrels, stories, tests, visual mappings, and documentation;
- remove the obsolete target implementation and exclusively owned compatibility paths;
- leave unrelated legacy components and shared modules intact;
- set implementation ownership to `migrated` only when one public target owner remains.

Temporary compatibility is allowed only when atomic migration is technically unsafe, with exact remaining consumers, no-new-usage enforcement, and a removal target.

## 11. Verify owned contracts

Every public `MD*` adapter requires a colocated `<Component>.test.ts` component-contract test for its Vue API and explicit integration mapping.

Add browser, visual, representative-consumer, and production-build proof according to the family contract. The `MDButton` and `MDSwitch` pilots require all of these proof types.

Do not duplicate m3e or Lit unit tests, test private DOM, or claim Material correctness from green automation alone.

## 12. Complete records

Record confirmed m3e deviations and unsupported surface. Update `src/shared/ui/material/README.md` when physical ownership changes and `src/shared/ui/material/docs/roadmap.md` only when milestone state, blocker, or next action changes.

## Completion report

```text
MATERIAL ADAPTER RESULT
Family:
Migration target:
Change mode:
Renderer package, version, and entry point:
Renderer viability: unassessed | ready | blocked-upstream
Implementation ownership: legacy | migrating | migrated
Canonical Vue owner:
Supported surface:
Unsupported surface:
Consumers migrated:
Legacy target removal: complete | not applicable | blocked
Unrelated legacy components preserved:
Confirmed m3e deviations: none | <summary>
Verification:
Roadmap update: none | <summary>
Status: complete | blocked (<exact reason>)
```

`complete` requires the component exit gate from `src/shared/ui/material/docs/component-adapter.md`, required focused checks, and final repository verification.
