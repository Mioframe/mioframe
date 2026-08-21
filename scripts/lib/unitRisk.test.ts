import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import { UNIT_FILE_AS_DATA_MAPPINGS, resolveUnitPlan } from './unitRisk.ts';
import type { ChangedPath } from './changedPaths.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

// Oracle: docs/testing/verify-target-architecture.md "Unit impact architecture"
// (Goal through "Unit acceptance") plus the task's verified experimental facts
// (`vitest related` behavior for PRIVACY.md / config/tooling.json /
// .github/workflows/verify.yml) and the bounded readFileSync audit of
// scripts/release/*Workflow.test.mjs. resolveUnitPlan does not exist yet;
// this whole suite is expected to fail at import time (valid new-API red).

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
  it('exposes exactly the four confirmed seed mappings', () => {
    expect(UNIT_FILE_AS_DATA_MAPPINGS.map((mapping) => mapping.source).sort()).toEqual([
      '.github/workflows/deploy-branch.yml',
      '.github/workflows/release.yml',
      '.github/workflows/verify.yml',
      'PRIVACY.md',
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

  it('selects all three workflow test owners for .github/workflows/verify.yml', () => {
    const plan = resolveUnitPlan([modified('.github/workflows/verify.yml')]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
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

  it('dedupes the shared workflow test owners when release.yml and verify.yml change together', () => {
    const plan = resolveUnitPlan([
      modified('.github/workflows/release.yml'),
      modified('.github/workflows/verify.yml'),
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.relatedInputs).toEqual([
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
      'scripts/release/materializePrVersionWorkflow.test.mjs',
    ]);
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
