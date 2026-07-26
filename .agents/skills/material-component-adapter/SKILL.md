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
- the selected component's current implementation notes and family README.

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

Inspect the current implementation, public exports, direct consumers, required user flows, props, emits, slots, native behavior, project extensions, stable visible presentation, stories, tests, implementation notes, known defects, and current roadmap milestone.

Record:

- migration target;
- required scenarios and non-goals;
- current implementation owner;
- canonical owner after migration;
- affected consumers;
- change mode: `new-adapter`, `end-to-end-migration`, or `adapter-change`;
- implementation ownership: `legacy`, `migrating`, or `migrated`.

For every current scenario, record the accepted observable result, including visible content/layout for project extensions such as loading. A prop name or green test does not prove that the scenario was preserved.

For legacy CSS surface, classify each candidate retained token according to `component-tokens.md`: declared, internally consumed, behaviorally effective, externally consumed, publicly documented, test-only, or obsolete. Do not treat a declaration or value-only test as proof of an active public contract.

## 2. Resolve Material requirements

Use the configured `material3` MCP and its validated cache snapshot as the coding agent's normative interface to official Material 3 Expressive guidance. Inspect only requirements needed by current scenarios: usage, variants, sizes, states, content, accessibility, visual and interaction behavior, and token meaning.

Record inspected MCP records, original official routes, and snapshot metadata. Do not browse or scrape the Material site directly, rely on memory, reproduce the full documentation, or implement optional surface without a current scenario.

## 3. Select and inspect the resolved m3e contract

Inspect the exact lockfile-resolved version of a current stable, non-prerelease m3e release through primary package evidence. Verify:

- exact resolved package version and peer dependency requirements;
- package exports and required family entry point;
- exported element class, value aliases, declarations, `HTMLElementTagNameMap`, and Custom Elements Manifest;
- properties and reflected attributes;
- events, cancellation, and ordering;
- slots and content restrictions;
- form and navigation behavior;
- keyboard, pointer, disabled, selected, and lifecycle behavior;
- documented CSS variables and their Material component/system semantics;
- exposed accessibility behavior.

Record the compatible package range, exact lockfile-resolved version, family entry point, and exact exported types used by the adapter before production edits. Do not use `latest`, a wildcard, a prerelease, another version's examples, shadow DOM, copied source, or undocumented internals.

A documented m3e CSS variable with semantically equivalent component, state, part, and property meaning is a valid mapping target even when its name is not character-for-character identical to the official Material token path.

## 4. Decide renderer viability

Set renderer viability independently from implementation ownership:

- `unassessed` — the exact lockfile-resolved version and required contract are not yet verified;
- `ready` — every required user, native, accessibility, controlled-state, active public styling, and typing scenario is available through documented public APIs and a thin adapter;
- `blocked-upstream` — a required active public renderer contract is missing, defective, or unstable.

Do not equate exact legacy implementation parity with readiness. Renderer-owned equivalent ripple, focus, state-layer, elevation, or motion behavior is sufficient when it preserves the accepted observable contract and no active Mioframe consumer requires the old low-level tuning input.

### Blocker evidence gate

Before reporting `blocked-upstream`, prove all of the following in the family README:

1. the missing capability belongs to a current user scenario or active public consumer contract;
2. repository evidence identifies the consumer, documented promise, or required observable result;
3. removing or changing it causes an observable regression, not only a different custom-property value, alias, type spelling, or implementation detail;
4. no documented m3e property, attribute, event, slot, semantically equivalent CSS variable, exported type, or renderer-owned equivalent behavior satisfies it through a thin adapter.

The following do not satisfy the blocker gate by themselves:

- a legacy custom property is declared;
- a test reads its resolved value;
- the token has an official-looking name;
- m3e does not expose an unused internal tuning parameter;
- m3e implements the same observable behavior with a different internal mechanism.

Classify these as obsolete legacy surface, unsupported optional tuning, or renderer-owned behavior and continue when all required scenarios remain supported.

