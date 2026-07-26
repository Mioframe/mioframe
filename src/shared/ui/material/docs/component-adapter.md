# Material component adapter contract

This document defines the minimum accepted contract for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named public `MD*` component.

```text
accepted current Mioframe scenarios
+ canonical documented m3e surface
  → relevant Material guidance
  → thin Vue adapter
  → consumer migration
  → risk-based verification
```

Do not turn one migration into a complete audit of Material or m3e.

## Supported surface

Cover the minimum complete union of:

1. observable scenarios required by current Mioframe consumers;
2. documented m3e capabilities that belong to the canonical Material component and can be exposed through direct typed mappings.

This does not require copying raw renderer vocabulary, preserving legacy internals, or creating one test per capability.

## Accepted requirement evidence

The family README is the accepted requirement record. Each required behavior must state an observable outcome and cite at least one source:

- current production consumer;
- intentional public Mioframe documentation;
- explicit product or architecture decision.

Legacy implementation details are discovery evidence only. Internal timing, private state, CSS selectors, snapshots, test fixtures, or historical mechanisms do not become public requirements merely because they existed.

A source difference discovered after reading m3e implementation cannot be promoted to a requirement without the evidence above. Otherwise record it as renderer-owned behavior or a possible upstream improvement and continue.

## Family README

Record only implementation-relevant facts:

- accepted scenarios and evidence;
- canonical documented m3e surface;
- public Vue API and typed mappings;
- native and controlled-state semantics;
- project extensions;
- active public tokens, if any;
- Material/m3e divergences and decisions;
- required verification and operator review;
- genuine blockers only.

Do not reproduce complete Material or m3e documentation.

## Renderer viability

Use:

- `unassessed` before the exact required surface is verified;
- `ready` when accepted scenarios and selected m3e capabilities are deliverable through documented APIs and allowed thin corrections;
- `blocked-upstream` only when an accepted Mioframe requirement is observably defective and cannot be corrected safely.

### Blocker evidence gate

Before `blocked-upstream`, prove all of:

1. the behavior was already accepted as required under the requirement evidence rule;
2. m3e produces a concrete observable regression against that outcome;
3. a current consumer, public promise, native/accessibility guarantee, or explicit decision is affected;
4. no documented m3e API or safe thin correction can satisfy it.

If any item is missing, viability remains `ready` for the resolved scope. Do not restore legacy ownership for different renderer timing, internal pressed-state duration, expanded-target implementation, ripple, focus, elevation, or motion mechanics alone.

## Material/m3e divergence classification

Compare only the supported surface:

| Material expectation | Exact m3e behavior/version | Required by Mioframe | Evidence | Decision |
| --- | --- | --- | --- | --- |
| observable expectation | actual behavior | yes or no | accepted requirement or none | accept, wrapper correction, upstream follow-up, or blocker |

- **not required** — record for possible m3e improvement; no adapter work;
- **required and thinly correctable** — implement the smallest correction using documented APIs or Mioframe-owned light DOM;
- **required but not safely correctable** — blocker only after the evidence gate passes;
- equivalent observable behavior implemented differently is not a divergence.

## Public Vue and renderer type boundary

The public API follows canonical Material concepts and project conventions. Keep props, emits, slots, defaults, invalid combinations, controlled state, native behavior, and extensions explicit.

The exact m3e family entry point owns private renderer types. Derive mappings and Vue custom-element glue from package exports. Do not hand-copy renderer property lists, literal unions, defaults, or a parallel renderer interface.

## Adapter implementation

Normally include only:

- required family registration;
- package-derived types;
- explicit property, attribute, slot, and event mappings;
- controlled-state synchronization;
- required native integration;
- current Mioframe extensions;
- active public token mappings;
- narrow corrections for evidenced required divergences.

Do not add a generic wrapper framework, direct Lit dependency, private shadow-DOM integration, copied internals, or duplicated m3e interaction systems.

## Compatibility

Preserve accepted observable Mioframe scenarios, including project extensions such as loading. Do not preserve every legacy mechanism.

A newly exposed m3e capability has no legacy parity requirement unless Mioframe already depended on an equivalent contract.

## Tokens

Preserve only active public tokens with consumer evidence or an intentional Mioframe promise. A documented m3e variable does not automatically require a Mioframe alias. Prefer existing system roles and remove unused legacy routes. Do not build a parallel component theme.

## Verification

Verification proves Mioframe-owned contracts:

- package-derived type-check;
- component-contract tests for Vue API, mapping, controlled state, and extensions;
- browser tests for accepted scenarios changed or constrained by the adapter;
- visual regression for stable Mioframe-visible output with meaningful risk;
- final `pnpm verify`.

Dedicated theme, RTL, token, consumer, or build proof is conditional on actual Mioframe ownership or risk.

## Renderer-owned motion

Inspect the exact installed source and record relevant state-transition, interruption, and reduced-motion paths. Confirm the wrapper does not disable or duplicate them. Actual animation quality and timing require operator testing.

Do not use `:active`, screenshots, or private DOM inspection as proof of internal animation. Internal minimum pressed duration or expanded-target-driven pressed state is not a blocker without an independently accepted observable requirement.

## Completion gate

A target completes when one canonical Vue owner remains, consumers are migrated, accepted scenarios are preserved, package-derived typing is used, required divergences are resolved, only active public tokens remain, risk-based verification passes, and operator accepts the first canonical visual and motion result.

Do not keep a target `migrating` because optional surface lacks exhaustive tests. Do not stop because an incidental legacy mechanism differs from m3e.
