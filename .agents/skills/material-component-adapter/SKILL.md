---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Mioframe Material component family as a stable Vue MD* API backed privately by @m3e/web when its documented public contract is sufficient.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/ui/**/MD*.vue'
---

# Material component adapter

Implement one official Material family end to end through the Mioframe Vue-to-m3e boundary.

## Canonical rules

Read first:

- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- applicable `AGENTS.md` files;
- the selected family's current or planned `README.md`.

Normal ownership is already resolved:

```text
product consumers
  → public Mioframe Vue MD* component
  → private documented @m3e/web custom element
```

Use `architect-handoff` only when the task changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another unresolved decision.

## Scope

A component or family name is sufficient input. Resolve one cohesive family and complete at most that family. Do not combine unrelated families, general shared UI cleanup, global theme replacement, or speculative adapter infrastructure.

## 1. Resolve current scenarios

Inspect the current implementation, public exports, direct consumers, required user flows, props, emits, slots, native behavior, extensions, stories, tests, known defects, and current roadmap milestone.

Record required scenarios, non-goals, current and canonical owner, affected consumers, and change mode: `new-adapter`, `end-to-end-migration`, or `adapter-change`.

## 2. Resolve Material requirements

Use the configured `material3` MCP and its validated cache snapshot as the coding agent's normative interface to official Material 3 Expressive guidance. Inspect only requirements needed by current scenarios: usage, variants, sizes, states, content, accessibility, visual and interaction behavior, and token meaning.

Record inspected MCP records, original official routes, and snapshot metadata. Do not browse or scrape the Material site directly, rely on memory, reproduce the full documentation, or implement optional surface without a current scenario.

## 3. Inspect the exact m3e contract

Inspect the version that will be pinned or is pinned. Verify package exports, family entry point, declarations, Custom Elements Manifest, properties, attributes, events and ordering, slots, form/navigation behavior, keyboard and pointer behavior, lifecycle, documented CSS variables, and exposed accessibility behavior.

Do not rely on another version, shadow DOM, copied source, or undocumented internals.

## 4. Decide renderer viability

Set exactly one status:

- `ready` — every required scenario is available through documented public APIs and a thin adapter;
- `blocked-upstream` — a required public renderer contract is missing or defective;
- `retain-legacy` — the current implementation remains the safe owner until the blocker is resolved.

When blocked, record the exact missing contract and stop before replacement implementation. A similarly named m3e element is not proof of readiness.

## 5. Complete the family contract

Create or update `src/shared/ui/material/components/<family>/README.md` according to `src/shared/ui/material/docs/component-adapter.md`.

The contract must define required scenarios, non-goals, supported and unsupported Material surface, public Vue API, exact renderer version and entry point, explicit property/attribute/event/slot/state/token mapping, controlled-state semantics, native semantics, consumers, verification, obsolete-owner removal, and unresolved blockers.

Do not mechanically copy the m3e API or expose renderer element and event types.

## 6. Run implementation preflight

Use `implementation-preflight` before production edits. Record the family contract, owners, public entry points, minimum adapter design, simpler alternative, passes, `TEST IMPACT`, and final verification. Do not implement while renderer viability or the family contract is unresolved.

## 7. Implement the thin adapter

Normally implement only the required family import, explicit bindings, named slots, event normalization, controlled-state synchronization, required native integration, narrow private token mapping, and confirmed Mioframe extensions.

Forbidden unless later evidence proves a shared need:

- wrapper generator or universal base component;
- runtime component registry;
- generic property/event schema;
- token mapping DSL;
- broad options object;
- renderer switching;
- shadow-DOM access;
- copied m3e internals;
- duplicate state-layer, ripple, focus, or motion implementation.

Extract a shared helper only after two unrelated adapters prove an identical concrete need and extraction reduces total complexity.

## 8. Preserve controlled state and native behavior

Vue props remain the source of truth. m3e interaction provides intent, the wrapper emits the stable Vue event, the consumer updates state, and the wrapper prevents renderer drift. Programmatic prop updates must not emit false user actions.

Preserve applicable native button, link, form, focus, keyboard, disabled, readonly, and accessibility semantics.

## 9. Migrate consumers and remove ownership

For `end-to-end-migration`, create the canonical owner, migrate every affected usage, preserve required scenarios, update barrels and proof, remove obsolete implementation and compatibility paths, and leave no new legacy usage.

Temporary compatibility is allowed only when atomic migration is technically unsafe, with exact remaining consumers, no-new-usage enforcement, and a removal target.

## 10. Verify owned contracts

Use component contract tests for Vue API and mapping, browser tests for real custom-element integration, visual regression for stable visible output, representative consumer checks, production build proof, and final repository verification as applicable.

Do not duplicate m3e or Lit unit tests, test private DOM, or claim Material correctness from green automation alone.

## 11. Complete records

Set a family to `migrated` only when one canonical owner remains. Record confirmed m3e deviations and unsupported surface. Update `src/shared/ui/material/README.md` when physical ownership changes and `src/shared/ui/material/docs/roadmap.md` only when milestone state, blocker, or next action changes.

## Completion report

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

`complete` requires the family exit gate from `src/shared/ui/material/docs/component-adapter.md`, applicable focused checks, and final repository verification.
