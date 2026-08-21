# Review

Verdict: blocked

## Correction scope

Fix only the findings below. Do not redesign the verifier architecture or expand modernization scope.

For B1 and B2, behavioral planner proof must be corrected in a fresh test-author context before production implementation. Accepted corrected assertions are read-only for the implementation context.

After both blockers are fixed:

1. run the smallest focused verifier proof for the corrected unit/release planners;
2. rerun the representative planner benchmark cases affected by the corrections;
3. verify the two reported `visualRisk.test.ts` failures against the current `develop` baseline and record exact test names/results;
4. hand back without Git/PR operations.

## Blockers

### B1 — complete `verify.yml` file-as-data unit ownership

Owner: `scripts/lib/unitRisk.ts`

`.github/workflows/verify.yml` must select every confirmed Vitest test that directly reads that file outside the module graph. The current mapping omits `scripts/ciAutofix.test.ts`, which directly reads and asserts workflow content.

Required final state:

- complete a bounded audit of direct repository-file readers for the workflow/config inputs already represented by `UNIT_FILE_AS_DATA_MAPPINGS`;
- add every confirmed direct-reading Vitest owner, including `scripts/ciAutofix.test.ts` for `.github/workflows/verify.yml`;
- keep mappings exact and local to unit impact; do not introduce a generic dependency registry;
- prove that a `verify.yml` change selects all confirmed direct readers and does not widen unrelated unit work.

Basis: `docs/testing/verify-target-architecture.md` unit file-as-data contract and `docs/testing/architecture.md` fail-closed proof ownership.

### B2 — correct release-impact consumer ownership

Owner: `scripts/lib/releaseRisk.ts`

Focused release mappings must follow the real current consumer graph, not the existing narrowed expectations.

Minimum required corrections:

- `src/shared/service/appUpdate/releaseWireContract.ts` must include `publisher-node-import` because it terminates the proven plain-Node publisher import chain; keep any additional real managed-update ownership it also has;
- `scripts/release/buildArtifact.mjs` must select every release contract that actually consumes that build path through `playwright.release.config.ts`; if the exact consumer set cannot be bounded safely, use full source-impact release proof;
- `tests/e2e/release/fixtures/**` must not be treated as managed-update-only by directory. Artifact-owned fixtures must select `artifact`; managed-update-owned fixtures must select `managed-updates`; shared/unknown fixture ownership must select all actual consumers or fail closed to full;
- audit other release helper/fixture mappings touched by the same ownership assumptions so no equivalent silent under-selection remains.

Required independent proof must cover at minimum:

- `releaseWireContract.ts`;
- `buildArtifact.mjs`;
- one artifact-owned release fixture;
- one managed-update-owned release fixture;
- one shared/unknown release helper or fixture that must fail closed safely.

Do not preserve current `releaseRisk.test.ts` expectations when they conflict with the repository consumer graph.

Basis: `docs/testing/verify-target-architecture.md` release planner contract and current release proof/import chains.

## Validation required before review can close

- corrected planner tests are green;
- focused verifier commands for unit/release planning are green;
- affected Pass G benchmark cases are rerun and no false negative remains;
- the two reported `visualRisk.test.ts` failures are either green now or proven pre-existing by exact baseline comparison; because this change modifies `visualRisk.ts`/tests, an unsupported “unrelated” claim is insufficient;
- exact-head CI and merge-latency evidence remain architect-owned after PR publication.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.
