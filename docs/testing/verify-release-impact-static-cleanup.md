# Verify release-impact static cleanup

Status: **ready**.

This is the final narrow cleanup handoff for Pass E in PR #216. The release-impact architecture in `docs/testing/verify-release-impact-correction.md` is implemented and accepted semantically. Do not redesign it.

## Goal

Make the accepted Pass E proof/static surface satisfy repository checks without changing release-impact behavior, ownership, inventory, planner results, or assertions.

## Scope

Allowed files:

```text
scripts/lib/releaseRisk.test.ts
scripts/lib/releaseRisk.ts
```

No other production/test file is required.

## Current findings

### 1. Obsolete test-author scaffolding

`scripts/lib/releaseRisk.test.ts` still contains an unused `ReleasePlanOptionsWithReleaseSpecTestOverrides` type alias/import scaffolding after production added the real replacement seams.

Remove the obsolete scaffolding. Use the production `ResolveReleasePlanOptions` surface directly where needed.

### 2. Unknown release-check proof violates static policy

The accepted proof must continue to verify:

```text
runtime exact mapping contains a check outside RELEASE_IMPACT_CHECKS
→ resolveReleasePlan() returns mode: invalid
```

The current test expresses the corrupted runtime value through prohibited type assertions. Rewrite only the test-data construction so the malformed runtime value reaches the public resolver without `as`, `as unknown as`, angle-bracket assertions, or weakening the production `ReleaseImpactCheck` type.

The production contract remains:

```ts
NarrowReleaseMapping.checks: readonly ReleaseImpactCheck[]
```

Do not change it to `string[]` or add a production escape hatch solely for the test.

Use the smallest lint-compliant runtime-data construction available in the existing test environment. The oracle is runtime validation, not TypeScript assignability.

### 3. Unnecessary diagnostic conversion

In `scripts/lib/releaseRisk.ts`, runtime invalid-check diagnostics currently use an unnecessary `String(check)` conversion.

Remove only the unnecessary conversion in a lint-compliant way while preserving the same diagnostic meaning and validation behavior.

### 4. Stale RED-phase comments

Remove/rewrite comments in `scripts/lib/releaseRisk.test.ts` that still claim:

- the inventory override seams are waiting for production to add them;
- the current resolver ignores those options.

Final comments should describe the current replacement-only test seams, not historical RED state.

## Must not change

- `RELEASE_SPEC_EXECUTION_INVENTORY` API or membership;
- release spec ownership;
- production Vite config ownership;
- bounded release-spec scan;
- invalid/focused/full/skip semantics;
- managed-update grouping/order/labels;
- artifact/release-smoke command construction;
- release timeout behavior;
- CI/workflow topology;
- any accepted test input or expected planner result;
- the two separate verifier-output findings in `scripts/REVIEW.md`.

## Acceptance criteria

1. Every existing Pass E assertion remains present and semantically unchanged.
2. Unknown runtime release-check value still proves `mode: invalid`.
3. No type assertion is used to express that corrupted runtime value.
4. `NarrowReleaseMapping.checks` remains `readonly ReleaseImpactCheck[]`.
5. Obsolete inventory-seam test scaffolding is removed.
6. Stale RED-phase comments are gone.
7. The unnecessary production `String(check)` conversion is gone without behavior change.
8. No release-impact architecture or ownership changes.
9. Focused unit proof passes.
10. Focused static checks pass for the two touched files.

## Verification

Use focused verifier-managed feedback only:

```bash
pnpm verify --only unit-tests --files \
  scripts/lib/releaseRisk.test.ts \
  scripts/lib/releaseRisk.ts

pnpm verify --fix-only --files \
  scripts/lib/releaseRisk.test.ts \
  scripts/lib/releaseRisk.ts
```

If `--fix-only` changes files mechanically, inspect the resulting touched scope and rerun the same focused command.

Run `pnpm verify --only type-check` only if the cleanup changes TypeScript surface in a way that makes it useful.

Do not run broad `pnpm verify`, `pnpm verify --full`, `pnpm verify:release`, browser proof, Storybook, visual, or mutation as a completion ritual. Exact-head CI remains architect-owned.

## Forbidden

- direct Git/GitHub commands from coding/test contexts;
- edits to `docs/testing/**`, any `REVIEW.md`, `AGENTS.md`, or skills;
- new architecture/registry/helper abstractions;
- weakening/removing the unknown-check assertion;
- changing production release-impact behavior;
- changing inventory membership;
- changing release mappings;
- changing CI/workflow;
- fixing verifier-output findings in this pass.
