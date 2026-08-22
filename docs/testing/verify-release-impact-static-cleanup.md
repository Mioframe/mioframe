# Verify release-impact static cleanup

Status: **implemented and architect-reviewed**.

This is the completed narrow cleanup for Pass E in PR #216. The release-impact architecture in `docs/testing/verify-release-impact-correction.md` is implemented and accepted semantically; this cleanup changed only proof/static compliance.

## Goal

Make the accepted Pass E proof/static surface satisfy repository checks without changing release-impact behavior, ownership, inventory, planner results, or assertions.

## Scope

Changed files:

```text
scripts/lib/releaseRisk.test.ts
scripts/lib/releaseRisk.ts
```

No other production/test file was required.

## Final state

### Obsolete test-author scaffolding

Removed the obsolete options alias/wrapper/local duplicate inventory shape left from the RED phase. The proof now uses the production resolver's replacement-only seams directly.

### Unknown release-check runtime proof

The accepted proof still verifies:

```text
runtime exact mapping contains a check outside RELEASE_IMPACT_CHECKS
→ resolveReleasePlan() returns mode: invalid
```

The malformed runtime value is created without a TypeScript type assertion by mutating a valid typed array with `Object.defineProperty`. Production typing remains:

```ts
NarrowReleaseMapping.checks: readonly ReleaseImpactCheck[]
```

No production escape hatch or weakened type was introduced.

### Diagnostic cleanup

Removed the unnecessary `String(check)` conversion from the invalid-check diagnostic without changing validation semantics or diagnostic meaning.

### RED-phase comments

Historical comments claiming the replacement inventory seams were not yet implemented were removed/reworded. Current comments describe the existing replacement-only seams.

## Acceptance result

- all accepted Pass E assertions remain present and semantically unchanged;
- unknown runtime release-check value still proves `mode: invalid`;
- no type assertion is used to construct that malformed runtime value;
- `NarrowReleaseMapping.checks` remains `readonly ReleaseImpactCheck[]`;
- obsolete inventory-seam scaffolding is removed;
- stale RED-phase comments are gone;
- release-impact architecture and ownership are unchanged.

## Verification evidence

Coding-agent focused feedback:

```text
pnpm verify --only unit-tests --files scripts/lib/releaseRisk.test.ts scripts/lib/releaseRisk.ts
→ passed

pnpm verify --fix-only --files scripts/lib/releaseRisk.test.ts scripts/lib/releaseRisk.ts
→ passed

pnpm verify --only type-check
→ passed
```

Architect exact-head observation on `feb02590a5697131d89a480ab60ee11267b75505`, workflow `verify #4048`:

- autofix: passed;
- format: passed;
- Oxlint: passed;
- ESLint: passed;
- type-check: passed;
- unit tests: passed.

Remaining workflow lanes are not Pass E cleanup acceptance criteria and are not final merge evidence because later output-contract/documentation work will change the authoritative head.

## Closure

Pass E release-impact architecture and its proof/static cleanup are closed. Reopen only if new repository evidence contradicts the accepted execution inventory, release-spec population validation, production Vite boundary, or runtime mapping validation.
