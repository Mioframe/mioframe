# Review

Verdict: blocked

## Scope reviewed

Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish`, including the latest B1/B2 correction, current unit/release impact ownership, and the reported `visualRisk.test.ts` baseline failures.

## Resolved findings

### B2 — release false-negative consumer ownership

Resolved for the previously identified false-negative cases:

- `src/shared/service/appUpdate/releaseWireContract.ts` now selects `managed-updates` + `publisher-node-import`;
- `scripts/release/buildArtifact.mjs` now selects all confirmed release-browser consumers plus `build`;
- `tests/e2e/release/fixtures/**` no longer defaults to managed-updates; current fixtures have exact ownership and an unknown future fixture fails closed to full.

### `visualRisk.test.ts` baseline question

Resolved as pre-existing stale test state on `develop`, not a finish-branch regression. `develop` already contains `src/shared/ui/material/components/button/MDButton.visual.spec.ts`, while the existing `visualRisk.test.ts` cases still describe MDButton as having no colocated visual owner and expect `full`. The resolver discovers colocated `*.visual.spec.ts` files recursively and therefore resolves MDButton owner changes as `focused`.

This stale baseline should not be fixed as part of the current B1/B2 correction unless separately assigned; it is not evidence against the finish-branch visual planner change.

## Blockers

### B1 — bounded direct repository-file reader audit is still incomplete

Owner: `scripts/lib/unitRisk.ts`

The target architecture requires one bounded audit of existing Vitest tests that directly read concrete repository files outside the module/import relation, not only workflow readers. The current registry fixes `.github/workflows/verify.yml`, but known direct file-as-data owners remain unrepresented.

Confirmed examples:

- `config/viteConfigFixtureImport.test.ts` directly reads root `vite.config.ts` source text with `readFileSync(new URL('../vite.config.ts', import.meta.url), ...)`. `vite.config.ts` is neither an exact file-as-data mapping nor an ordinary `src/`/`config/`/`scripts/` related input in `unitRisk.ts`, so a `vite.config.ts`-only change can omit this owning unit proof.
- `src/shared/lib/md/index.test.ts` directly reads `src/shared/lib/md/index.css`; `.css` is outside `ORDINARY_SOURCE_EXTENSIONS` and there is no exact mapping.
- `config/postcss.config.test.ts` directly reads `src/shared/lib/md/index.css`, `src/shared/ui/material/foundation/tokens.css`, and `src/shared/ui/material/foundation/theme.css`; these direct file reads are not represented by the current exact map.
- `src/shared/ui/State/MDStateLayer.test.ts` directly reads additional production UI/CSS files to enforce the cross-file opacity-alias contract. Those relations must be audited against real `vitest related` behavior instead of being assumed to exist through unrelated imports.

Required final state:

- complete the bounded audit required by `docs/testing/verify-target-architecture.md` for all current Vitest tests that directly consume a concrete repository file outside the import relation;
- for each confirmed reader, first check whether supported Vitest related resolution already reaches that exact owning test through a real module relation;
- add an exact `UNIT_FILE_AS_DATA_MAPPINGS` entry only when the owning test would otherwise be missed;
- prove representative root-config, CSS/text, workflow, and existing module-related cases so the map stays narrow and does not become a generic dependency registry;
- no known direct file-as-data owner may remain silently omitted.

Basis: `docs/testing/verify-target-architecture.md` explicitly says other existing tests that directly read a concrete repository file must be mapped when the relation is verified in code.

## Major issues

### M1 — release source-impact currently treats proof-only files as runtime impact

Owner: `scripts/lib/releaseRisk.ts`

The source-impact planner is too broad for proof-only files in some release/runtime directories:

- `isAppUpdateRuntimePath()` is a raw `src/shared/service/appUpdate/` prefix, so ordinary Vitest files such as `controllerState.test.ts`, `contracts.test.ts`, and test utilities inherit `managed-updates` release proof even though changing the proof file does not change the production managed-update runtime.
- `scripts/release/buildArtifact.test.mjs` is mapped to the same four source-impact checks as `buildArtifact.mjs`. The production script has those consumers; its unit test does not change that production path.

This is not a false negative, but it violates the finish goal of selecting the smallest truthful proof and duplicates expensive release proof for known proof-only changes.

Required final state:

- distinguish production/runtime release inputs from unit-only proof/test-support paths before applying broad runtime prefixes;
- direct release E2E specs/orchestrators that are themselves the release proof continue to select their owning release contract;
- unit-only `.test.ts` / `.test.mjs` and test-support files rely on their owning unit proof unless they are also a real input to a release check;
- do not copy production-source consumer sets onto a unit test merely because it tests that source.

## Validation required before review can close

- corrected B1 audit/proof is green;
- M1 proof-only release changes select no unnecessary source-impact release checks while real release proof files remain selected;
- focused verifier commands for the corrected planners are green;
- affected representative benchmark cases are rerun after these corrections;
- exact-head CI and CI critical-path evidence remain architect-owned after PR publication.

## Minor issues

None.

## Accepted risks

None.