When genuinely blocked, record the exact missing contract, evidence of impact, and condition for reconsideration; keep implementation ownership `legacy`; and stop before replacement implementation. A similarly named m3e element is not proof of readiness.

## 5. Complete the family contract

Create or update `src/shared/ui/material/components/<family>/README.md` according to `src/shared/ui/material/docs/component-adapter.md`.

The contract must define:

- explicit migration target and ownership states;
- required scenarios, accepted observable results, and non-goals;
- supported and unsupported Material surface;
- public Vue API;
- compatible renderer range, exact lockfile-resolved version, and entry point;
- renderer type source and Vue typing strategy;
- custom-element recognition and registration ownership;
- explicit property/attribute/event/slot/state/token mapping;
- legacy-token evidence classification and canonical declaration transfer;
- controlled-state and native semantics;
- affected consumers and obsolete-owner removal;
- compatibility deltas;
- scenario-to-proof ledger with exact test/story/spec ownership;
- unresolved blockers or review findings.

Do not mechanically copy the m3e API or expose renderer element and event types through the public Mioframe API.

## 6. Run implementation preflight

Use `implementation-preflight` before production edits. Record the family contract, owners, public entry points, minimum adapter design, simpler alternative, exact passes, compatibility comparison, `TEST IMPACT`, and final verification.

Do not implement while renderer viability is not `ready`, the family contract has unresolved architecture decisions, or implementation ownership cannot move atomically from `legacy` through `migrating` to `migrated`.

Existing review findings are implementation work, not a reason to restart architecture. Keep ownership `migrating` until every exit-gate finding is resolved.

## 7. Implement dependency, typing, and custom-element integration

The first adapter may add only:

- `@m3e/web` declared with the repository-standard compatible semver range;
- package-manager handling required by the selected renderer package without adding its implementation dependencies as direct Mioframe dependencies unless Mioframe imports them;
- shared Vue compiler recognition of `m3e-*` for application, Storybook, and tests;
- the selected component's required family entry-point import;
- minimal Vue typing glue derived from the same family entry point.

The lockfile owns the exact installed renderer version. Shared build configuration owns recognition. The selected family owns registration through its implementation import.

Use type-only imports from `@m3e/web/<family>` for the renderer element class and exported value types. Keep Mioframe props independently defined, but make every mapping result satisfy the package-exported renderer type.

Vue ambient declarations may add framework glue only. Derive renderer properties with `Pick`, indexed access, `InstanceType`, package `HTMLElementTagNameMap`, or another direct type relation. Do not create a parallel handwritten renderer interface or repeat literal unions already exported by m3e.

A compatibility shim is allowed only when the exact package exports no usable public type. Record the missing export and keep the shim to the smallest missing framework surface. It must have compile-time proof and a removal condition.

Forbidden:

- `latest`, wildcard, or prerelease renderer specifiers;
- all-components imports;
- global runtime registration;
- component registry;
- support for multiple m3e versions;
- runtime renderer switching;
- avoidable handwritten mirrors of renderer properties, literal unions, defaults, or element classes.

A lockfile-resolved m3e version change requires re-inspection of affected public contracts, exported types, and risk-selected adapter verification.

## 8. Implement the thin adapter

Normally implement only explicit typed bindings, named slots, event normalization, controlled-state synchronization, required native integration, narrow semantic token mapping, and confirmed Mioframe extensions.

Prefer direct `--md-sys-*` semantics when m3e documents the same system roles. Map active `--md-comp-*` contracts to documented semantically equivalent `--m3e-*` variables. Transfer canonical defaults for retained active component tokens before removing the legacy owner. Remove target-owned declaration-only or test-only token surface instead of recreating it.

Preserve the accepted visible presentation and layout of project extensions such as loading unless the family contract records an explicit approved change. Do not treat a visually different result as equivalent merely because the prop still works.

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

