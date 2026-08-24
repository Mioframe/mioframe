# Review

Verdict: blocked

## Scope reviewed

- Verify redesign Pass A at `29a851fb4ad31880191552a11d2e41e8285f02e1`.
- Internal verification-type ownership, mixed release split, legacy `--only` compatibility, target discovery foundations, release proof preservation, and existing verifier orchestration/lock behavior.

## Blockers

### B1 — Storybook buildability is incorrectly modeled as an untyped prerequisite

Owner: `scripts`

Problem: `storybook-build` is placed in `PREREQUISITE_LABELS` and therefore stamped with `verificationType: null`, even though the accepted architecture explicitly defines Storybook buildability as a `static` proof. Reuse of the same build artifact by behavior/visual is only an execution optimization and does not remove its static proof ownership.

Evidence:

- [`verify.ts`](verify.ts) — `PREREQUISITE_LABELS` contains both `e2e-install` and `storybook-build`; `resolveVerificationType()` therefore returns `null` for `storybook-build`.
- [`verify.test.ts`](verify.test.ts) — `leaves pure execution prerequisites without a verification type` explicitly locks in `storybook-build.verificationType === null`.

Basis:

- [`../docs/testing/verify-redesign-implementation-preflight.md`](../docs/testing/verify-redesign-implementation-preflight.md) — **Static composition** says Storybook buildability remains an internal command under `static`, while Storybook build reuse is only an execution optimization.
- [`../docs/testing/verify-redesign-implementation-preflight.md`](../docs/testing/verify-redesign-implementation-preflight.md) — **Public type CLI without rewriting leaf commands** requires each proof leaf to have exactly one verification type; only genuine execution prerequisites may be untyped.

Risk: Pass B would build an incomplete `static` type and could omit the repository's Storybook buildability proof from `--only static` / final type composition.

Required final state: `storybook-build` has `static` proof ownership. Genuine setup-only commands such as `e2e-install` may remain untyped. Artifact reuse for behavior/visual remains a separate execution dependency/optimization concern.

Verification: focused planner tests must prove `storybook-build` is owned by `static` while behavior/visual reuse behavior remains unchanged.

### B2 — Manifest invariant remains inside browser-integration proof

Owner: `scripts/release`

Problem: the release split leaves the PWA manifest content/scope assertion in `productionArtifactSmoke.spec.ts`. The accepted Pass A classification requires file/manifest/generated-artifact assertions to become static proof, with browser-loaded page/service-worker lifecycle assertions remaining browser integration.

Evidence:

- [`../tests/e2e/release/productionArtifactSmoke.spec.ts`](../tests/e2e/release/productionArtifactSmoke.spec.ts) — `links a fetchable PWA manifest scoped to the base path` still parses the manifest and asserts `name` plus `start_url`/`scope` content inside the Playwright browser-integration leaf.
- [`release/productionArtifactStaticProof.mjs`](release/productionArtifactStaticProof.mjs) — the new static proof validates emitted JS patterns and managed worker lifecycle calls, but contains no manifest invariant.

Basis:

- [`../docs/testing/verify-redesign-implementation-preflight.md`](../docs/testing/verify-redesign-implementation-preflight.md) — **Release-suite reclassification** explicitly classifies `productionArtifactSmoke.spec.ts` as `file/manifest/generated-artifact assertions -> static; built-page/service-worker lifecycle assertions -> browser-integration`.
- [`../docs/testing/verify-redesign-implementation-preflight.md`](../docs/testing/verify-redesign-implementation-preflight.md) — `--only <type>` must not execute an assertion suite owned by another verification type.

Risk: the Pass A split is still type-mixed. A future `--only browser-integration` would execute a static manifest-content invariant, breaking the type-isolation contract that Pass A exists to establish before the public CLI migration.

Required final state: deterministic manifest content/scope validation is owned by static tooling proof. Any remaining browser assertion should verify only a truthful browser/runtime contract such as page linkage/fetchability, without duplicating the static manifest invariant.

Verification: static proof tests must fail for invalid manifest content/scope; browser compatibility proof must still cover any genuinely browser-specific manifest linkage/fetch behavior that remains required.

## Major issues

### M1 — Controller identity static proof bypasses the existing expensive-command lock boundary

Owner: `scripts`

Problem: `managed-updates-static` now performs two real `vite build` executions directly through `runLocalCommand`, but `commandWeight.ts` classifies the verifier leaf as `medium`. `verify.ts` only wraps `expensive` entries with `withExpensiveCommandLock`. Before the split, the same controller-identity proof ran inside the `managed-updates` expensive boundary.

Evidence:

- [`release/managedUpdatesControllerArtifactIdentityProof.mjs`](release/managedUpdatesControllerArtifactIdentityProof.mjs) — `buildManagedStableArtifact()` invokes the local Vite binary directly and the proof runs it twice.
- [`lib/commandWeight.ts`](lib/commandWeight.ts) — `managed-updates-static` is classified as `medium`.
- [`verify.ts`](verify.ts) — the main execution loop calls `withExpensiveCommandLock(...)` only when `entry.weight === 'expensive'`.
- [`lib/commandWeight.test.ts`](lib/commandWeight.test.ts) — the new test explicitly expects the static managed-update leaf to be `medium`.

Basis:

- [`../AGENTS.md`](../AGENTS.md) — preserve existing verifier locks/timeouts/container execution unless a concrete incompatibility requires change.
- [`../docs/testing/verify-redesign-implementation-preflight.md`](../docs/testing/verify-redesign-implementation-preflight.md) — the redesign preserves verifier locks and bounded execution; Pass A is a proof-classification migration, not an orchestration rewrite.

Risk: the split silently weakens resource serialization for two production builds and can allow expensive build work outside the verifier's established expensive-command coordination boundary.

Required final state: the extracted controller-identity proof retains an equivalent existing expensive-execution/lock boundary without inventing new locking infrastructure.

Verification: focused command-weight/execution tests must prove the static controller-identity leaf is covered by the existing expensive lock mechanism, and the real compatibility proof must remain green.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
