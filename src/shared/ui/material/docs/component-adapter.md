# Material component adapter contract

This document defines the minimum accepted contract for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named public `MD*` component. Expand to a family only when current ownership proves component-only migration unsafe.

```text
current Mioframe scenarios
+ documented m3e capabilities belonging to the canonical Material component
  → relevant official Material guidance
  → family contract
  → thin Vue adapter
  → consumer migration
  → risk-based verification
```

Do not turn one migration into a complete audit of Material or m3e.

## Supported surface

The family contract covers the minimum complete union of:

1. behavior required by current Mioframe consumers;
2. documented m3e capabilities that belong to the canonical Material component surface and can be exposed through direct typed mappings.

This does not require copying raw renderer vocabulary or creating one test per capability. Optional Material surface unsupported by both Mioframe and m3e remains outside scope.

## Family README

Before production edits, create or update:

```text
src/shared/ui/material/components/<family>/README.md
```

Record only implementation-relevant facts:

```text
Family:
Migration target:
Renderer viability: unassessed | ready | blocked-upstream
Implementation ownership: legacy | migrating | migrated
Current and canonical owner:
Current Mioframe scenarios:
Canonical documented m3e surface:
Non-goals:
Official Material sources:
Public Vue API:
Renderer package, exact version, entry point, and type source:
Vue-to-m3e mapping:
Controlled-state and native semantics:
Project extensions:
Active public tokens: none | <contracts>
Confirmed m3e divergences and decisions:
Affected consumers:
Required verification:
Operator review:
Unresolved: none | <blocking decisions>
```

Do not reproduce complete Material or m3e documentation.

## Discovery

Inspect only the selected target:

- current owner, exports, direct consumers, stories, tests, and known defects;
- required Mioframe user/native/accessibility scenarios and project extensions;
- official Material guidance needed to assess the selected surface;
- exact lockfile-resolved m3e family entry point, exported types, declarations, manifest, documented behavior, CSS variables, and implementation source where renderer-owned behavior must be assessed;
- active public Mioframe tokens with real consumer or documentation evidence;
- integration configuration changed by the migration.

Stop when the supported surface, divergence decisions, and minimum adapter are resolved.

## Renderer viability

Use:

- `unassessed` before the exact required surface is verified;
- `ready` when current Mioframe scenarios and canonical documented m3e capabilities can be delivered through documented public APIs plus allowed thin corrections;
- `blocked-upstream` when a Mioframe-required contract is missing or defective and cannot be corrected safely in the wrapper.

Do not block migration because m3e lacks:

- an unused Material capability;
- an unused legacy tuning input;
- an internal implementation detail;
- a public CSS variable that Mioframe does not expose.

A blocker must identify a current Mioframe requirement, observable impact, and why no documented m3e API or safe thin correction can satisfy it.

## m3e divergence classification

Compare official Material guidance only with the supported surface.

Record confirmed differences in a compact table:

| Material expectation | Exact m3e behavior/version | Required by Mioframe | Decision                                                   |
| -------------------- | -------------------------- | -------------------- | ---------------------------------------------------------- |
| expected behavior    | observed implementation    | yes or no            | accept, wrapper correction, upstream follow-up, or blocker |

Rules:

- **not required by Mioframe** — record for possible m3e improvement; no adapter work;
- **required and thinly correctable** — implement the smallest explicit correction using documented m3e APIs or Mioframe-owned light DOM;
- **required but not safely correctable** — keep legacy ownership and record an upstream blocker;
- equivalent observable behavior implemented differently is not a divergence.

## Public Vue API

The public API follows canonical Material concepts and project conventions.

- expose current scenarios and canonical documented m3e capabilities as one coherent Vue API;
- keep props, emits, slots, defaults, and invalid combinations typed and explicit;
- keep consumer-controlled state in Vue;
- preserve native behavior needed by current scenarios and directly supported by the canonical m3e surface;
- normalize m3e events without leaking renderer event objects;
- keep Mioframe extensions explicit;
- do not copy raw renderer-only vocabulary unnecessarily.

## Renderer TypeScript contract

The exact family entry point owns private renderer types.