Preserve applicable native button, link, form, focus, keyboard, disabled, readonly, and accessibility semantics. Required native variants and input methods must be explicitly represented in the proof ledger; one activation path does not prove every required path.

## 10. Migrate consumers and remove target ownership

For `end-to-end-migration`:

- set implementation ownership to `migrating`;
- create the canonical target owner;
- migrate every affected target usage;
- preserve required scenarios and accepted observable presentation;
- update target-owned barrels, stories, tests, visual mappings, and documentation;
- transfer retained active token declarations and mappings;
- remove the obsolete target implementation and exclusively owned compatibility paths;
- remove declaration-only, test-only, and otherwise obsolete token surface owned only by the target;
- leave unrelated legacy components and shared modules intact;
- set implementation ownership to `migrated` only after the complete exit gate passes.

Temporary compatibility is allowed only when atomic migration is technically unsafe, with exact remaining consumers, no-new-usage enforcement, and a removal target.

## 11. Verify owned contracts

Every public `MD*` adapter requires:

- type-check proof derived from the exact package-exported renderer types;
- a colocated `<Component>.test.ts` component-contract test for its Vue API and explicit integration mapping;
- browser, visual, representative-consumer, Storybook-build, and production-build proof according to the family contract;
- final repository verification.

The `MDButton` and `MDSwitch` pilots require all proof types above.

For each retained active public CSS token:

- ensure one canonical declaration remains after legacy removal;
- set an intentional non-default value through the Mioframe public surface;
- prove the intended rendered property or observable behavior changes;
- verify only documented m3e mapping, never private renderer DOM.

A declaration-value assertion alone does not establish a public token contract and cannot justify a blocker.

For renderer-owned motion, prove the claimed public outcome. `:active` alone proves only press acquisition; it does not prove shape morphing, release restoration, interruption safety, or reduced-motion behavior. Use public observables, pair interaction proof with bounded visual evidence when needed, and record any limitation instead of claiming an unproven result.

For visual proof, cover every materially distinct stable visible scenario in the family contract, including project extensions, themes, and RTL when they change output. Reuse a baseline when it truly covers multiple scenarios; do not build a Cartesian product. A refreshed baseline is not proof that a compatibility change was intended.

Before reporting completion, audit the scenario-to-proof ledger. Every required scenario must name exact passing proof or an explicit evidence-based reason no separate proof is needed.

Do not duplicate m3e or Lit unit tests, test private DOM, or claim Material correctness from green automation alone.

## 12. Complete records

Record confirmed m3e deviations, unsupported optional surface, renderer-owned behavior, renderer typing strategy, removed obsolete legacy surface, compatibility decisions, and proof status. Update `src/shared/ui/material/README.md` when physical ownership changes and `src/shared/ui/material/docs/roadmap.md` only when milestone state, blocker, or next action changes.

## Completion report

```text
MATERIAL ADAPTER RESULT
Family:
Migration target:
Change mode:
Renderer package range, resolved version, and entry point:
Renderer type source:
Renderer viability: unassessed | ready | blocked-upstream
Implementation ownership: legacy | migrating | migrated
Canonical Vue owner:
Supported surface:
Unsupported surface:
Removed obsolete legacy surface:
Compatibility changes: none | <approved changes>
Consumers migrated:
Legacy target removal: complete | not applicable | blocked
Unrelated legacy components preserved:
Confirmed m3e deviations: none | <summary>
Scenario proof coverage: complete | incomplete (<exact gaps>)
Automated verification:
Operator visual acceptance: accepted | required | blocked
Roadmap update: none | <summary>
Status: complete | partial (<exact remaining work>) | blocked (<exact evidenced reason>)
```

`complete` requires the component exit gate from `src/shared/ui/material/docs/component-adapter.md`, complete scenario-linked proof, final repository verification, and required operator visual acceptance. Never report `migrated` or `complete` while renderer typing is duplicated, active token ownership is incomplete, an observable compatibility delta is unapproved, or required proof is missing.
