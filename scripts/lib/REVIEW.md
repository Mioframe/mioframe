# Review

Verdict: blocked

## Scope reviewed

- PR #216 release-impact planning and execution ownership after the `releaseSpecInventory.ts` architecture correction.
- Shared release-spec inventory, real artifact/release-smoke command construction, managed-update grouping, exhaustive release-spec validation, production Vite/PWA configuration ownership, runtime mapping validation, and current proof/static feedback.

## Blockers

None.

The previous B1 semantic ownership blocker is resolved by the current implementation:

- `scripts/release/releaseSpecInventory.ts` is the shared pure release-spec membership owner;
- `scripts/verify.ts`, `scripts/release/managedUpdatesProof.mjs`, and `scripts/lib/releaseRisk.ts` consume that inventory;
- the planner validates the bounded `tests/e2e/release/**/*.spec.ts` population exhaustively and rejects unowned/conflicting/missing inventory state;
- filename-based `managedUpdates*.spec.ts` ownership is removed;
- `config/alias.ts`, `config/vueCustomElements.ts`, and non-proof `config/plugins/**` select the production-build release consumers;
- unknown exact-mapping check values are rejected;
- `scripts/release/releaseSpecInventory.ts` itself fails closed to all six source-impact checks.

## Major issues

### M1 — Required Pass E proof does not satisfy repository static checks

Owner: `scripts/lib/releaseRisk.test.ts` with one adjacent warning in `scripts/lib/releaseRisk.ts`.

The semantic implementation is acceptable, but exact-head CI run `verify #4038` fails in `autofix` before verification lanes can run:

- Oxlint: unused `ReleasePlanOptionsWithReleaseSpecTestOverrides` type alias in `scripts/lib/releaseRisk.test.ts`;
- ESLint: the unknown-release-check proof uses prohibited type assertions (`as unknown as` / equivalent cast path) under `@typescript-eslint/consistent-type-assertions`;
- Oxlint also reports an unnecessary `String(check)` conversion in the production invalid-mapping diagnostic.

The test must continue to prove that corrupted runtime mapping data containing a check outside `RELEASE_IMPACT_CHECKS` resolves `invalid`; do not delete or weaken that assertion. Express the runtime corruption without a type assertion and remove now-obsolete test-author scaffolding. The production diagnostic cleanup must not change validation semantics.

Verification after correction: focused `unit-tests` for `releaseRisk.test.ts` / `releaseRisk.ts`, focused static/fix-only feedback as useful, and type-check only if needed. Exact-head CI remains architect-owned.

## Minor issues

### m1 — Test-author RED comments are stale after implementation

`scripts/lib/releaseRisk.test.ts` still says the inventory override seams are "until production adds them" and that the current resolver "ignores the options". Those statements were true only during RED; the production resolver now owns both seams. Rewrite/remove the historical wording while preserving the independent local oracle and assertions.

The separate verifier-output findings remain in `scripts/REVIEW.md` and are intentionally out of scope here.

## Accepted risks

None.

## Items not required

- No release-impact architecture redesign.
- No inventory API change.
- No new release mapping or production-config boundary change.
- No managed-update grouping change.
- No CI/workflow change.
- No benchmark work until Pass E and the separate output findings are closed.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: Pass E proof/static cleanup only.

Allowed scope:

```text
scripts/lib/releaseRisk.test.ts
scripts/lib/releaseRisk.ts
```

Required final state:

1. preserve every accepted Pass E assertion and production behavior;
2. remove the unused obsolete test-only type alias/import scaffolding;
3. prove unknown runtime release-check rejection without type assertions;
4. remove the unnecessary `String(check)` conversion without changing the diagnostic meaning;
5. update stale RED-phase comments to final-state wording;
6. focused unit/static feedback passes;
7. return to architect for Pass E closure review.

Do not combine the two `scripts/REVIEW.md` output minors into this cleanup.
