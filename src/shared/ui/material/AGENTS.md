# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, `docs/roadmap.md`, and the selected family README.
- Use `material-component-adapter` for one explicitly selected component.
- Use `architect-handoff` only for unresolved cross-family ownership, renderer strategy, global theme ownership, or public architecture.
- Keep Material policy inside this library.

## Authority and ownership

- Official Material 3 Expressive documentation defines intended component meaning and behavior.
- Mioframe owns its public Vue API, current application scenarios, controlled state, extensions, consumer migration, and accepted public tokens.
- The exact lockfile-resolved `@m3e/web` public contract and exported types own the private renderer boundary.
- m3e is not the public API owner or independent Material authority.

## Supported surface

Implement the minimum complete union of:

1. scenarios currently required by Mioframe consumers;
2. documented m3e capabilities that map directly to the canonical Material/Vue component without renderer reconstruction.

Do not mirror every m3e property, event, slot, or CSS variable; recreate a complete Material token catalogue; or add wrapper logic for behavior m3e already provides correctly.

## Accepted requirement gate

A behavior is Mioframe-required only when the accepted family README states its observable outcome and it is supported by at least one of:

- a current production consumer;
- intentional public Mioframe documentation;
- an explicit product or architecture decision.

Legacy source, CSS selectors, internal timing, snapshots, old test mechanics, or a difference found while reading m3e source do not create a requirement by themselves.

A coding agent must not retroactively promote an incidental legacy mechanism into a required scenario. Preserve accepted observable behavior, not every previous implementation detail.

## m3e divergences and blockers

Compare only the supported surface. Classify each confirmed divergence:

- **not required by Mioframe** — record for possible m3e improvement and continue;
- **required and thinly correctable** — implement the smallest correction through documented m3e APIs or Mioframe-owned light DOM;
- **required but not safely correctable** — upstream blocker only when the blocker gate passes.

Before reporting `blocked-upstream`, prove:

1. the behavior already passed the accepted requirement gate;
2. m3e causes a concrete observable regression against that outcome;
3. a current consumer, public promise, native/accessibility guarantee, or explicit decision is affected;
4. no documented m3e API or safe thin correction can satisfy it.

If any item is missing, renderer viability remains `ready` for the resolved scope. Record the observation as renderer-owned behavior or an upstream follow-up. Different press timing, animation state, hit-target implementation, ripple, focus, elevation, or other renderer internals do not justify restoring legacy ownership by themselves.

Equivalent observable behavior implemented differently is not a divergence.

## Boundary and adapter design

Only code under `src/shared/ui/material` may import `@m3e/web`, render `m3e-*`, use renderer types, or map documented `--m3e-*` variables.

Do not leak renderer details, access private shadow DOM, use undocumented APIs, copy internals, duplicate renderer interaction systems, or create a generic adapter framework.

Keep consumer-controlled state in Vue. Preserve accepted Mioframe extensions such as loading. For M1, migrate `MDButton` only; unrelated Button components remain legacy-owned.

## Renderer typing

- Derive renderer properties and values from the exact family entry-point exports.
- Keep the Mioframe Vue API independently defined.
- Keep Vue ambient declarations to package-derived framework glue.
- Do not hand-copy renderer property lists or literal unions when usable package types exist.

## Theme and tokens

- Preserve only accepted active public tokens with real consumer evidence or an intentional Mioframe promise.
- A documented `--m3e-*` variable does not require a public `--md-comp-*` counterpart.
- Prefer existing system roles when m3e already implements equivalent Material semantics.
- Remove declaration-only, test-only, and unused legacy routes.
- Do not build a parallel component theme.

## Motion verification

For renderer-owned motion:

- inspect the exact installed implementation source;
- confirm the adapter does not disable, replace, or duplicate it;
- require operator manual testing for visual quality and timing;
- do not use `:active`, screenshots, or private DOM tests as proof of internal animation.

An internal minimum press duration, release strategy, or hit-target-driven pressed state is not a Mioframe blocker unless an independently accepted observable requirement passes both gates above.

## Verification and completion

Verification is risk-based and limited to Mioframe-owned contracts: package-derived type-check, component-contract tests, focused browser tests for accepted scenarios, meaningful stable visual baselines, and final `pnpm verify`.

Dedicated theme, RTL, token, consumer, or build proof is needed only when Mioframe customizes that boundary, a current scenario depends on it, or final verification does not cover it.

A migration completes when one canonical Vue owner remains, consumers are migrated, accepted scenarios are preserved, package-derived typing is used, required divergences are resolved, only active public tokens remain, verification passes, and operator accepts the first canonical visual and motion result.

A skill invocation must complete all repository-local work inside this bounded scope and must not invent requirements or new scope to avoid finishing. `partial` is valid when only operator acceptance or a genuine external blocker remains.
