import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import { UNIT_FILE_AS_DATA_MAPPINGS, resolveUnitPlan } from './unitRisk.ts';
import type { ChangedPath } from './changedPaths.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

// Oracle: docs/testing/verify-target-architecture.md "Unit impact architecture"
// (Goal through "Unit acceptance") plus scripts/lib/REVIEW.md's B1 finding,
// which requires one COMPLETE bounded audit of the current Vitest-owned test
// population for direct fixed-path repository-file reads (readFileSync/
// readFile/new URL(<repo path>, import.meta.url)), not just the four
// previously-seeded examples.
//
// B1 correction pass (docs/testing/verify-unit-impact-correction.md): this
// pass corrected/added assertions for three previously-conflated concerns:
// (1) ordinary current-tree module/style/support inputs are eligible for
// Vitest `related` resolution repository-wide -- src/, config/, scripts/,
// tests/e2e/, and repository root alike -- never restricted to the Vitest
// test-discovery roots (new "repository-wide ordinary source widening"
// describe block below, using real verified relations: root
// postcss.config.js <- config/postcss.config.test.ts, root
// playwright.config.ts <- playwright.lanes.test.ts, and
// tests/e2e/release/fixtures/managedReleaseFixture.mjs <- its sibling
// .test.mjs); (2) a file-as-data mapping is always additive to real ordinary
// pass-through for the same source, never extension- or location-exclusive,
// so every mapped source that is itself a plausible ordinary
// module/style/support input (any UNIT_FILE_AS_DATA_MAPPINGS entry ending in
// .ts/.vue/.mjs/.js/.json/.css) now also expects itself in relatedInputs
// alongside its mapped owner(s) -- corrected below for vite.config.ts and
// every mapped .css source; PRIVACY.md/.gitignore/.github workflow .yml
// mappings are unaffected, since .md/.yml and extension-less paths are not
// ordinary-source-eligible shapes; (3) the .gitignore -> agentEnvironment
// mapping was independently re-verified against the real repository file
// (see "repo test fixture sanity" in scripts/agentEnvironment.test.mjs,
// which resolves and reads the real root .gitignore via
// fileURLToPath-relative path resolution, not a temp/mkdtemp fixture) and
// found still justified; no test change was needed for it.
//
// B2 correction pass (docs/testing/verify-unit-impact-correction.md, this
// round; scripts/lib/REVIEW.md B1; docs/testing/REVIEW.md B1): the B1 pass
// above covered exact non-import external ownership (mechanism 3) but left
// four mechanisms unrepresented: runtime/tool-discovered external ownership
// (mechanism 4), bounded repository-scan ownership (mechanism 5), exact
// existence/absence ownership (mechanism 6), and two corrections to the
// existing mechanism-3 mapping set. This round closes exactly those gaps,
// re-verified against the CURRENT final-branch tree (not the original
// baseline), per every real file cited below:
// (1) `eslint.config.mjs -> eslint.config.test.ts` (mechanism 4): added as a
//     new UNIT_FILE_AS_DATA_MAPPINGS entry. eslint.config.test.ts constructs
//     `new ESLint({ cwd: import.meta.dirname })` and lints in-memory code
//     snippets against eslint.config.mjs's real rules; there is no ES
//     `import` of eslint.config.mjs anywhere in that test -- ESLint's own
//     runtime loads the config file by cwd-based discovery. See "resolveUnitPlan
//     runtime/tool-discovered external ownership (mechanism 4)" below.
// (2) `.github/workflows/verify.yml` gains a fifth owner, `scripts/verify.test.ts`
//     (mechanism 3, additive): that test's "verification-release CI job timeout
//     envelope" describe block (`readVerificationReleaseTimeoutMinutes`) does a
//     direct `fs.readFileSync(...'../.github/workflows/verify.yml'...)` to
//     assert the `verification-release` job's `timeout-minutes` envelope --
//     this owner was introduced during the finish branch itself, which is why
//     the audit must use the current final tree rather than the original
//     baseline. Corrected below in the existing
//     "resolveUnitPlan file-as-data mapping selection (real UNIT_FILE_AS_DATA_MAPPINGS)"
//     describe block.
// (3) `vite.config.ts`'s mapping LOSES `scripts/release/viteBuildDate.test.mjs`
//     as an external owner (mechanism-3 correction; keeps only
//     `config/viteConfigFixtureImport.test.ts`): viteBuildDate.test.mjs has a
//     genuine `import viteConfig from '../../vite.config.ts';` ES import, so
//     that relation is real ordinary pass-through Vitest related already
//     resolves, not a file-as-data relation -- duplicating it in the mapping
//     contradicts decision #4 ("an import-reachable owner being redundantly
//     required through external metadata"). Corrected below in the existing
//     "resolveUnitPlan file-as-data mapping selection (B1-corrected new
//     relations)" describe block; pure planner assertions cannot prove
//     viteBuildDate.test.mjs is STILL reachable once the mapping is gone, so
//     that corrected test carries a comment requiring the implementer to
//     additionally prove it with a real `vitest related vite.config.ts`
//     invocation per verify-unit-impact-correction.md's "Real resolver probes
//     are mandatory for delegated ownership".
// (4) `src/shared/lib/md/tokens.css -> src/shared/ui/material/foundation/
//     tokens.test.ts` (mechanism 6, new): tokens.test.ts declares
//     `const LEGACY_TOKENS_PATH = './src/shared/lib/md/tokens.css';` and
//     asserts `expect(existsSync(LEGACY_TOKENS_PATH)).toBe(false);` (the
//     "removes the legacy mixed-owner token file" case) -- an exact
//     existence/absence contract the mapping source itself is never expected
//     to exist for. See "resolveUnitPlan exact existence/absence ownership
//     (mechanism 6)" below.
// (5) Bounded repository-scan ownership (mechanism 5, new): the nine scan
//     owners the B1 pass explicitly deferred ("deliberately NOT mapped
//     below") are now represented with narrow scan-predicate-derived tests in
//     the new "resolveUnitPlan bounded repository-scan ownership (mechanism
//     5)" describe block below, each verified against the real scanning
//     production code (not just the test file that consumes it): the exact
//     predicate every case relies on is documented inline at each scan-owner
//     sub-describe.
// (6) One existing test needed correction rather than addition: "resolves
//     button/tokens.css alone to focused with only itself in relatedInputs"
//     (mechanism-3 negative space) is still correct about there being no
//     file-as-data MAPPING for that path, but the bounded-scan audit (5)
//     above independently discovered that
//     src/shared/ui/material/foundation/tokens.test.ts's own
//     `getComponentTokenSources()` ALSO directly `readFileSync`s
//     `src/shared/ui/material/components/button/tokens.css` (it is one of
//     the scanned `components/*/tokens.css` files), so that test's exact
//     `relatedInputs` expectation was incomplete and is corrected in place
//     below to include the scan owner additively -- see the updated
//     assertion in the same describe block.
//
// Audit method: `grep -rn -E 'readFileSync|readFile\(|new URL\(' src config
// scripts tests eslint.config.test.ts`, then every hit was read and verified
// directly in its owning file (not trusted from the pattern match alone).
// Excluded as false positives / out of scope:
// - VFS/provider `.readFile()` method calls on in-memory or mounted paths
//   (WebFileSystemProvider.test.ts, VirtualFileSystem.test.ts,
//   MemoryFileSystem.test.ts, DeviceFileSystemProvider.test.ts,
//   googleDriveFileSystemProvider.test.ts, createVFSAdapter.test.ts,
//   repositoryStorageFiles*.test.ts, repositoryZipImportWorkerBoundary
//   .integration.test.ts) -- not node:fs, a virtual-filesystem abstraction;
// - a literal path string inside a stack-trace fixture
//   (src/shared/error/index.test.ts);
// - `new URL(...)` used only to build a fetch/service-worker matcher argument
//   (config/plugins/pwa.test.ts), never a file-as-data read;
// - reads of a test's own mkdtemp/temp/work directory (scripts/
//   agentEnvironment.test.mjs's CLAUDE.md/gitignore-fixture assertions,
//   scripts/lib/commandLock*.test.ts's metadata.json, every scripts/pages/**
//   and tests/e2e/release/fixtures/managedReleaseFixture.test.mjs read under
//   a locally created workDir/distDir/tempRoot);
// - directory-wide/unbounded readdirSync scans, which the architecture
//   forbids as a per-file MAPPING target (mechanism 3) regardless of what
//   they find: `src/readRecoveryImportBoundary.test.ts` (every non-test
//   .ts/.vue under src/), `src/features/fileSystemAccessImportBoundary.test.ts`
//   (every non-test .ts/.vue under src/features/),
//   `src/shared/ui/material/rendererBoundary.test.ts` (every .css/.vue/.ts/
//   .mts/.tsx under src/), and `src/shared/ui/material/foundation/
//   tokens.test.ts`'s `getComponentTokenSources()` helper (every
//   components/*/tokens.css under src/shared/ui/material/components) -- these
//   are deliberately NOT mapped as exact per-file UNIT_FILE_AS_DATA_MAPPINGS
//   entries, which remains correct; SUPERSEDED for the separate bounded-scan
//   mechanism (5), which is a narrow scan-predicate-owner relation, not a
//   per-file mapping -- see the B2 correction pass note above and the new
//   "resolveUnitPlan bounded repository-scan ownership (mechanism 5)"
//   describe block below, which represents exactly these four scans plus
//   playwright.lanes.test.ts, scripts/lib/e2eRisk.test.ts, scripts/lib/
//   e2eProjectApplicability.test.ts, scripts/lib/storybookBehaviorRisk.test.ts,
//   and scripts/lib/visualRisk.test.ts;
// - `scripts/ciAutofix.test.ts`'s direct read of the real repository
//   `package.json` (asserting `scripts['ci:autofix']`): package.json already
//   has its own dedicated version-aware full-unit trigger
//   (isPackageJsonRuntimeRelevantChange) that is strictly more precise than a
//   file-as-data mapping would be here -- a `scripts` field edit is never
//   version-only, so it already forces full unit (which includes this test),
//   and a true version-only edit never touches `scripts['ci:autofix']`, so
//   skipping this one test on that specific edit is correct, not a gap.
//
// Confirmed genuine direct fixed-path relations with NO real ES-import edge
// reaching their reader (true file-as-data, requires an exact mapping):
// - `.github/workflows/{verify,release,deploy-branch}.yml` -> the workflow-test
//   owners (release.yml/deploy-branch.yml: the original two seeded owners,
//   confirmed still correct; verify.yml: the original four seeded owners --
//   including the direct `scripts/ciAutofix.test.ts` reader, two
//   `fs.readFileSync(...'.github/workflows/verify.yml'...)` call sites
//   asserting on the autofix-commit step's exact content -- PLUS a fifth
//   owner added this round, `scripts/verify.test.ts`: its "verification-release
//   CI job timeout envelope" describe block's `readVerificationReleaseTimeoutMinutes`
//   does its own direct `fs.readFileSync` of
//   `.github/workflows/verify.yml` to extract and assert the
//   `verification-release` job's `timeout-minutes` value against the summed
//   worst-case release-impact envelope);
// - `PRIVACY.md` -> `src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts`
//   (already seeded);
// - `.gitignore` (root, outside src/config/scripts) ->
//   `scripts/agentEnvironment.test.mjs` ("repo test fixture sanity" describe,
//   resolves `../.gitignore` relative to the test file's own directory and
//   asserts its content -- a real fixed repository path, not a temp fixture);
// - `vite.config.ts` (root, outside src/config/scripts) ->
//   `config/viteConfigFixtureImport.test.ts` ONLY (direct readFileSync, a
//   true file-as-data relation the import graph cannot express regardless of
//   any prefix fix). `scripts/release/viteBuildDate.test.mjs`'s own
//   `import viteConfig from '../../vite.config.ts';` (confirmed by direct
//   read, line 7) is a genuine ES import -- real ordinary-source pass-through
//   once docs/testing/verify-unit-impact-correction.md decisions #2/#4 are
//   implemented, since vite.config.ts is a plausible ordinary `.ts` module
//   input repository-wide. B2 correction (this round): duplicating
//   viteBuildDate.test.mjs in the exact mapping ALSO, alongside the real
//   import relation, violates decision #4 ("an import-reachable owner being
//   redundantly required through external metadata") -- it must be removed
//   from UNIT_FILE_AS_DATA_MAPPINGS and left to Vitest related resolution
//   alone. vite.config.ts itself must still additively pass through to
//   Vitest related regardless -- see "selects only the direct root
//   vite.config.ts external reader plus vite.config.ts itself" below;
// - `src/shared/lib/md/index.css` -> `config/postcss.config.test.ts`,
//   `src/shared/lib/md/index.test.ts`, `src/shared/ui/material/foundation/
//   tokens.test.ts` (all three readFileSync it directly; none import it);
// - `src/shared/ui/material/foundation/tokens.css` -> `config/
//   postcss.config.test.ts`, `src/shared/ui/material/foundation/
//   tokens.test.ts` (its own describe block reads FOUNDATION_TOKENS_PATH
//   directly);
// - `src/shared/ui/material/foundation/theme.css` -> `config/
//   postcss.config.test.ts`, `src/shared/ui/material/foundation/
//   theme.test.ts` (own describe block), `src/shared/ui/material/foundation/
//   tokens.test.ts` (reads FOUNDATION_THEME_PATH too);
// - `src/shared/ui/material/foundation/index.css` -> `src/shared/ui/
//   material/foundation/tokens.test.ts` (FOUNDATION_INDEX_PATH; asserts
//   token-then-theme @import order);
// - `src/app/styles/styles.css`, `src/app/styles/base.css` -> `src/shared/
//   ui/material/foundation/tokens.test.ts` (APP_STYLES_PATH/BASE_STYLES_PATH;
//   asserts app-shell/foundation @import precedence);
// - `src/shared/ui/Card/MDCard.vue`, `src/shared/ui/Lists/
//   listItemAnatomy.css`, `src/shared/ui/State/ripple.css` ->
//   `src/shared/ui/State/MDStateLayer.test.ts` ("keeps old opacity aliases
//   out of production shared UI bridges": reads each of these three fixed
//   paths directly; the test does not import any of them).
//
// Confirmed direct read WITH a real ES-import edge already reaching the
// owner -- deliberately NOT mapped, matching "an explicit unit mapping is
// justified only when the owning test deliberately reads/consumes a
// repository file outside the import relation":
// - `config/tooling.json` (already covered by the existing "does not
//   register config/tooling.json" / "resolves config/tooling.json alone"
//   tests below): `vite.config.ts` has a real `import toolingConfig from
//   './config/tooling.json' with { type: 'json' };`, and since
//   `config/tooling.json` itself matches isOrdinaryUnitSourcePath's `src/`/
//   `config/`/`scripts/` prefix check, it is already passed to Vitest
//   related resolution directly regardless of vite.config.ts;
// - `src/shared/ui/material/components/button/tokens.css` (B1 case): `MDButton.vue`
//   has a real `import './tokens.css';` (plain JS side-effect import,
//   confirmed by direct read, line 15), and `MDButton.test.ts` has a real
//   `import MDButton from './MDButton.vue'` (line 5) -- a genuine two-hop
//   import chain Vitest's related resolution can trace, even though the test
//   ALSO happens to readFileSync the same CSS file directly for its own
//   assertion. `.css` is already part of the current unitRisk.ts's
//   ORDINARY_SOURCE_EXTENSIONS (confirmed by direct read), so the "no mapping
//   needed" conclusion for THIS relation already passed against the current
//   unfixed production module and is not part of the B1 defect. B2
//   correction: this is a SEPARATE, independently discovered relation --
//   src/shared/ui/material/foundation/tokens.test.ts's own
//   getComponentTokenSources() bounded scan (mechanism 5) ALSO directly reads
//   this exact path, which the original B1 pass did not yet represent (that
//   mechanism did not exist yet); the corrected test now expects BOTH the
//   ordinary pass-through relation (already correct) AND the scan owner
//   (newly required), so it now fails red against current unfixed production
//   until mechanism 5 is implemented -- see "resolves button/tokens.css..."
//   below.
//
// One open implementation note for the corrected unitRisk.ts, beyond adding
// UNIT_FILE_AS_DATA_MAPPINGS rows (reported in full at handoff):
// - `src/shared/ui/Card/MDCard.vue` is itself real ordinary `.vue` unit
//   source under `src/` (MDCard.test.ts imports it directly) AND a
//   file-as-data source MDStateLayer.test.ts reads without importing.
//   resolveUnitPlan's current mapping branch does an early `continue` on a
//   mapping match, which would silently suppress MDCard.vue's own ordinary
//   related-input pass-through (dropping MDCard.test.ts) once a mapping is
//   added. The corrected resolver must treat the mapping as ADDITIVE to
//   ordinary-source pass-through for the same changed path, not a mutually
//   exclusive first-match-wins branch, for a source that is genuinely both.
//   This already passes against the current unfixed production module too
//   (its mapping branch only special-cases CSS, not `.vue`); the same
//   ADDITIVE treatment is required more broadly for every mapped CSS source
//   (`isMappedCssSource` currently makes CSS mappings exclusive -- see the
//   corrected CSS mapping tests above and the B1 correction pass note at the
//   top of this file) and for every mapped source repository-wide once the
//   `UNIT_RELEVANT_PREFIXES` restriction is removed (see the "repository-wide
//   ordinary source widening" describe block below).
//
// resolveUnitPlan already exists but still has the B1 defects (prefix-
// restricted ordinary-source eligibility, CSS-mapping exclusivity) AND the B2
// defects (no runtime/tool-discovery mapping, no bounded-scan mechanism, a
// missing verify.yml owner, a redundant vite.config.ts owner, no existence/
// absence mapping); this suite is expected to show genuine assertion
// failures against the current unfixed production module, not an
// import-time failure. Do not weaken these assertions to make the current
// unfixed production module pass.
//
// B1/M1 status-aware + scan-boundary correction pass (this round;
// scripts/lib/REVIEW.md B1 and M1; docs/testing/verify-unit-impact-correction.md
// decision #4 "Exact external ownership is additive and status-aware" and
// decision #5's Playwright-inventory row): confirmed by direct read of the
// current resolveUnitPlan (scripts/lib/unitRisk.ts) that:
// (1) B1 -- `fileAsDataMappings.find(...)` sits under the `// added |
//     modified` comment, reached only after `deleted` already `continue`d
//     past the ordinary isUnitRelevantByShape fallback and `renamed` already
//     `continue`d even earlier; PRIVACY.md, .gitignore, and every
//     .github/workflows/*.yml source is neither test-shaped nor an
//     ORDINARY_SOURCE_EXTENSIONS shape, so a deleted/renamed exact-mapping
//     source currently resolves `mode: 'skip'`, silently losing its
//     surviving owner. New "resolveUnitPlan status-aware exact external
//     ownership" describe block below covers deleted/renamed verify.yml,
//     PRIVACY.md, and .gitignore (status-only proof per
//     verify-unit-impact-correction.md's "Real resolver probes" section,
//     since executing the real repository after deleting/renaming these
//     canonical inputs would be destructive), each with a fileExists-override
//     case proving current source existence is never required to recognize
//     the relation, plus one composition-safety case confirming full still
//     dominates a changeset that also carries a real exact-owner relation.
// (2) M1 -- the current UNIT_SCAN_OWNERS entry for playwright.lanes.test.ts
//     reuses `isPlaywrightOnlyProofPath` as its `matchesPath` (confirmed by
//     direct read, including that function's own "functionally the same
//     population isPlaywrightOnlyProofPath already recognizes" comment,
//     which is the wrong claim this correction fixes), but
//     isPlaywrightOnlyProofPath matches ANY `.spec.ts` file at arbitrary
//     nesting depth under tests/e2e/ with no subtree restriction, over-broad
//     relative to the six real populations playwright.lanes.test.ts's own
//     filesystem scan enumerates. New "Must reject" case added to the
//     existing "playwright.lanes.test.ts (scans the complete current
//     Playwright spec population...)" describe block below, using
//     tests/e2e/other/example.spec.ts: `.spec.ts`-shaped and under
//     tests/e2e/, so it matches isPlaywrightOnlyProofPath and IS currently
//     (incorrectly) selected, but is outside every one of the six real
//     scanned sub-populations.

