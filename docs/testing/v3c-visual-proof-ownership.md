# Legacy Lists proof-ownership rationale

Status: completed rationale retained for the current legacy Lists proof. The canonical project-wide testing and verification contract is `docs/testing/architecture.md`; current executable state is `docs/testing/migration-plan.md`.

This document exists only because the current `src/shared/ui/Lists/MDList.behavior.spec.ts` intentionally retains a small set of legacy Lists browser checks whose rationale is not obvious from the test body alone. It is not a verifier roadmap, migration plan, or alternate testing policy.

## Current proof ownership

The current repository uses the normal verification taxonomy:

- deterministic Vue/component semantics: colocated `*.test.ts`;
- reusable real-browser interaction: owner-local `*.behavior.spec.ts`;
- bounded accepted appearance: owner-local `*.visual.spec.ts`;
- complete product flows: structural page/widget `*.e2e.spec.ts`.

For legacy Lists specifically, the durable current owners are:

```text
src/shared/ui/Lists/*.test.ts
src/shared/ui/Lists/MDList.behavior.spec.ts
src/shared/ui/Lists/MDList.visual.spec.ts
```

No `*.browser.spec.ts` compatibility, central visual ownership, or V3/V4 verifier stage model is part of the current contract.

## Why some Lists behavior checks remain

The former Lists visual/browser suite contained a mix of appearance, browser interaction, component semantics, Material default-value checks, and implementation-detail assertions. The cleanup removed duplicated and misowned proof and kept only current observable contracts at their truthful owners.

A narrow exception remains for spacing-role wiring in `MDList.behavior.spec.ts`. The checks use distinctive values to distinguish row-edge and inter-slot spacing roles because a real regression previously swapped `between-space` and `leading-space`. They protect Mioframe wiring, not Material default numeric values. They must not grow back into an exhaustive Material literal/default-value conformance table.

The behavior suite also verifies the Lists boundary with the shared global focus indicator. Lists owns handing focus to that shared capability and avoiding a competing local focus outline; it does not own the global indicator's Material thickness, offset, or internal timing implementation.

## Legacy boundary

These retained checks are justified only for the existing legacy Lists implementation and are not precedent for new durable UI families.

When Lists is replaced by the canonical Material family, proof must be selected again from the new family's public API, behavior, token, and compatibility contracts. Legacy StateLayer wiring, old token indirection, historical Material literal matrices, or exact old test structure are not compatibility requirements by themselves.

Until that migration, do not expand the retained legacy exception merely to increase coverage. New defects should receive the lowest faithful proof at the current truthful owner under `docs/testing/architecture.md`.
