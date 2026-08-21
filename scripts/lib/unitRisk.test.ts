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
//   forbids as a mapping target regardless of what they find:
//   `src/readRecoveryImportBoundary.test.ts` (every non-test .ts/.vue under
//   src/), `src/features/fileSystemAccessImportBoundary.test.ts` (every
//   non-test .ts/.vue under src/features/),
//   `src/shared/ui/material/rendererBoundary.test.ts` (every .css/.vue/.ts/
//   .mts/.tsx under src/), and `src/shared/ui/material/foundation/
//   tokens.test.ts`'s `getComponentTokenSources()` helper (every
//   components/*/tokens.css under src/shared/ui/material/components) --
//   these are deliberately NOT mapped;
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
// - `.github/workflows/{verify,release,deploy-branch}.yml` -> the four
//   workflow-test owners (already seeded, confirmed still correct: verify.yml
//   additionally has the direct `scripts/ciAutofix.test.ts` reader, two
//   `fs.readFileSync(...'.github/workflows/verify.yml'...)` call sites
//   asserting on the autofix-commit step's exact content);
// - `PRIVACY.md` -> `src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts`
//   (already seeded);
// - `.gitignore` (root, outside src/config/scripts) ->
//   `scripts/agentEnvironment.test.mjs` ("repo test fixture sanity" describe,
//   resolves `../.gitignore` relative to the test file's own directory and
//   asserts its content -- a real fixed repository path, not a temp fixture);
// - `vite.config.ts` (root, outside src/config/scripts) ->
//   `config/viteConfigFixtureImport.test.ts` (direct readFileSync, a true
//   file-as-data relation the import graph cannot express regardless of any
//   prefix fix) AND `scripts/release/viteBuildDate.test.mjs` (a genuine
//   `import viteConfig from '../../vite.config.ts'` ES import -- this second
//   relation is ALSO real ordinary-source pass-through once
//   docs/testing/verify-unit-impact-correction.md decisions #2/#4 are
//   implemented: vite.config.ts is a plausible ordinary `.ts` module input
//   repository-wide, not only under src/config/scripts, so the corrected
//   resolveUnitPlan must additionally pass vite.config.ts itself through to
//   Vitest related, additive to both mapped owners -- see "selects both
//   direct root vite.config.ts readers plus vite.config.ts itself" below);
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
// - `src/shared/ui/material/components/button/tokens.css` (new case this
//   audit adds): `MDButton.vue` has a real `import './tokens.css';` (plain
//   JS side-effect import, confirmed by direct read, line 15), and
//   `MDButton.test.ts` has a real `import MDButton from './MDButton.vue'`
//   (line 5) -- a genuine two-hop import chain Vitest's related resolution
//   can trace, even though the test ALSO happens to readFileSync the same
//   CSS file directly for its own assertion. `.css` is already part of the
//   current unitRisk.ts's ORDINARY_SOURCE_EXTENSIONS (confirmed by direct
//   read), so this case already passes against the current unfixed
//   production module -- it is not part of the B1 defect and requires no
//   production change.
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
// restricted ordinary-source eligibility, CSS-mapping exclusivity); this
// suite is expected to show genuine assertion failures against the current
// unfixed production module, not an import-time failure. Do not weaken these
// assertions to make the current unfixed production module pass.

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
  it('exposes exactly the B1-corrected complete set of file-as-data mappings, no more and no less', () => {
    expect(UNIT_FILE_AS_DATA_MAPPINGS.map((mapping) => mapping.source).sort()).toEqual([
      '.github/workflows/deploy-branch.yml',
      '.github/workflows/release.yml',
      '.github/workflows/verify.yml',
      '.gitignore',
      'PRIVACY.md',
      'src/app/styles/base.css',
      'src/app/styles/styles.css',
      'src/shared/lib/md/index.css',
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

  it('selects all four confirmed workflow test owners for .github/workflows/verify.yml, including the direct ciAutofix.test.ts reader', () => {
    const plan = resolveUnitPlan([modified('.github/workflows/verify.yml')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/ciAutofix.test.ts',
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
      'scripts/release/materializePrVersionWorkflow.test.mjs',
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

  it('dedupes the shared workflow test owners when release.yml and verify.yml change together, still including ciAutofix.test.ts from verify.yml', () => {
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
    ]);
  });
});

describe('resolveUnitPlan file-as-data mapping selection (B1-corrected new relations)', () => {
  it('selects scripts/agentEnvironment.test.mjs for a .gitignore change (root file outside src/config/scripts; real fixed-path reader with no ES-import edge)', () => {
    const plan = resolveUnitPlan([modified('.gitignore')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/agentEnvironment.test.mjs']);
  });

  it('selects both direct root vite.config.ts readers plus vite.config.ts itself, since a root-level .ts file is repository-wide ordinary unit source in addition to any file-as-data mapping (verify-unit-impact-correction.md decisions #2/#4: ordinary pass-through is repository-wide and mappings are additive, never extension- or location-exclusive)', () => {
    const plan = resolveUnitPlan([modified('vite.config.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'config/viteConfigFixtureImport.test.ts',
      'scripts/release/viteBuildDate.test.mjs',
      'vite.config.ts',
    ]);
  });

  it('selects every confirmed direct reader of src/shared/lib/md/index.css, plus the CSS source itself as additive ordinary pass-through (mapped CSS must not suppress a real ordinary import consumer)', () => {
    const plan = resolveUnitPlan([modified('src/shared/lib/md/index.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'config/postcss.config.test.ts',
      'src/shared/lib/md/index.css',
      'src/shared/lib/md/index.test.ts',
      'src/shared/ui/material/foundation/tokens.test.ts',
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

  it('selects the direct reader of src/app/styles/styles.css, plus the CSS source itself as additive ordinary pass-through', () => {
    const plan = resolveUnitPlan([modified('src/app/styles/styles.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/app/styles/styles.css',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ]);
  });

  it('selects the direct reader of src/app/styles/base.css, plus the CSS source itself as additive ordinary pass-through', () => {
    const plan = resolveUnitPlan([modified('src/app/styles/base.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/app/styles/base.css',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ]);
  });

  it('selects the direct reader of src/shared/ui/Lists/listItemAnatomy.css (MDStateLayer.test.ts cross-file opacity-alias assertions), plus the CSS source itself as additive ordinary pass-through', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Lists/listItemAnatomy.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/shared/ui/Lists/listItemAnatomy.css',
      'src/shared/ui/State/MDStateLayer.test.ts',
    ]);
  });

  it('selects the direct reader of src/shared/ui/State/ripple.css (MDStateLayer.test.ts cross-file opacity-alias assertions), plus the CSS source itself as additive ordinary pass-through', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/State/ripple.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/shared/ui/State/MDStateLayer.test.ts',
      'src/shared/ui/State/ripple.css',
    ]);
  });

  it('selects both the file-as-data owner and the ordinary-source owner for src/shared/ui/Card/MDCard.vue (unlike the other two MDStateLayer.test.ts file-as-data sources, MDCard.vue is itself real .vue unit source with its own colocated MDCard.test.ts, reached only through ordinary related-input pass-through; the mapping must not suppress that real relation)', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Card/MDCard.vue')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'src/shared/ui/Card/MDCard.vue',
      'src/shared/ui/State/MDStateLayer.test.ts',
    ]);
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

  it('resolves button/tokens.css alone to focused with only itself in relatedInputs -- MDButton.vue has a real "import \'./tokens.css\';" edge and MDButton.test.ts imports MDButton.vue, so Vitest related resolution reaches the owner through ordinary related-input pass-through, not a mapping', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/material/components/button/tokens.css')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['src/shared/ui/material/components/button/tokens.css']);
  });
});

describe('resolveUnitPlan direct test self-selection', () => {
  it('selects an added test file that currently exists on disk', () => {
    const plan = resolveUnitPlan([added('src/entities/foo/foo.test.ts')], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['src/entities/foo/foo.test.ts']);
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

  it('resolves an added src/** source file to focused with itself in relatedInputs', () => {
    const plan = resolveUnitPlan([added('src/entities/foo/foo.ts')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['src/entities/foo/foo.ts']);
  });

  it('resolves a modified scripts/** support module (.mjs) to focused with itself', () => {
    const plan = resolveUnitPlan([modified('scripts/lib/someHelper.mjs')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/lib/someHelper.mjs']);
  });

  it('resolves a modified .vue component to focused with itself', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/MDButton/MDButton.vue')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['src/shared/ui/MDButton/MDButton.vue']);
  });

  it('resolves a modified .js source file to focused with itself', () => {
    const plan = resolveUnitPlan([modified('scripts/legacy/tool.js')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['scripts/legacy/tool.js']);
  });
});

describe('resolveUnitPlan Playwright/browser/visual spec exclusion', () => {
  it('does not select a colocated *.browser.spec.ts change', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Foo/Foo.browser.spec.ts')]);

    expect(plan.mode).toBe('skip');
  });

  it('does not select a colocated *.visual.spec.ts change', () => {
    const plan = resolveUnitPlan([modified('src/shared/ui/Foo/Foo.visual.spec.ts')]);

    expect(plan.mode).toBe('skip');
  });

  it('does not select a tests/e2e/**/*.spec.ts Playwright spec', () => {
    const plan = resolveUnitPlan([modified('tests/e2e/appSmoke.spec.ts')]);

    expect(plan.mode).toBe('skip');
  });

  it('does not force full unit for a deleted *.browser.spec.ts (never Vitest-owned by shape)', () => {
    const plan = resolveUnitPlan([deleted('src/shared/ui/Foo/Foo.browser.spec.ts')]);

    expect(plan.mode).toBe('skip');
  });

  it('does not force full unit for a deleted tests/e2e/**/*.spec.ts Playwright spec', () => {
    const plan = resolveUnitPlan([deleted('tests/e2e/appSmoke.spec.ts')]);

    expect(plan.mode).toBe('skip');
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

  it('merges relatedInputs across two independently focused-relevant paths, deduplicated and sorted', () => {
    const plan = resolveUnitPlan([added('src/entities/foo/foo.ts'), added('config/tooling.json')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual(['config/tooling.json', 'src/entities/foo/foo.ts']);
  });
});
