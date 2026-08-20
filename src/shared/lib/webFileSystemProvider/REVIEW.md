# Review

Verdict: ready

## Scope reviewed

- PR #211 changes in `src/shared/lib/webFileSystemProvider`, including unavailable-root classification/transport, provider callback contracts, test utilities, diagnostics-facing metadata, and current lint output.

## Blockers

None.

## Major issues

None.

## Minor issues

### M1 — PR-introduced exported test helper is undocumented

Owner: `src/shared/lib/webFileSystemProvider`

Problem: PR #211 changes `MockFileSystemDirectoryHandle` from a module-private type to an ESM-exported type in `WebFileSystemProvider.testUtils.ts`, but the exported type and its public member signatures do not have the TSDoc required for touched public exports. The current verifier consequently reports the 11 `jsdoc/require-jsdoc` warnings in this file. These warnings predate the latest correction commit, but they are not pre-PR/unrelated warnings.

Evidence:

- [Test utility](WebFileSystemProvider.testUtils.ts) — `MockFileSystemDirectoryHandle` is now exported and its member signatures are undocumented.
- Complete PR patch inspection shows no named consumer of `MockFileSystemDirectoryHandle` outside this test utility; the type is used internally by `createDirectoryHandleMock` and `captureRecoveryKeyFromUnavailableRoot` only.
- [ESLint configuration](../../../../eslint.config.mjs) — `jsdoc/require-jsdoc` runs with `publicOnly.esm: true` and includes TypeScript type/interface/property/method contexts, which is why the newly exported test-helper surface produces warnings.

Basis:

- [Root repository rules](../../../../AGENTS.md) — every touched public export must have accurate, complete TSDoc.
- [Shared-lib rules](../AGENTS.md) — exported shared contracts should carry concise TSDoc so they remain readable at call sites and during refactors.

Risk: the PR leaves an unnecessary changed shared test-helper API outside the repository's documented-export convention and normalizes new warning noise, making later lint regressions harder to distinguish from accepted baseline warnings. This does not affect runtime behavior or the recovery architecture.

Required final state: make `MockFileSystemDirectoryHandle` module-private again. Preserve the behavior and exported function signatures of `createDirectoryHandleMock` and `captureRecoveryKeyFromUnavailableRoot`; no new public test-helper contract is required. The PR-introduced `jsdoc/require-jsdoc` warnings must disappear without weakening lint rules or adding documentation solely to justify an unnecessary export.

Verification: run verifier-managed ESLint for `WebFileSystemProvider.testUtils.ts`, then the final canonical `pnpm verify` for the correction pass.

## Accepted risks

None.

## Items not required

- No provider/recovery architecture change is required for this finding.
- No broader test-helper API cleanup or documentation sweep is required.

## Unresolved questions

None.