- Import exported element classes and value aliases with type-only imports.
- Keep Mioframe prop types independently owned.
- Require mapped values to satisfy package-exported types.
- Derive Vue custom-element property typing from package types or `HTMLElementTagNameMap`.
- Vue ambient declarations may add framework glue only.
- Do not hand-copy renderer property lists, literal unions, defaults, or a parallel complete renderer interface.

A compatibility shim is allowed only when the exact installed package exports no usable type for a required integration point. Record the missing export and removal condition.

## Adapter implementation

The wrapper normally contains only:

- required family registration import;
- package-derived type imports;
- explicit property and attribute binding;
- slot placement;
- event normalization;
- controlled-state synchronization;
- required native integration;
- current Mioframe extensions;
- active public token mapping;
- narrow Mioframe-required divergence corrections.

Do not add a generic helper, base component, event/property schema, token DSL, wrapper generator, direct Lit dependency, shadow-DOM integration, or duplicated m3e interaction system.

## Compatibility preservation

Preserve current Mioframe scenarios, including project-extension presentation such as loading.

A visible or behavioral difference must be:

1. preserved through the adapter;
2. explicitly approved as a product change;
3. recorded as a blocker.

Do not compare every newly exposed m3e capability with the legacy component. It has no legacy compatibility requirement unless Mioframe already depended on an equivalent contract.

## State and events

For consumer-controlled state:

- the Vue prop is the source of truth;
- m3e interaction provides intent;
- the wrapper emits the stable Vue event;
- the consumer updates state;
- the adapter prevents hidden renderer drift;
- programmatic prop updates do not emit false user actions.

## Tokens

Follow `component-tokens.md`.

- Preserve only active public tokens with consumer evidence or an intentional Mioframe API promise.
- A documented m3e CSS variable does not automatically require a public Mioframe alias.
- Prefer existing `--md-sys-*` roles when m3e already implements equivalent Material semantics.
- Map `--md-comp-*` only when Mioframe actually exposes that token.
- Remove declaration-only, test-only, and unused legacy token routes.
- Do not build a parallel component theme from all m3e defaults.

## Consumer migration

Move every in-repository consumer of the selected target to the canonical adapter and remove only target-owned obsolete implementation and compatibility paths.

Leave unrelated legacy components and shared modules intact.

## Verification

Verification proves Mioframe-owned contracts, not the m3e implementation itself.

Required baseline:

- type-check for package-derived renderer mappings;
- colocated component-contract tests for Vue API, mapping, state, and extensions;
- browser tests for current user/native scenarios changed or constrained by the adapter;
- visual regression for stable Mioframe-visible states with meaningful risk;
- final repository verification.

Additional proof is conditional:

- dedicated theme or RTL proof only when Mioframe customizes it or a current scenario depends on it;
- token override proof only for active public Mioframe tokens;
- representative-consumer proof only when consumer integration has material risk not already covered;
- dedicated Storybook/production build proof only when registration or build configuration changed and final verification does not already prove it.

Direct typed forwarding of documented m3e capabilities may be covered by representative component-contract tests rather than one test per property or slot.

Do not create exhaustive proof tables for m3e-owned optional surface.

## Renderer-owned animation

Animation inside private m3e DOM cannot be reliably proven through host proxies.

For renderer-owned animation:

- inspect the exact installed source and record the relevant state-transition, interruption, and reduced-motion implementation;
- verify that the wrapper does not disable, replace, or duplicate it;
- use operator manual testing for visual quality and timing;
- do not treat `:active`, host screenshots, or private DOM inspection as automated proof of the animation itself.

Automated tests may verify public input acquisition only when that is a current Mioframe scenario, and must state that limited claim accurately.

## Completion gate

A target is complete when:

- renderer viability is `ready` for the resolved supported surface;
- one canonical public Vue owner remains;
- package-derived renderer typing is used;
- all current consumers are migrated;
- current Mioframe scenarios and extensions are preserved;
- canonical documented m3e capabilities are exposed through thin typed mappings;
- confirmed divergences are recorded and required thin corrections are complete;
- only active accepted public tokens are retained;
- relevant risk-based automated verification passes;
- operator accepts the first canonical visual result and renderer-owned motion where applicable.

Do not keep a target `migrating` because m3e surface lacks exhaustive per-capability tests. `partial` is valid when all repository-local work inside this scope is complete and only operator acceptance or a genuine external blocker remains.
