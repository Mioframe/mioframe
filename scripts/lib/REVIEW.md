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

Exact-head CI run `verify #4038` fails in `autofix` before verification lanes can run:

- unused obsolete test-author type scaffolding in `scripts/lib/releaseRisk.test.ts`;
- the unknown-release-check proof uses prohibited type assertions under `@typescript-eslint/consistent-type-assertions`;
- the production invalid-mapping diagnostic contains an unnecessary `String(check)` conversion.

The accepted runtime-invalid-check assertion must remain. This is proof/static cleanup only; release-impact behavior and ownership are already accepted.

Ready correction handoff:

- `docs/testing/verify-release-impact-static-cleanup.md`
- status: `ready`

## Minor issues

### m1 — Test-author RED comments are stale after implementation

The same cleanup must remove/rewrite historical comments that still describe the replacement inventory seams as not yet implemented.

The separate verifier-output findings remain in `scripts/REVIEW.md` and are intentionally out of scope here.

## Accepted risks

None.

## Items not required

- No release-impact architecture redesign.
- No inventory API change.
- No release mapping or production-config boundary change.
- No managed-update grouping change.
- No CI/workflow change.
- No benchmark work until Pass E and the separate output findings are closed.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: Pass E proof/static cleanup only.

Authoritative handoff:

```text
docs/testing/verify-release-impact-static-cleanup.md
```

Allowed implementation scope:

```text
scripts/lib/releaseRisk.test.ts
scripts/lib/releaseRisk.ts
```

Required order:

1. preserve accepted assertions and production semantics;
2. remove static-rule violations and stale RED scaffolding/comments;
3. focused unit/static feedback only;
4. return to architect for Pass E closure review.

Do not combine the two `scripts/REVIEW.md` output minors into this cleanup.
