# Review

Verdict: blocked

## Scope reviewed

Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish`, including the latest unit/release correction and the `visualRisk.test.ts` baseline question.

## Resolved findings

### B2 — release false-negative consumer ownership

Resolved for the previously identified false-negative cases:

- `src/shared/service/appUpdate/releaseWireContract.ts` selects `managed-updates` + `publisher-node-import`;
- `scripts/release/buildArtifact.mjs` selects all confirmed release-browser consumers plus `build`;
- `tests/e2e/release/fixtures/**` no longer defaults to managed-updates; current fixtures have exact ownership and an unknown future fixture fails closed to full.

### `visualRisk.test.ts` baseline question

Resolved as pre-existing stale test state on `develop`, not a finish-branch regression. `develop` already contains `src/shared/ui/material/components/button/MDButton.visual.spec.ts`, while the existing `visualRisk.test.ts` cases still describe MDButton as having no colocated visual owner and expect `full`. The resolver discovers colocated `*.visual.spec.ts` files recursively and therefore resolves MDButton owner changes as `focused`.

Do not fix this stale baseline inside the current correction unless separately assigned.

## Blockers

### B1 — complete the bounded direct repository-file reader audit

Owner: `scripts/lib/unitRisk.ts`

The target architecture requires one bounded audit of current Vitest-owned tests that directly consume concrete repository files outside the normal module/import relation. The audit is not complete when only previously listed examples are fixed.

Required audit population:

- current Vitest-owned `*.test.ts` / `*.test.mjs` files under the repository's unit-test locations;
- direct fixed-path repository reads such as `readFileSync`, `fs.readFileSync`, `readFile`, `new URL(<repo path>, import.meta.url)`, and equivalent literal file-as-data consumption;
- direct text/CSS/config/workflow reads are in scope;
- ordinary imported modules are not file-as-data merely because a test also imports them.

For every confirmed direct reader/source pair:

1. establish whether Vitest's supported `related` resolution already selects that exact owning test through a real module relation;
2. if yes, keep the relation implicit and prove the representative case without adding a mapping;
3. if no, add the smallest exact `UNIT_FILE_AS_DATA_MAPPINGS` relation;
4. do not add prefixes, extension-wide rules, a generated registry, or a second dependency graph.

Known cases that must be included in the audit, but are not the audit boundary:

- `.github/workflows/verify.yml` -> all confirmed direct readers including `scripts/ciAutofix.test.ts`;
- root `vite.config.ts` -> `config/viteConfigFixtureImport.test.ts` unless supported related resolution already reaches it;
- `src/shared/lib/md/index.css` -> direct-reading unit owners including `src/shared/lib/md/index.test.ts` and `config/postcss.config.test.ts` unless related resolution already reaches each exact owner;
- `src/shared/ui/material/foundation/tokens.css` and `theme.css` -> `config/postcss.config.test.ts` unless already related;
- the cross-file source/CSS reads in `src/shared/ui/State/MDStateLayer.test.ts` -> map only those owners that related resolution would otherwise miss.

Required final state:

- the bounded audit reaches the complete current population above;
- no known direct file-as-data unit owner is silently omitted;
- exact mappings contain only relations Vitest cannot already represent faithfully;
- representative root-config, workflow, CSS/text, and already-related cases are covered independently;
- `UNIT_FILE_AS_DATA_MAPPINGS` remains a small unit-specific exception map, not general dependency infrastructure.

Basis: `docs/testing/verify-target-architecture.md` unit file-as-data contract and `docs/testing/architecture.md` smallest truthful proof / fail-closed ownership.

## Major issues

### M1 — exclude unit-only proof from release source-impact without hiding real release inputs

Owner: `scripts/lib/releaseRisk.ts`

Current release source-impact still over-selects expensive proof for known unit-only files:

- the broad `src/shared/service/appUpdate/` runtime prefix currently includes ordinary unit `*.test.ts` and test-support files;
- `scripts/release/buildArtifact.test.mjs` inherits the production `buildArtifact.mjs` consumer set even though changing the unit test does not change the release build path.

Required final state:

- source-impact planning distinguishes production/runtime inputs from unit-only proof before broad runtime-prefix fallback;
- ordinary unit `*.test.ts`, `*.test.mjs`, and test-support files do not inherit release checks merely because they sit beside production release/runtime code;
- exact/direct release proof files (release E2E specs, release orchestrators, release fixtures/helpers that are actual release-check inputs) keep their existing release ownership;
- if a test-shaped/test-support file is itself a real input to a release check, represent that real ownership explicitly rather than hiding it behind a blanket proof-only exclusion;
- `scripts/release/buildArtifact.test.mjs` does not copy the production source's release consumer set;
- do not introduce a generic proof-path classifier shared across lanes.

The simplest viable design is a narrow release-local proof-only exclusion applied after exact release mappings but before broad runtime-prefix fallback, with explicit exceptions only when current repository evidence proves the file is itself a release-check input.

## Required proof

Use a fresh test-author context before changing behavioral planner assertions.

B1 proof must reject at least:

- a direct file reader silently omitted from focused unit planning;
- adding an unnecessary exact mapping where Vitest related already reaches the owner;
- broad extension/prefix file-as-data inference.

M1 proof must reject at least:

- `src/shared/service/appUpdate/<unit>.test.ts -> managed-updates` solely from the directory prefix;
- `scripts/release/buildArtifact.test.mjs` inheriting production release checks;
- a proof-only exclusion that accidentally suppresses a real release E2E/orchestrator/fixture input.

## Validation required before review can close

- corrected B1 audit and planner proof are green;
- M1 proof-only changes select no unnecessary source-impact release checks while real release inputs remain selected;
- focused verifier commands for the corrected unit/release planners are green;
- rerun the representative benchmark cases invalidated by B1/M1 and report selected/skipped checks;
- no broad final verification ritual is required from the coding agent;
- exact-head CI and CI critical-path evidence remain architect-owned after PR publication.

## Major issues not blocking implementation handoff

None beyond M1 above.

## Minor issues

None.

## Accepted risks

None.
