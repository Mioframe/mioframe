# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish`, with full re-review of Pass C unit impact and the previously reported visual planner failures after two correction rounds.

## Blockers

### B1 — Pass C unit-input boundary must be redesigned, not patched again

Owner: `scripts/lib/unitRisk.ts`

Problem: `UNIT_RELEVANT_PREFIXES = ['src/', 'config/', 'scripts/']` incorrectly treats test-location/source-directory prefixes as the universe of inputs that Vitest can own. Two correction rounds have already expanded exact mappings and added CSS-specific behavior, but real unit owners are still silently missed. Per root `AGENTS.md`, repeated ownership errors after two correction rounds require returning to architecture instead of adding more workaround mappings.

Evidence:

- `config/postcss.config.test.ts` imports root `postcss.config.js`, but a root production/config module is neither an ordinary unit source nor an exact mapping, so a `postcss.config.js`-only change can skip its real Vitest owner.
- `playwright.lanes.test.ts` imports root `playwright.config.ts`, `playwright.release.config.ts`, `playwright.storybook.config.ts`, and `playwright.visual.config.ts`; those root modules are outside `UNIT_RELEVANT_PREFIXES`, so their real unit owner is omitted by unit planning.
- `tests/e2e/release/fixtures/managedReleaseFixture.test.mjs` imports sibling `managedReleaseFixture.mjs`, but source/support under `tests/e2e/**` is outside `UNIT_RELEVANT_PREFIXES`; supporting a direct `tests/e2e/**/*.test.mjs` test without supporting its imported source is internally inconsistent.
- `.gitignore -> scripts/agentEnvironment.test.mjs` is not a truthful file-as-data relation to the repository file: that test constructs temporary `.gitignore` fixtures. The real root `.gitignore` is instead consumed by `eslint.config.mjs`, while `eslint.config.test.ts` exercises the ESLint config through ESLint runtime discovery; that external relation is not represented.
- mapped CSS is currently made mapping-exclusive (`isMappedCssSource`), suppressing normal Vitest-related resolution for the same existing source. Exact external-input ownership must be additive; a mapping must not hide a real import relation.

Basis:

- `docs/testing/verify-target-architecture.md`: ordinary source/test-support inputs use supported Vitest related resolution; exact file-as-data mappings exist only for repository inputs that cannot be represented by the import relation.
- `docs/testing/architecture.md`: one truthful proof owner, smallest reliable proof, no second dependency graph.
- root `AGENTS.md`: after two correction rounds still reveal ownership errors or workaround logic, return to architecture.

Required final state:

1. Remove the directory-prefix model as the definition of the ordinary unit dependency universe.
2. Keep direct Vitest-test recognition aligned with the actual `vitest.config.ts` include set.
3. For added/modified current-tree code/config/style/test-support inputs, let Vitest `related` own import/dependency resolution across their actual repository locations, including root modules and non-Playwright support under `tests/e2e/**`.
4. Keep explicit full-unit triggers only for actual Vitest-global execution/configuration risk and status-unsafe deletion/rename cases.
5. Keep exact external-input mappings only for confirmed non-import relations (literal file-as-data reads, runtime-discovered config inputs, etc.). They are additive to ordinary related input, never a replacement for it.
6. Remove false mappings that do not consume the real repository source.
7. Do not introduce a generated dependency graph, prefix registry, or another cross-lane classifier.

Simplest viable architecture:

```text
changed current-tree input
  -> direct Vitest test? select itself
  -> explicit Vitest-global infrastructure? full
  -> eligible code/config/style/support source? pass source to `vitest related`
  -> exact confirmed external-input relation? also pass owning test(s)
  -> otherwise skip unit

deleted / unsafe moved unit-capable input
  -> full
```

The ordinary related-input decision must not depend on the source living specifically under `src/`, `config/`, or `scripts/`. Known non-runtime metadata and Playwright-owned `*.spec.ts`/browser/visual proof remain outside unit ownership.

Verification:

- fresh test-author proof must reject the current prefix-limited implementation using at minimum root `postcss.config.js`, root Playwright config ownership, and a `tests/e2e/**` Vitest fixture source;
- prove exact external-input mappings remain necessary only where related resolution cannot represent the owner;
- prove mapping + real import ownership composes additively;
- preserve deletion/rename fail-closed behavior.

### B2 — stale `visualRisk.test.ts` cases must be made deterministic before PR CI

Owner: `scripts/lib/visualRisk.test.ts`

Problem: two existing cases still use MDButton as an "unmigrated" real-filesystem fixture and expect `full`, while `develop` already contains `MDButton.visual.spec.ts`. The resolver therefore correctly finds a colocated owner and returns `focused`. The failures are pre-existing, but this finish branch changes `visualRisk.test.ts`, so focused exact-head unit CI will select the file and fail.

Evidence:

- `develop` contains `src/shared/ui/material/components/button/MDButton.visual.spec.ts`.
- the stale cases under `resolveVisualPlan unmigrated visual owners` still expect MDButton source/story changes to have no resolvable colocated owner.

Required final state: preserve the intended unmigrated/fail-closed contract with a deterministic fixture that explicitly has no colocated visual owner (for example an injected synthetic owner set), rather than relying on the current migration state of a real Material component.

Verification: the two cases prove the same planner contract and remain stable when real components later gain/lose migration state.

## Major issues

None active in `scripts/lib` beyond the blockers above.

## Resolved findings

- Previous B2 release false-negative consumer ownership is resolved: `releaseWireContract.ts`, `buildArtifact.mjs`, and release fixtures now follow confirmed consumer ownership/fail-closed behavior.
- Previous M1 release over-selection is resolved: unit-only appUpdate proof and `buildArtifact.test.mjs` no longer inherit production release impact merely by location/name.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not expand mutation/release/classification architecture while correcting Pass C.