function added(filePath: string): ChangedPath {
  return { status: 'added', path: filePath };
}

function modified(filePath: string): ChangedPath {
  return { status: 'modified', path: filePath };
}

function deleted(filePath: string): ChangedPath {
  return { status: 'deleted', path: filePath };
}

function renamed(oldPath: string, newPath: string): ChangedPath {
  return { status: 'renamed', oldPath, newPath };
}

const EVERYTHING_EXISTS = () => true;
const NOTHING_EXISTS = () => false;

// Selective fileExists override for status-aware exact-ownership proof: every
// path exists except the ones listed, so a deleted/renamed mapping SOURCE can
// be asserted absent from the tree while the real UNIT_FILE_AS_DATA_MAPPINGS
// registry's owning test paths (validated by validateFileAsDataMappings via
// the same fileExists callback) still resolve to existing on disk.
function existsExceptFor(...excludedPaths: string[]): (filePath: string) => boolean {
  return (filePath: string) => !excludedPaths.includes(filePath);
}

describe('resolveUnitPlan registry validation', () => {
  it('accepts the real UNIT_FILE_AS_DATA_MAPPINGS registry with no changed paths', () => {
    const plan = resolveUnitPlan([]);

    expect(plan.mode).toBe('skip');
  });

  it('fails invalid when a mapping has an empty source', () => {
    const plan = resolveUnitPlan([added('PRIVACY.md')], {
      fileAsDataMappings: [
        {
          source: '',
          tests: ['src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts'],
        },
      ],
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.reasons.length).toBeGreaterThan(0);
  });

  it('fails invalid when a mapping has empty tests', () => {
    const plan = resolveUnitPlan([], {
      fileAsDataMappings: [{ source: 'PRIVACY.md', tests: [] }],
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
  });

  it('fails invalid when a source is registered more than once across mappings', () => {
    const plan = resolveUnitPlan([], {
      fileAsDataMappings: [
        {
          source: 'PRIVACY.md',
          tests: ['src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts'],
        },
        {
          source: 'PRIVACY.md',
          tests: ['src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts'],
        },
      ],
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
  });

  it('fails invalid when a referenced owning test does not exist on disk', () => {
    const plan = resolveUnitPlan([], {
      fileAsDataMappings: [
        { source: 'PRIVACY.md', tests: ['src/pages/DoesNotExist/DoesNotExist.test.ts'] },
      ],
      fileExists: NOTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
  });

  it('fails invalid when a referenced test path is not test-shaped (missing .test.ts/.test.mjs)', () => {
    const plan = resolveUnitPlan([], {
      fileAsDataMappings: [
        {
          source: 'PRIVACY.md',
          tests: ['src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.ts'],
        },
      ],
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
  });

  it('fails invalid when a referenced test path lives outside an included location', () => {
    const plan = resolveUnitPlan([], {
      fileAsDataMappings: [
        { source: 'PRIVACY.md', tests: ['tools/DataStoragePrivacyPane.test.ts'] },
      ],
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
  });

  it('fails invalid when a referenced tests/e2e path is Playwright-shaped (.spec.ts) instead of .test.mjs-shaped', () => {
    const plan = resolveUnitPlan([], {
      fileAsDataMappings: [{ source: 'PRIVACY.md', tests: ['tests/e2e/appSmoke.spec.ts'] }],
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
  });

  it('dominates an otherwise full-triggering changeset when the registry is broken', () => {
    const plan = resolveUnitPlan([modified('vitest.config.ts'), added('PRIVACY.md')], {
      fileAsDataMappings: [{ source: 'PRIVACY.md', tests: [] }],
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
  });
});

describe('resolveUnitPlan full-unit infrastructure triggers', () => {
  const INFRASTRUCTURE_FILES = [
    'vitest.config.ts',
    'src/setupVitest.ts',
    'config/alias.ts',
    'config/plugins/base.ts',
    'pnpm-lock.yaml',
  ];

  it.each(INFRASTRUCTURE_FILES)('runs full unit for a modified %s', (filePath) => {
    const plan = resolveUnitPlan([modified(filePath)]);

    expect(plan.mode).toBe('full');
  });

  it.each(INFRASTRUCTURE_FILES)('runs full unit for a deleted %s', (filePath) => {
    const plan = resolveUnitPlan([deleted(filePath)]);

    expect(plan.mode).toBe('full');
  });

  it('runs full unit when vitest.config.ts is the old side of a rename', () => {
    const plan = resolveUnitPlan([renamed('vitest.config.ts', 'vitest.config.renamed.ts')]);

    expect(plan.mode).toBe('full');
  });

  it('runs full unit when config/alias.ts is the new side of a rename', () => {
    const plan = resolveUnitPlan([renamed('config/oldAlias.ts', 'config/alias.ts')]);

    expect(plan.mode).toBe('full');
  });
});

describe('resolveUnitPlan package.json impact', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('does not force full unit for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveUnitPlan([modified('package.json')], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).not.toBe('full');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('resolves skip for a version-only package.json change with no other unit-relevant path', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveUnitPlan([modified('package.json')], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('skip');
  });

  it('runs full unit for a runtime-relevant package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveUnitPlan([modified('package.json')], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('full');
  });

  it('runs full unit when the package.json comparison is unresolvable (fails closed)', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveUnitPlan([modified('package.json')], { packageJsonOldRef: null });

    expect(plan.mode).toBe('full');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: null });
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    resolveUnitPlan([added('config/tooling.json')]);

    expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
  });
});

describe('resolveUnitPlan deletion and rename safety', () => {
  it('forces full unit for a deleted ordinary unit source with no surviving replacement', () => {
    const plan = resolveUnitPlan([deleted('src/entities/foo/foo.ts')]);

    expect(plan.mode).toBe('full');
  });

  it('forces full unit for a deleted unit test file', () => {
    const plan = resolveUnitPlan([deleted('src/entities/foo/foo.test.ts')]);

    expect(plan.mode).toBe('full');
  });

  it('forces full unit for a deleted scripts/** support module', () => {
    const plan = resolveUnitPlan([deleted('scripts/lib/someHelper.ts')]);

    expect(plan.mode).toBe('full');
  });

  it('forces full unit when the old side of a rename was unit-relevant source', () => {
    const plan = resolveUnitPlan([
      renamed('src/entities/foo/foo.ts', 'src/entities/foo/fooRenamed.ts'),
    ]);

    expect(plan.mode).toBe('full');
  });

  it('forces full unit when the new side of a rename is unit-relevant source, even with a non-relevant old side', () => {
    const plan = resolveUnitPlan([renamed('README.md', 'src/entities/foo/foo.ts')]);

    expect(plan.mode).toBe('full');
  });

  it('does not force full when neither side of a rename is unit-relevant', () => {
    const plan = resolveUnitPlan([renamed('docs/a.md', 'docs/b.md')]);

    expect(plan.mode).toBe('skip');
  });

  it('does not force full for a deleted path outside src/config/scripts (not unit-relevant by shape)', () => {
    const plan = resolveUnitPlan([deleted('docs/testing/architecture.md')]);

    expect(plan.mode).toBe('skip');
  });
});

describe('resolveUnitPlan file-as-data mapping selection (real UNIT_FILE_AS_DATA_MAPPINGS)', () => {
  it('exposes exactly the B1/B2-corrected complete set of file-as-data mappings, no more and no less', () => {
    expect(UNIT_FILE_AS_DATA_MAPPINGS.map((mapping) => mapping.source).sort()).toEqual([
      '.github/workflows/deploy-branch.yml',
      '.github/workflows/release.yml',
      '.github/workflows/verify.yml',
      '.gitignore',
      'PRIVACY.md',
      'eslint.config.mjs',
      'src/app/styles/base.css',
      'src/app/styles/styles.css',
      'src/shared/lib/md/index.css',
      'src/shared/lib/md/tokens.css',
      'src/shared/ui/Card/MDCard.vue',
      'src/shared/ui/Lists/listItemAnatomy.css',
      'src/shared/ui/State/ripple.css',
      'src/shared/ui/material/foundation/index.css',
      'src/shared/ui/material/foundation/theme.css',
      'src/shared/ui/material/foundation/tokens.css',
      'vite.config.ts',
    ]);
  });

  it('does not register config/tooling.json as a file-as-data mapping', () => {
    expect(
      UNIT_FILE_AS_DATA_MAPPINGS.some((mapping) => mapping.source === 'config/tooling.json'),
    ).toBe(false);
  });

  it('selects DataStoragePrivacyPane.test.ts for a PRIVACY.md change', () => {
    const plan = resolveUnitPlan([modified('PRIVACY.md')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts',
    ]);
  });

  it('does not include PRIVACY.md itself in relatedInputs', () => {
    const plan = resolveUnitPlan([modified('PRIVACY.md')]);

    expect(plan.relatedInputs).not.toContain('PRIVACY.md');
  });

  it('selects both workflow test owners for .github/workflows/release.yml', () => {
    const plan = resolveUnitPlan([modified('.github/workflows/release.yml')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
    ]);
  });

  it('selects all five confirmed workflow test owners for .github/workflows/verify.yml, including the direct ciAutofix.test.ts reader and the B2-added scripts/verify.test.ts reader', () => {
    // scripts/verify.test.ts's "verification-release CI job timeout envelope"
    // describe block (readVerificationReleaseTimeoutMinutes) does a direct
    // fs.readFileSync of the real repository .github/workflows/verify.yml to
    // assert the verification-release job's timeout-minutes envelope -- this
    // owner was introduced on the finish branch itself (scripts/lib/REVIEW.md
    // B1), so it is confirmed against the current tree, not the original
    // baseline.
    const plan = resolveUnitPlan([modified('.github/workflows/verify.yml')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/ciAutofix.test.ts',
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
      'scripts/release/materializePrVersionWorkflow.test.mjs',
      'scripts/verify.test.ts',
    ]);
  });

  it('selects both workflow test owners for .github/workflows/deploy-branch.yml', () => {
    const plan = resolveUnitPlan([modified('.github/workflows/deploy-branch.yml')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
    ]);
  });

  it('dedupes the shared workflow test owners when release.yml and verify.yml change together, still including ciAutofix.test.ts and scripts/verify.test.ts from verify.yml', () => {
    const plan = resolveUnitPlan([
      modified('.github/workflows/release.yml'),
      modified('.github/workflows/verify.yml'),
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/ciAutofix.test.ts',
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
      'scripts/release/materializePrVersionWorkflow.test.mjs',
      'scripts/verify.test.ts',
    ]);
  });
});

describe('resolveUnitPlan file-as-data mapping selection (B1-corrected new relations)', () => {
  it('selects scripts/agentEnvironment.test.mjs for a .gitignore change (root file outside src/config/scripts; real fixed-path reader with no ES-import edge)', () => {
    const plan = resolveUnitPlan([modified('.gitignore')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/agentEnvironment.test.mjs']);
  });

  it('selects only the direct root vite.config.ts external reader plus vite.config.ts itself, now that the redundant scripts/release/viteBuildDate.test.mjs mapping is removed (B2 correction: verify-unit-impact-correction.md decision #4 forbids duplicating an import-reachable owner in external metadata -- scripts/release/viteBuildDate.test.mjs has a real "import viteConfig from \'../../vite.config.ts\';" ES import, confirmed by direct read, so it must be reached only through real Vitest related resolution of vite.config.ts itself, not a mapping entry)', () => {
    const plan = resolveUnitPlan([modified('vite.config.ts')]);

    expect(plan.mode).toBe('focused');
    // Pure planner output cannot prove scripts/release/viteBuildDate.test.mjs
    // is STILL selected once the redundant mapping is gone -- that requires a
    // real `vitest related vite.config.ts` invocation (see
    // docs/testing/verify-unit-impact-correction.md "Real resolver probes are
    // mandatory for delegated ownership"). This assertion only proves the
    // planner's own contract: the remaining exact mapping owner, additive to
    // vite.config.ts itself as ordinary pass-through.
    expect(plan.relatedInputs).toEqual([
      'config/viteConfigFixtureImport.test.ts',
      'vite.config.ts',
    ]);
  });

  it("selects every confirmed direct reader of src/shared/lib/md/index.css, plus the CSS source itself as additive ordinary pass-through (mapped CSS must not suppress a real ordinary import consumer), plus the bounded-scan owner that also observes it (B2 correction: this path is a .css file outside src/shared/ui/material/**, so it falls inside src/shared/ui/material/rendererBoundary.test.ts's scanned population too)", () => {
    const plan = resolveUnitPlan([modified('src/shared/lib/md/index.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'config/postcss.config.test.ts',
      'src/shared/lib/md/index.css',
      'src/shared/lib/md/index.test.ts',
      'src/shared/ui/material/foundation/tokens.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it('selects every confirmed direct reader of the Material foundation tokens.css, plus the CSS source itself as additive ordinary pass-through', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/material/foundation/tokens.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'config/postcss.config.test.ts',
      'src/shared/ui/material/foundation/tokens.css',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ]);
  });

  it('selects every confirmed direct reader of the Material foundation theme.css, plus the CSS source itself as additive ordinary pass-through', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/material/foundation/theme.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'config/postcss.config.test.ts',
      'src/shared/ui/material/foundation/theme.css',
      'src/shared/ui/material/foundation/theme.test.ts',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ]);
  });

  it('selects the direct reader of foundation/index.css, plus the CSS source itself as additive ordinary pass-through', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/material/foundation/index.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/shared/ui/material/foundation/index.css',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ]);
  });

  it('selects the direct reader of src/app/styles/styles.css, plus the CSS source itself as additive ordinary pass-through, plus the bounded-scan owner that also observes it (B2 correction: outside src/shared/ui/material/**)', () => {
    const plan = resolveUnitPlan([modified('src/app/styles/styles.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/app/styles/styles.css',
      'src/shared/ui/material/foundation/tokens.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it('selects the direct reader of src/app/styles/base.css, plus the CSS source itself as additive ordinary pass-through, plus the bounded-scan owner that also observes it (B2 correction: outside src/shared/ui/material/**)', () => {
    const plan = resolveUnitPlan([modified('src/app/styles/base.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/app/styles/base.css',
      'src/shared/ui/material/foundation/tokens.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it('selects the direct reader of src/shared/ui/Lists/listItemAnatomy.css (MDStateLayer.test.ts cross-file opacity-alias assertions), plus the CSS source itself as additive ordinary pass-through, plus the bounded-scan owner that also observes it (B2 correction: outside src/shared/ui/material/**)', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Lists/listItemAnatomy.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/shared/ui/Lists/listItemAnatomy.css',
      'src/shared/ui/State/MDStateLayer.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it('selects the direct reader of src/shared/ui/State/ripple.css (MDStateLayer.test.ts cross-file opacity-alias assertions), plus the CSS source itself as additive ordinary pass-through, plus the bounded-scan owner that also observes it (B2 correction: outside src/shared/ui/material/**)', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/State/ripple.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/shared/ui/State/MDStateLayer.test.ts',
      'src/shared/ui/State/ripple.css',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it("selects the file-as-data owner, the ordinary-source owner, and both bounded-scan owners for src/shared/ui/Card/MDCard.vue (unlike the other two MDStateLayer.test.ts file-as-data sources, MDCard.vue is itself real .vue unit source with its own colocated MDCard.test.ts, reached only through ordinary related-input pass-through; the mapping must not suppress that real relation. B2 correction: this .vue path, outside src/features/ and outside src/shared/ui/material/**, additionally falls inside BOTH src/readRecoveryImportBoundary.test.ts's and src/shared/ui/material/rendererBoundary.test.ts's scanned populations)", () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Card/MDCard.vue')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/readRecoveryImportBoundary.test.ts',
      'src/shared/ui/Card/MDCard.vue',
      'src/shared/ui/State/MDStateLayer.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });
});

describe('resolveUnitPlan status-aware exact external ownership (scripts/lib/REVIEW.md B1; docs/testing/verify-unit-impact-correction.md decision #4 "Exact external ownership is additive and status-aware")', () => {
  // Confirmed by direct read of resolveUnitPlan's changed-path loop
  // (scripts/lib/unitRisk.ts): the `fileAsDataMappings.find(...)` lookup sits
  // under the `// added | modified` comment, reached only after an explicit
  // `if (change.status === 'deleted') { ...; continue; }` early return and
  // only for the non-`renamed` branch (renamed changes `continue` even
  // earlier, right after checkInfrastructureTrigger/checkScanOwners, never
  // falling through to the mapping lookup at all). PRIVACY.md, .gitignore,
  // and every .github/workflows/*.yml mapping source is neither test-shaped
  // (isTestShapedPath) nor an ORDINARY_SOURCE_EXTENSIONS shape
  // (isOrdinaryUnitSourcePath), so the existing deleted/renamed
  // isUnitRelevantByShape fallback that rescues ordinary sources (see
  // "resolveUnitPlan deletion and rename safety" above) never rescues these
  // either -- a deleted or renamed exact-mapping-only source currently falls
  // all the way through to `mode: 'skip'`, silently dropping a real
  // surviving Vitest owner. Every assertion below that exercises a
  // deleted/renamed exact-mapping source is expected to fail red (wrong
  // `mode`/`relatedInputs`) against the current unfixed resolveUnitPlan.

  it('deleted .github/workflows/verify.yml still selects all five surviving exact owners (Must reject: mode "skip", silently dropping every workflow-test owner)', () => {
    const plan = resolveUnitPlan([deleted('.github/workflows/verify.yml')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/ciAutofix.test.ts',
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
      'scripts/release/materializePrVersionWorkflow.test.mjs',
      'scripts/verify.test.ts',
    ]);
  });

  it('deleted .github/workflows/verify.yml selects its owners purely from the fixed-path contract, independent of current source existence on disk', () => {
    const plan = resolveUnitPlan([deleted('.github/workflows/verify.yml')], {
      fileExists: existsExceptFor('.github/workflows/verify.yml'),
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('scripts/verify.test.ts');
  });

  it('renamed .github/workflows/verify.yml (old side) still selects its surviving exact owners via the old path -- the new path (.yml.bak) is deliberately chosen to match neither isOrdinaryUnitSourcePath (not one of ORDINARY_SOURCE_EXTENSIONS) nor any other UNIT_FILE_AS_DATA_MAPPINGS source, isolating the exact-mapping relation being proved here', () => {
    const plan = resolveUnitPlan([
      renamed('.github/workflows/verify.yml', '.github/workflows/verify.yml.bak'),
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/ciAutofix.test.ts',
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
      'scripts/release/materializePrVersionWorkflow.test.mjs',
      'scripts/verify.test.ts',
    ]);
  });

  it('deleted PRIVACY.md still selects DataStoragePrivacyPane.test.ts (Must reject: mode "skip", silently dropping the owner)', () => {
    const plan = resolveUnitPlan([deleted('PRIVACY.md')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts',
    ]);
  });

  it('deleted PRIVACY.md selects its owner purely from the fixed-path contract, independent of current source existence on disk', () => {
    const plan = resolveUnitPlan([deleted('PRIVACY.md')], {
      fileExists: existsExceptFor('PRIVACY.md'),
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain(
      'src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts',
    );
  });

  it('renamed PRIVACY.md (old side) still selects its owner via the old path (Must reject: mode "skip", losing the owner on rename) -- the new path (PRIVACY.archived.md) deliberately does not match any ordinary-source shape or other mapping', () => {
    const plan = resolveUnitPlan([renamed('PRIVACY.md', 'PRIVACY.archived.md')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts',
    ]);
  });

  it('renamed PRIVACY.md (old side) selects its owner purely from the fixed-path contract, independent of current source existence on disk (neither the old nor the new path exists post-rename)', () => {
    const plan = resolveUnitPlan([renamed('PRIVACY.md', 'PRIVACY.archived.md')], {
      fileExists: existsExceptFor('PRIVACY.md', 'PRIVACY.archived.md'),
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain(
      'src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts',
    );
  });

  it('deleted .gitignore still selects scripts/agentEnvironment.test.mjs (Must reject: mode "skip", silently dropping the owner)', () => {
    const plan = resolveUnitPlan([deleted('.gitignore')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/agentEnvironment.test.mjs']);
  });

  it('renamed .gitignore (old side) still selects its owner via the old path -- the new path (.gitignore.disabled) deliberately does not match any ordinary-source shape or other mapping', () => {
    const plan = resolveUnitPlan([renamed('.gitignore', '.gitignore.disabled')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/agentEnvironment.test.mjs']);
  });

  it('composition safety: a deleted exact-mapping source together with a deleted ordinary unit source in the same changeset still resolves full, so status-aware exact ownership never weakens the existing unsafe-deletion full-unit fallback (already true on the current unfixed resolver too -- this is a regression guard for the fix, not a red proof of the B1 defect itself)', () => {
    const plan = resolveUnitPlan([deleted('PRIVACY.md'), deleted('src/entities/foo/foo.ts')]);

    expect(plan.mode).toBe('full');
  });
});

describe('resolveUnitPlan repository-wide ordinary source widening (B1-corrected: dependency-input eligibility is not limited to src/config/scripts, and tests/e2e/** non-test helpers are eligible too)', () => {
  it('selects the real root postcss.config.js as ordinary source pass-through -- config/postcss.config.test.ts has a real "import postcssConfig from \'../postcss.config.js\'" edge to this exact root module; resolveUnitPlan only selects which paths to hand to Vitest related, it does not itself trace the import graph', () => {
    const plan = resolveUnitPlan([modified('postcss.config.js')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['postcss.config.js']);
  });

  it('selects a real root Playwright config module as ordinary source pass-through -- playwright.lanes.test.ts has a real "import appConfig from \'./playwright.config\'" edge to this exact root .ts module', () => {
    const plan = resolveUnitPlan([modified('playwright.config.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['playwright.config.ts']);
  });

  it('selects a real tests/e2e/** non-test helper as ordinary source pass-through -- tests/e2e/release/fixtures/managedReleaseFixture.test.mjs imports materializeManagedRelease/mutateControllerWorkerBytes from this exact adjacent tests/e2e/** module, but the current UNIT_RELEVANT_PREFIXES excludes tests/e2e/** from ordinary-source eligibility entirely', () => {
    const plan = resolveUnitPlan([
      modified('tests/e2e/release/fixtures/managedReleaseFixture.mjs'),
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['tests/e2e/release/fixtures/managedReleaseFixture.mjs']);
  });
});

describe('resolveUnitPlan does not add an unnecessary mapping when a real import edge already reaches the owner (Must reject: unnecessary mapping)', () => {
  it('does not register src/shared/ui/material/components/button/tokens.css as a file-as-data mapping', () => {
    expect(
      UNIT_FILE_AS_DATA_MAPPINGS.some(
        (mapping) => mapping.source === 'src/shared/ui/material/components/button/tokens.css',
      ),
    ).toBe(false);
  });

  it('resolves button/tokens.css to focused with itself plus src/shared/ui/material/foundation/tokens.test.ts, via two DISTINCT real mechanisms rather than a mapping: MDButton.vue has a real "import \'./tokens.css\';" edge and MDButton.test.ts imports MDButton.vue (ordinary Vitest related pass-through, mechanism 2), AND tokens.test.ts\'s own getComponentTokenSources() directly readFileSync\'s every existing src/shared/ui/material/components/*/tokens.css, including this one (bounded repository-scan ownership, mechanism 5 -- see "resolveUnitPlan bounded repository-scan ownership (mechanism 5)" below). B2 correction: this assertion was originally narrower ("only itself in relatedInputs"), which was correct about there being no mechanism-3 MAPPING here, but incomplete once the mechanism-5 scan audit confirmed tokens.test.ts also directly observes this exact path', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/material/components/button/tokens.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/shared/ui/material/components/button/tokens.css',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ]);
  });
});

describe('resolveUnitPlan runtime/tool-discovered external ownership (mechanism 4)', () => {
  it('selects eslint.config.test.ts for a modified eslint.config.mjs, additive to eslint.config.mjs itself as ordinary Vitest-related pass-through -- eslint.config.test.ts constructs a real "new ESLint({ cwd: import.meta.dirname })" (confirmed by direct read, line 6) and lints in-memory code snippets against eslint.config.mjs\'s real rules (the m3e renderer-boundary and private-verifier-documentation describe blocks); there is no ES `import` of eslint.config.mjs anywhere in that test, so ESLint\'s own cwd-based runtime discovery is the only real relation, not the import graph', () => {
    const plan = resolveUnitPlan([modified('eslint.config.mjs')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['eslint.config.mjs', 'eslint.config.test.ts']);
  });

  it('selects eslint.config.test.ts for an added eslint.config.mjs too', () => {
    const plan = resolveUnitPlan([added('eslint.config.mjs')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('eslint.config.test.ts');
  });
});

describe('resolveUnitPlan exact existence/absence ownership (mechanism 6)', () => {
  it("selects src/shared/ui/material/foundation/tokens.test.ts for a resurrected legacy src/shared/lib/md/tokens.css path, additive to the path itself as ordinary Vitest-related pass-through -- tokens.test.ts declares `const LEGACY_TOKENS_PATH = './src/shared/lib/md/tokens.css';` and asserts `expect(existsSync(LEGACY_TOKENS_PATH)).toBe(false);` (the \"removes the legacy mixed-owner token file\" case, confirmed by direct read). The mapping SOURCE is not currently expected to exist on disk -- that is exactly the forbidden-path contract this mapping must catch if the path is ever resurrected -- only the mapping's owning TEST paths are validated for existence by the registry. Note: this path is ALSO inside the rendererBoundary.test.ts bounded-scan population (a .css file outside src/shared/ui/material/**, matched by path shape alone per decision #5, independent of the path's current existence) -- toContain is used rather than an exact array so this test asserts only the mechanism-6 relation it is about, not the full composed set", () => {
    const plan = resolveUnitPlan([added('src/shared/lib/md/tokens.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('src/shared/lib/md/tokens.css');
    expect(plan.relatedInputs).toContain('src/shared/ui/material/foundation/tokens.test.ts');
  });

  it('also selects the owner for a modified (not just added) resurrection of the forbidden path', () => {
    const plan = resolveUnitPlan([modified('src/shared/lib/md/tokens.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('src/shared/ui/material/foundation/tokens.test.ts');
  });
});

describe('resolveUnitPlan bounded repository-scan ownership (mechanism 5)', () => {
  // Every scan predicate below was confirmed by directly reading the real
  // scanning production code (not just the test file that consumes it); see
  // the B2 correction pass note at the top of this file for the full list.
  // This is the CONTRACT the corrected unitRisk.ts must mirror -- narrow
  // local rules, not per-file mappings, per
  // docs/testing/verify-unit-impact-correction.md decision #5.

  describe('src/readRecoveryImportBoundary.test.ts (scans production src/**/*.{ts,vue}, excluding any path containing ".test.")', () => {
    it('selects the scan owner for a representative src/** .ts file inside src/shared/ui/material (isolated from the rendererBoundary scan below, which excludes that subtree)', () => {
      const plan = resolveUnitPlan([modified('src/shared/ui/material/index.ts')]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toContain('src/readRecoveryImportBoundary.test.ts');
      expect(plan.relatedInputs).not.toContain('src/shared/ui/material/rendererBoundary.test.ts');
    });

    it('Must reject: does not select the scan owner for a path with the wrong extension (the scan predicate is only .ts/.vue)', () => {
      const plan = resolveUnitPlan([modified('src/entities/foo/foo.css')]);

      expect(plan.relatedInputs).not.toContain('src/readRecoveryImportBoundary.test.ts');
    });
  });

  describe('src/features/fileSystemAccessImportBoundary.test.ts (scans production src/features/**/*.{ts,vue}, excluding any path containing ".test.")', () => {
    it('selects the scan owner for a representative src/features/** .ts file', () => {
      const plan = resolveUnitPlan([modified('src/features/documentCreate/index.ts')]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toContain('src/features/fileSystemAccessImportBoundary.test.ts');
    });

    it('Must reject: does not select the scan owner for a path just outside src/features/ (wrong directory)', () => {
      const plan = resolveUnitPlan([modified('src/entities/foo/foo.ts')]);

      expect(plan.relatedInputs).not.toContain(
        'src/features/fileSystemAccessImportBoundary.test.ts',
      );
    });
  });

  describe('src/shared/ui/material/rendererBoundary.test.ts (scans src/**/*.{css,vue,ts,mts,tsx} OUTSIDE src/shared/ui/material/**; unlike the two scans above, collectRuntimeFiles has no ".test." exclusion at all, confirmed by direct read)', () => {
    it('selects the scan owner for a .test.ts path outside the Material subtree, additive to that changed test selecting itself -- this isolates the "no .test. exclusion" behavior that distinguishes this scan from the two src-wide scans above, both of which would exclude this exact path', () => {
      const plan = resolveUnitPlan([modified('src/entities/foo/foo.test.ts')], {
        fileExists: EVERYTHING_EXISTS,
      });

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toContain('src/shared/ui/material/rendererBoundary.test.ts');
      expect(plan.relatedInputs).not.toContain('src/readRecoveryImportBoundary.test.ts');
      expect(plan.relatedInputs).not.toContain(
        'src/features/fileSystemAccessImportBoundary.test.ts',
      );
    });

    it('Must reject: does not select the scan owner for a path inside src/shared/ui/material/** (excluded subtree), even though it is itself a Vitest test file', () => {
      const plan = resolveUnitPlan(
        [modified('src/shared/ui/material/components/button/MDButton.test.ts')],
        { fileExists: EVERYTHING_EXISTS },
      );

      expect(plan.relatedInputs).not.toContain('src/shared/ui/material/rendererBoundary.test.ts');
    });
  });

  describe('src/shared/ui/material/foundation/tokens.test.ts (getComponentTokenSources scans exactly src/shared/ui/material/components/<single-segment>/tokens.css; non-recursive, exact filename)', () => {
    it('selects the scan owner for the real existing button/tokens.css (already covered above via the corrected "resolves button/tokens.css" assertion; re-asserted here as the canonical positive case for this scan)', () => {
      const plan = resolveUnitPlan([
        modified('src/shared/ui/material/components/button/tokens.css'),
      ]);

      expect(plan.relatedInputs).toContain('src/shared/ui/material/foundation/tokens.test.ts');
    });

    it('Must reject: does not select the scan owner for a nested tokens.css one level too deep (the scan is non-recursive)', () => {
      const plan = resolveUnitPlan([
        modified('src/shared/ui/material/components/button/nested/tokens.css'),
      ]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toEqual([
        'src/shared/ui/material/components/button/nested/tokens.css',
      ]);
    });

    it('Must reject: does not select the scan owner for a differently-named CSS file in a component directory (the scan predicate is the exact filename tokens.css)', () => {
      const plan = resolveUnitPlan([
        modified('src/shared/ui/material/components/button/other.css'),
      ]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toEqual(['src/shared/ui/material/components/button/other.css']);
    });
  });

  describe('playwright.lanes.test.ts (scans the complete current Playwright spec population it enumerates: tests/e2e/*.spec.ts direct children (non-recursive), tests/e2e/storybook/**/*.spec.ts, tests/e2e/visual/**/*.spec.ts, tests/e2e/release/**/*.spec.ts, src/**/*.browser.spec.ts, and src/**/*.visual.spec.ts)', () => {
    // M1 correction (scripts/lib/REVIEW.md): the current UNIT_SCAN_OWNERS
    // entry for playwright.lanes.test.ts reuses `isPlaywrightOnlyProofPath`
    // as its `matchesPath` (confirmed by direct read of scripts/lib/unitRisk.ts,
    // whose own comment there calls this "functionally the same population
    // isPlaywrightOnlyProofPath already recognizes" -- WRONG per this
    // correction). isPlaywrightOnlyProofPath's real check is only
    // `filePath.startsWith('tests/e2e/') && filePath.endsWith('.spec.ts')`,
    // with no subtree restriction at all, so it matches a `.spec.ts` file at
    // ANY nesting depth under tests/e2e/ -- broader than the six real
    // populations this test's own filesystem scan enumerates (listed in this
    // describe's title). The corrected resolveUnitPlan must give
    // playwright.lanes.test.ts a DEDICATED narrow scan predicate matching
    // exactly those six populations, not a reused isPlaywrightOnlyProofPath
    // reference, while isPlaywrightOnlyProofPath itself remains correct and
    // unchanged for its separate ordinary-Vitest-exclusion responsibility
    // (see isOrdinaryUnitSourcePath). The "Must reject: nested-subtree
    // outside every real scanned population" case below is the proof that
    // currently fails red under the over-broad reused predicate.
    it.each([
      ['tests/e2e/appSmoke.spec.ts'],
      ['tests/e2e/storybook/colorOwnership.spec.ts'],
      ['tests/e2e/visual/shared-ui/md-button.spec.ts'],
      ['tests/e2e/release/productionArtifactSmoke.spec.ts'],
      ['src/shared/ui/material/components/button/MDButton.browser.spec.ts'],
    ])(
      'selects the scan owner for a representative spec in each scanned sub-population, without ever selecting the Playwright spec path itself as an ordinary Vitest source: %s',
      (specPath) => {
        const plan = resolveUnitPlan([modified(specPath)]);

        expect(plan.mode).toBe('focused');
        expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
        expect(plan.relatedInputs).not.toContain(specPath);
      },
    );

    it('selects the scan owner for a DELETED Playwright spec too -- deleting a spec still changes the real population playwright.lanes.test.ts observes. The current unfixed production module instead resolves this to skip, because isUnitRelevantByShape explicitly excludes Playwright-only proof paths (isPlaywrightOnlyProofPath) from ever forcing a full-unit trigger on deletion; the corrected behavior must select the scan owner as a focused input instead. (tests/e2e/appSmoke.spec.ts is also root-level, so scripts/lib/e2eRisk.test.ts and scripts/lib/e2eProjectApplicability.test.ts are additionally selected via their own root-scan predicates -- see those describe blocks below; toContain is used here so this test asserts only the playwright.lanes.test.ts relation)', () => {
      const plan = resolveUnitPlan([deleted('tests/e2e/appSmoke.spec.ts')]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
    });

    it('Must reject: does not select the scan owner for a tests/e2e/** support file that is not itself a .spec.ts (outside every scanned sub-population)', () => {
      const plan = resolveUnitPlan([modified('tests/e2e/helpers.ts')]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toEqual(['tests/e2e/helpers.ts']);
      expect(plan.relatedInputs).not.toContain('playwright.lanes.test.ts');
    });

    it("Must reject: does not select the scan owner for a path that IS .spec.ts-shaped and lives somewhere under tests/e2e/, but in a nested subtree OUTSIDE all six real scanned populations (M1 -- this is the critical case distinguishing the corrected narrow predicate from the over-broad isPlaywrightOnlyProofPath reuse: tests/e2e/other/example.spec.ts matches isPlaywrightOnlyProofPath's unrestricted `startsWith('tests/e2e/') && endsWith('.spec.ts')` check, so the CURRENT unfixed resolver incorrectly selects playwright.lanes.test.ts for it, even though the real test never enumerates a tests/e2e/other/** subtree -- only root tests/e2e/*.spec.ts direct children plus storybook/, visual/, and release/)", () => {
      const plan = resolveUnitPlan([modified('tests/e2e/other/example.spec.ts')]);

      expect(plan.relatedInputs).not.toContain('playwright.lanes.test.ts');
    });
  });

  describe('scripts/lib/e2eRisk.test.ts (validateE2EScenarioRegistry -> findAppE2ESpecFiles: NON-recursive readdirSync of tests/e2e/*.spec.ts direct children only, confirmed by direct read; the "passes for the current registry and standalone exception list" test exercises this real scan with no override)', () => {
    it('selects the scan owner for a root-level app e2e spec', () => {
      const plan = resolveUnitPlan([modified('tests/e2e/appSmoke.spec.ts')]);

      expect(plan.relatedInputs).toContain('scripts/lib/e2eRisk.test.ts');
    });

    it.each([
      ['tests/e2e/storybook/colorOwnership.spec.ts'],
      ['tests/e2e/visual/shared-ui/md-button.spec.ts'],
      ['tests/e2e/release/productionArtifactSmoke.spec.ts'],
    ])(
      "Must reject: does not select the scan owner for a nested spec one directory level deeper, outside this non-recursive scan's population: %s",
      (specPath) => {
        const plan = resolveUnitPlan([modified(specPath)]);

        expect(plan.relatedInputs).not.toContain('scripts/lib/e2eRisk.test.ts');
      },
    );

    it('selects the scan owner for a DELETED root-level app e2e spec (note: scripts/lib/e2eProjectApplicability.test.ts shares this exact root-level scan population, so it is also selected -- see the exact combined assertion in that describe block below; this test only asserts what belongs to e2eRisk.test.ts)', () => {
      const plan = resolveUnitPlan([deleted('tests/e2e/appSmoke.spec.ts')]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toContain('scripts/lib/e2eRisk.test.ts');
    });
  });

  describe('scripts/lib/e2eProjectApplicability.test.ts (validateE2EProjectApplicability -> findRootAppE2ESpecFiles: same NON-recursive tests/e2e/*.spec.ts root-only scan shape as e2eRisk.test.ts, confirmed by direct read; the "passes for the current registry" test exercises this real scan with no override)', () => {
    it('selects the scan owner for a root-level app e2e spec', () => {
      const plan = resolveUnitPlan([modified('tests/e2e/appSmoke.spec.ts')]);

      expect(plan.relatedInputs).toContain('scripts/lib/e2eProjectApplicability.test.ts');
    });

    it.each([
      ['tests/e2e/storybook/colorOwnership.spec.ts'],
      ['tests/e2e/visual/shared-ui/md-button.spec.ts'],
      ['tests/e2e/release/productionArtifactSmoke.spec.ts'],
    ])(
      'Must reject: does not select the scan owner for a nested spec one directory level deeper: %s',
      (specPath) => {
        const plan = resolveUnitPlan([modified(specPath)]);

        expect(plan.relatedInputs).not.toContain('scripts/lib/e2eProjectApplicability.test.ts');
      },
    );

    it('selects the scan owner for a DELETED root-level app e2e spec, in addition to playwright.lanes.test.ts and scripts/lib/e2eRisk.test.ts', () => {
      const plan = resolveUnitPlan([deleted('tests/e2e/appSmoke.spec.ts')]);

      expect(plan.mode).toBe('focused');
      expect(plan.relatedInputs).toEqual([
        'playwright.lanes.test.ts',
        'scripts/lib/e2eProjectApplicability.test.ts',
        'scripts/lib/e2eRisk.test.ts',
      ]);
    });
  });

  describe('scripts/lib/storybookBehaviorRisk.test.ts (validateStorybookBehaviorScenarioRegistry -> findStorybookBehaviorSpecFiles(\'tests/e2e/storybook\'), recursive, exercised with no override by "passes for the current registry and standalone exception list"; PLUS findColocatedBrowserSpecFiles(), recursive src/**/*.browser.spec.ts, exercised with no override by "discovers the real colocated Loading Indicator browser spec under src/")', () => {
    it('selects the scan owner for a nested legacy central behavior spec', () => {
      const plan = resolveUnitPlan([modified('tests/e2e/storybook/colorOwnership.spec.ts')]);

      expect(plan.relatedInputs).toContain('scripts/lib/storybookBehaviorRisk.test.ts');
    });

    it('selects the scan owner for a colocated *.browser.spec.ts, in addition to playwright.lanes.test.ts', () => {
      const plan = resolveUnitPlan([
        modified('src/shared/ui/material/components/button/MDButton.browser.spec.ts'),
      ]);

      expect(plan.relatedInputs).toContain('scripts/lib/storybookBehaviorRisk.test.ts');
      expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
    });

    it.each([
      ['tests/e2e/visual/shared-ui/md-button.spec.ts'],
      ['tests/e2e/release/productionArtifactSmoke.spec.ts'],
      ['tests/e2e/appSmoke.spec.ts'],
    ])(
      'Must reject: does not select the scan owner for a spec outside both scanned populations: %s',
      (specPath) => {
        const plan = resolveUnitPlan([modified(specPath)]);

        expect(plan.relatedInputs).not.toContain('scripts/lib/storybookBehaviorRisk.test.ts');
      },
    );
  });

  describe('scripts/lib/visualRisk.test.ts (findColocatedVisualSpecFiles(), recursive src/**/*.visual.spec.ts, exercised with no override by "discovers the real colocated Loading Indicator visual spec under src/"; confirmed by full read of visualRisk.ts that there is NO additional recursive scan of the legacy tests/e2e/visual/** tree -- that subtree is handled only via the isLegacyVisualPath/FULL_LANE_PREFIXES full-lane-fallback prefix check, not a registry-coverage scan)', () => {
    it('selects the scan owner for a colocated *.visual.spec.ts', () => {
      const plan = resolveUnitPlan([
        modified('src/shared/ui/material/components/button/MDButton.visual.spec.ts'),
      ]);

      expect(plan.relatedInputs).toContain('scripts/lib/visualRisk.test.ts');
    });

    it('Must reject: does not select the scan owner for the legacy central visual spec location (no scan of that subtree; only reachable via playwright.lanes.test.ts)', () => {
      const plan = resolveUnitPlan([modified('tests/e2e/visual/shared-ui/md-button.spec.ts')]);

      expect(plan.relatedInputs).not.toContain('scripts/lib/visualRisk.test.ts');
    });
  });
});

describe('resolveUnitPlan direct test self-selection', () => {
  it('selects an added test file that currently exists on disk, additive to the bounded-scan owner that also observes it (B2 correction: src/shared/ui/material/rendererBoundary.test.ts\'s scan has no ".test." exclusion and this path is outside src/shared/ui/material/**, so it falls inside that scan\'s population too -- see "resolveUnitPlan bounded repository-scan ownership (mechanism 5)" above)', () => {
    const plan = resolveUnitPlan([added('src/entities/foo/foo.test.ts')], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/entities/foo/foo.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it('selects a modified scripts/**/*.test.mjs file that currently exists on disk', () => {
    const plan = resolveUnitPlan([modified('scripts/release/foo.test.mjs')], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/release/foo.test.mjs']);
  });

  it('selects a modified tests/e2e/**/*.test.mjs fixture-logic test', () => {
    const plan = resolveUnitPlan([modified('tests/e2e/lib/foo.test.mjs')], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['tests/e2e/lib/foo.test.mjs']);
  });

  it('selects a modified eslint.config.test.ts', () => {
    const plan = resolveUnitPlan([modified('eslint.config.test.ts')], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['eslint.config.test.ts']);
  });

  it('selects a modified root playwright.<name>.test.ts', () => {
    const plan = resolveUnitPlan([modified('playwright.lanes.test.ts')], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['playwright.lanes.test.ts']);
  });
});

describe('resolveUnitPlan ordinary source pass-through', () => {
  it('resolves config/tooling.json alone to focused with itself in relatedInputs (already covered elsewhere by Vitest related, no mapping needed)', () => {
    const plan = resolveUnitPlan([modified('config/tooling.json')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['config/tooling.json']);
  });

  it('resolves an added src/** source file to focused with itself in relatedInputs, additive to the two bounded-scan owners that also observe it (B2 correction: src/readRecoveryImportBoundary.test.ts scans every non-test src/**/*.ts, and src/shared/ui/material/rendererBoundary.test.ts scans every src/**/*.ts outside src/shared/ui/material/** -- both match this path; see "resolveUnitPlan bounded repository-scan ownership (mechanism 5)" above)', () => {
    const plan = resolveUnitPlan([added('src/entities/foo/foo.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/entities/foo/foo.ts',
      'src/readRecoveryImportBoundary.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it('resolves a modified scripts/** support module (.mjs) to focused with itself', () => {
    const plan = resolveUnitPlan([modified('scripts/lib/someHelper.mjs')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/lib/someHelper.mjs']);
  });

  it('resolves a modified .vue component to focused with itself, additive to the two bounded-scan owners that also observe it (B2 correction: same two scans as the src/entities/foo/foo.ts case above -- this path is outside both src/features/ and src/shared/ui/material/**)', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/MDButton/MDButton.vue')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/readRecoveryImportBoundary.test.ts',
      'src/shared/ui/MDButton/MDButton.vue',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });

  it('resolves a modified .js source file to focused with itself', () => {
    const plan = resolveUnitPlan([modified('scripts/legacy/tool.js')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/legacy/tool.js']);
  });
});

describe('resolveUnitPlan Playwright/browser/visual spec ownership (B2 correction: a Playwright spec path is still NEVER an ordinary Vitest input -- never self-selected, never forces full unit merely by being Playwright-shaped -- but is no longer invisible to unit planning once bounded-scan ownership (mechanism 5) is implemented: every path shape below now falls inside at least playwright.lanes.test.ts\'s scanned population, so mode changes from the original "skip" to "focused" via scan-owner selection. This directly supersedes the four "does not select"/"does not force full" assertions that previously expected skip for these exact inputs -- see the "resolveUnitPlan bounded repository-scan ownership (mechanism 5)" describe block above for the full per-owner breakdown', () => {
  it('never adds a colocated *.browser.spec.ts change to relatedInputs itself, though it does select the scan owner(s) that observe it', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Foo/Foo.browser.spec.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
    expect(plan.relatedInputs).not.toContain('src/shared/ui/Foo/Foo.browser.spec.ts');
  });

  it('never adds a colocated *.visual.spec.ts change to relatedInputs itself, though it does select the scan owner(s) that observe it', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Foo/Foo.visual.spec.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
    expect(plan.relatedInputs).not.toContain('src/shared/ui/Foo/Foo.visual.spec.ts');
  });

  it('never adds a tests/e2e/**/*.spec.ts Playwright spec to relatedInputs itself, though it does select the scan owner(s) that observe it', () => {
    const plan = resolveUnitPlan([modified('tests/e2e/appSmoke.spec.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
    expect(plan.relatedInputs).not.toContain('tests/e2e/appSmoke.spec.ts');
  });

  it('does not force FULL unit for a deleted *.browser.spec.ts (never Vitest-owned by shape), but does select the scan owner(s) via mechanism 5', () => {
    const plan = resolveUnitPlan([deleted('src/shared/ui/Foo/Foo.browser.spec.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
    expect(plan.relatedInputs).not.toContain('src/shared/ui/Foo/Foo.browser.spec.ts');
  });

  it('does not force FULL unit for a deleted tests/e2e/**/*.spec.ts Playwright spec, but does select the scan owner(s) via mechanism 5', () => {
    const plan = resolveUnitPlan([deleted('tests/e2e/appSmoke.spec.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toContain('playwright.lanes.test.ts');
    expect(plan.relatedInputs).not.toContain('tests/e2e/appSmoke.spec.ts');
  });
});

describe('resolveUnitPlan skip when nothing unit-relevant changed', () => {
  it('skips for a repository testing doc change alone', () => {
    const plan = resolveUnitPlan([modified('docs/testing/architecture.md')]);

    expect(plan.mode).toBe('skip');
  });

  it('skips for AGENTS.md alone', () => {
    const plan = resolveUnitPlan([modified('AGENTS.md')]);

    expect(plan.mode).toBe('skip');
  });

  it('skips for an unmapped .github/workflows/*.yml change with no registry entry', () => {
    const plan = resolveUnitPlan([modified('.github/workflows/ci.yml')]);

    expect(plan.mode).toBe('skip');
  });

  it('skips for an empty changed-path list', () => {
    expect(resolveUnitPlan([]).mode).toBe('skip');
  });
});

describe('resolveUnitPlan composition and non-erasure', () => {
  it('full dominates focused within the same changeset', () => {
    const plan = resolveUnitPlan([modified('vitest.config.ts'), modified('PRIVACY.md')]);

    expect(plan.mode).toBe('full');
  });

  it('an irrelevant metadata path does not erase a focused mapping result', () => {
    const plan = resolveUnitPlan([modified('PRIVACY.md'), modified('AGENTS.md')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts',
    ]);
  });

  it('an irrelevant metadata path does not erase a full-unit infrastructure result', () => {
    const plan = resolveUnitPlan([modified('vitest.config.ts'), modified('AGENTS.md')]);

    expect(plan.mode).toBe('full');
  });

  it('invalid registry dominates an otherwise full-triggering changeset', () => {
    const plan = resolveUnitPlan([modified('vitest.config.ts')], {
      fileAsDataMappings: [{ source: 'PRIVACY.md', tests: [] }],
    });

    expect(plan.mode).toBe('invalid');
  });

  it('merges relatedInputs across two independently focused-relevant paths, deduplicated and sorted (B2 correction: src/entities/foo/foo.ts additionally pulls in its two bounded-scan owners -- see "resolveUnitPlan bounded repository-scan ownership (mechanism 5)" above)', () => {
    const plan = resolveUnitPlan([added('src/entities/foo/foo.ts'), added('config/tooling.json')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'config/tooling.json',
      'src/entities/foo/foo.ts',
      'src/readRecoveryImportBoundary.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
    ]);
  });
});
