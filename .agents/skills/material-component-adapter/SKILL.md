---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Mioframe Material component as a stable Vue MD* API backed privately by @m3e/web.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/ui/**/MD*.vue'
---

# Material component adapter

Implement one explicitly selected public Material component end to end through the Mioframe Vue-to-m3e boundary.

## Read first

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- the selected family README;
- applicable parent `AGENTS.md` files.

A component name is sufficient input. For M1, work on `MDButton` only.

## Scope

Implement the minimum complete union of:

1. accepted current Mioframe scenarios;
2. documented m3e capabilities that map directly to the canonical Material/Vue component without renderer reconstruction.

Do not copy every m3e property, event, slot, or CSS variable; build a complete Material token catalogue; preserve every legacy internal mechanism; or migrate unrelated components.

## 1. Resolve accepted scenarios

Inspect current consumers, public API, native and controlled-state behavior, project extensions, stories, tests, family README, and roadmap.

A Mioframe requirement must be an observable outcome already accepted in the family README and supported by at least one of:

- a current production consumer;
- intentional public Mioframe documentation;
- an explicit product or architecture decision.

Legacy source, internal timing, CSS selectors, snapshots, historical tests, and renderer implementation differences are evidence to inspect, not requirements by themselves.

Do not invent or retroactively promote a requirement after discovering that m3e works differently. Preserve accepted observable scenarios, not incidental legacy mechanics.

## 2. Inspect relevant Material and m3e contracts

Use the configured Material source only for guidance relevant to accepted scenarios and the selected m3e surface.

Inspect the exact lockfile-resolved stable m3e family entry point:

- package version, exports, peer requirements, and registration entry;
- exported element and value types;
- declarations, tag map, manifest, documented properties, events, slots, native behavior, accessibility, and CSS variables;
- implementation source only where necessary to assess renderer-owned behavior such as animation.

Do not use another version, prerelease behavior, private shadow DOM, copied internals, or undocumented APIs.

## 3. Compare m3e with Material

Compare only the supported surface. Record each confirmed difference with:

- Material expectation;
- exact m3e behavior and version;
- whether Mioframe requires the observable outcome;
- requirement evidence;
- decision.

Classify it as:

- **not required by Mioframe** — record for possible upstream m3e improvement and continue;
- **required and thinly correctable** — implement the smallest correction through documented m3e APIs or Mioframe-owned light DOM;
- **required but not safely correctable** — blocker only after the blocker gate passes.

Equivalent observable behavior implemented differently is not a divergence.

## 4. Renderer viability and blocker gate

Use:

- `unassessed` — exact required surface not verified;
- `ready` — accepted scenarios and selected m3e surface are deliverable through documented APIs and allowed thin corrections;
- `blocked-upstream` — an accepted Mioframe requirement is observably defective and cannot be corrected safely.

Before `blocked-upstream`, prove all of:

1. the behavior already passed the accepted requirement evidence rule;
2. m3e causes a concrete observable regression against that outcome;
3. a current consumer, public promise, native/accessibility guarantee, or explicit decision is affected;
4. no documented m3e API or safe thin correction can satisfy it.

If any item is missing, keep viability `ready` and record the observation as renderer-owned behavior or an upstream follow-up.

Different internal press timing, minimum pressed duration, expanded-target implementation, ripple, focus, elevation, or animation state does not justify a blocker or legacy restoration by itself.

## 5. Complete the family contract

Record only implementation-relevant decisions:

- accepted scenarios and evidence;
- selected m3e surface;
- public Vue API and typed mapping;
- native and controlled-state semantics;
- project extensions;
- active public tokens, if any;
- confirmed divergences and decisions;
- risk-based verification and operator review;
- genuine blockers only.

## 6. Implement the thin adapter

- Import only the required m3e family entry point.
- Derive renderer element and value typing from package exports.
- Keep Mioframe props independently owned and mappings type-checked against m3e.
- Keep Vue ambient declarations to package-derived framework glue.
- Implement explicit property, attribute, slot, event, controlled-state, native, and extension mappings.
- Add only narrow corrections for evidenced Mioframe-required divergences.
- Map public tokens only when Mioframe actually exposes an active contract.

Do not add Lit directly, access private shadow DOM, copy internals, duplicate renderer interaction systems, or create a generic adapter framework.

## 7. Consumers and tokens

Migrate all target consumers and exports, remove target-owned obsolete implementation and compatibility paths, and leave unrelated components intact.

Preserve only active tokens backed by real consumer evidence or an intentional Mioframe promise. A documented `--m3e-*` variable does not require a public Mioframe alias. Remove unused declaration-only and test-only routes.

## 8. Verification

Required baseline:

- package-derived type-check;
- component-contract tests for Vue API, mapping, controlled state, and extensions;
- focused browser tests for accepted user/native behavior changed or constrained by the adapter;
- meaningful stable visual baselines for Mioframe-visible output;
- final `pnpm verify`.

Dedicated theme, RTL, token, consumer, or build proof is conditional on actual Mioframe ownership or risk. Do not create exhaustive proof for renderer-owned optional surface.

### Renderer-owned animation

- Inspect the exact installed source and record relevant state transitions, interruption handling, and reduced-motion path.
- Confirm the adapter does not disable, replace, or duplicate the implementation.
- Require operator manual testing for actual visual quality and timing.
- Do not use `:active`, screenshots, or private DOM tests as proof of internal animation.

Internal duration or hit-target-driven pressed state is not a blocker unless an independently accepted observable requirement passes the requirement and blocker gates.

## 9. Completion

A target may be `migrated` when one canonical Vue owner remains, consumers are migrated, accepted scenarios are preserved, package-derived typing is used, required divergences are resolved, only active tokens remain, risk-based verification passes, and operator accepts the first canonical visual and motion result.

Complete all repository-local work inside this bounded scope. Do not invent requirements or new scope to avoid finishing. `partial` is valid when only operator acceptance or a genuine external blocker remains.

## Report

```text
MATERIAL ADAPTER RESULT
Family:
Migration target:
Renderer package, resolved version, entry point, and type source:
Renderer viability: unassessed | ready | blocked-upstream
Implementation ownership: legacy | migrating | migrated
Accepted Mioframe scenarios and evidence:
Selected m3e surface:
Public Vue API:
Confirmed m3e divergences: none | <summary, evidence, decision>
Wrapper corrections: none | <summary>
Active public tokens: none | <summary>
Consumers migrated:
Legacy target removal: complete | not applicable | blocked
Automated verification:
Operator visual and motion acceptance: accepted | required | blocked
Status: complete | partial (<operator/external remainder>) | blocked (<exact evidenced reason>)
```
