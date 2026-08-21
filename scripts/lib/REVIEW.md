# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish`, with re-review of Pass C after the accepted unit-impact architecture correction.

## Blockers

### B1 — external Vitest ownership is still not represented truthfully

Owner: `scripts/lib/unitRisk.ts`

Problem: the repository-wide ordinary `vitest related` pass-through now fixes the previous prefix-based misses, but the exact external-input exceptions are still inconsistent with the accepted architecture: one real runtime-discovered unit owner is omitted, while one import-reachable owner is redundantly encoded as an external mapping.

Evidence:

- [`../../eslint.config.test.ts`](../../eslint.config.test.ts) constructs `new ESLint({ cwd: import.meta.dirname })` and exercises the repository ESLint configuration through ESLint runtime discovery. It does not import `eslint.config.mjs`; therefore `vitest related eslint.config.mjs` cannot discover this owning test from Vitest's module relation alone.
- [`../../eslint.config.mjs`](../../eslint.config.mjs) is an ordinary root `.mjs` input. `unitRisk.ts` currently passes it only as a normal related input and has no exact external relation to `eslint.config.test.ts`, so an `eslint.config.mjs`-only change can execute zero related unit tests and silently miss the test that owns its rule contract.
- `UNIT_FILE_AS_DATA_MAPPINGS` maps `vite.config.ts` to both `config/viteConfigFixtureImport.test.ts` and `scripts/release/viteBuildDate.test.mjs`, while `scripts/release/viteBuildDate.test.mjs` imports `vite.config.ts` normally. The corrected repository-wide related-input model can already discover that owner through Vitest; keeping it in the external map duplicates ownership and contradicts the exception-only contract.

Basis:

- [`../../docs/testing/verify-unit-impact-correction.md`](../../docs/testing/verify-unit-impact-correction.md): ordinary import/dependency ownership belongs to Vitest related resolution; exact mappings are additive exceptions only for external/runtime-discovered relations Vitest cannot represent.
- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md): the verifier must not reconstruct or duplicate ordinary module ownership, while confirmed external file/config consumers require exact ownership.

Risk: a change to `eslint.config.mjs` can pass the focused unit planner while omitting `eslint.config.test.ts`; redundant import-reachable mappings also reintroduce the duplicated ownership the Pass C redesign was intended to remove.

Required final state:

- add the smallest exact external relation for `eslint.config.mjs -> eslint.config.test.ts` unless current executable proof demonstrates Vitest related already selects that test;
- remove `scripts/release/viteBuildDate.test.mjs` from the `vite.config.ts` external mapping if the normal import relation selects it, keeping only owners the related graph cannot reach;
- re-check the current exact mapping table for the same distinction: every mapped owner must be external to the ordinary Vitest relation; ordinary import-reachable owners stay implicit;
- preserve repository-wide ordinary related inputs, additive external mappings, Playwright exclusions, package handling, and deletion/rename fail-closed behavior;
- do not add another graph, broad runtime-discovery classifier, or generic registry.

Verification: fresh independent planner proof must demonstrate both sides of the boundary: a runtime-discovered config owner that would otherwise be missed is selected exactly, and a normal import-reachable owner remains selected without being duplicated in the external mapping.

## Major issues

None.

## Resolved findings

- Repository-wide ordinary unit dependency inputs now replace the old `src/config/scripts` dependency boundary.
- Mapped CSS/external ownership is additive rather than suppressing ordinary related resolution.
- Root imported modules and `tests/e2e/**` Vitest helpers are eligible for ordinary related resolution.
- The stale visual-owner proof now uses a deterministic synthetic owner and is resolved.
- Previous release false-negative ownership and release proof-only over-selection remain resolved.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not expand mutation/release/classification architecture while correcting the remaining unit external-ownership boundary.
