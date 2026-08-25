import { describe, expect, it } from 'vitest';
import {
  getSnapshotOwningTestPath,
  isUnitGlobalInfraPath,
  isUnitSourceOrSupportPath,
  isUnitTestPath,
  resolveUnitPlan,
  type UnitPlan,
} from './unitRisk.ts';

describe('isUnitTestPath', () => {
  it('accepts a src/ *.test.ts path', () => {
    expect(isUnitTestPath('src/shared/lib/cache/index.test.ts')).toBe(true);
  });

  it('accepts a scripts/ *.test.mjs path', () => {
    expect(isUnitTestPath('scripts/agentEnvironment.test.mjs')).toBe(true);
  });

  it('rejects an ordinary source path', () => {
    expect(isUnitTestPath('src/shared/lib/cache/index.ts')).toBe(false);
  });

  it('rejects a Playwright *.spec.ts path even under src/', () => {
    expect(
      isUnitTestPath('src/shared/ui/material/components/loadingIndicator/x.visual.spec.ts'),
    ).toBe(false);
  });
});

describe('isUnitSourceOrSupportPath', () => {
  it('accepts ordinary src/ .ts and .vue files', () => {
    expect(isUnitSourceOrSupportPath('src/shared/lib/cache/index.ts')).toBe(true);
    expect(isUnitSourceOrSupportPath('src/shared/ui/State/State.vue')).toBe(true);
  });

  it('excludes every Playwright *.spec.ts suffix regardless of directory', () => {
    expect(isUnitSourceOrSupportPath('src/shared/ui/State/State.behavior.spec.ts')).toBe(false);
    expect(isUnitSourceOrSupportPath('src/shared/ui/State/State.visual.spec.ts')).toBe(false);
    expect(isUnitSourceOrSupportPath('tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts')).toBe(false);
  });

  it('excludes paths outside recognized Vitest roots', () => {
    expect(isUnitSourceOrSupportPath('docs/testing/architecture.md')).toBe(false);
    expect(isUnitSourceOrSupportPath('.github/workflows/verify.yml')).toBe(false);
  });

  it('accepts scripts/ and config/ support files', () => {
    expect(isUnitSourceOrSupportPath('scripts/lib/commandLock.ts')).toBe(true);
    expect(isUnitSourceOrSupportPath('config/alias.ts')).toBe(true);
  });
});

describe('isUnitGlobalInfraPath', () => {
  it('accepts the registered global infra paths', () => {
    expect(isUnitGlobalInfraPath('vitest.config.ts')).toBe(true);
    expect(isUnitGlobalInfraPath('src/setupVitest.ts')).toBe(true);
    expect(isUnitGlobalInfraPath('package.json')).toBe(true);
    expect(isUnitGlobalInfraPath('pnpm-lock.yaml')).toBe(true);
  });

  it('rejects an ordinary source path', () => {
    expect(isUnitGlobalInfraPath('src/shared/lib/cache/index.ts')).toBe(false);
  });
});

describe('getSnapshotOwningTestPath', () => {
  it('resolves a standard Vitest snapshot path to its owning test', () => {
    expect(getSnapshotOwningTestPath('src/foo/__snapshots__/bar.test.ts.snap')).toBe(
      'src/foo/bar.test.ts',
    );
  });

  it('returns null for a non-snapshot path', () => {
    expect(getSnapshotOwningTestPath('src/foo/bar.test.ts')).toBeNull();
  });

  it('returns null for a malformed snapshot path', () => {
    expect(getSnapshotOwningTestPath('src/foo/__snapshots__/bar.snap')).toBeNull();
  });
});

describe('resolveUnitPlan', () => {
  it('returns skip when the invocation has no changed-path scope (full mode)', () => {
    expect(resolveUnitPlan(null)).toEqual<UnitPlan>({
      mode: 'skip',
      reasons: ['no changed-path scope resolved for this invocation'],
    });
  });

  describe('git-diff scope', () => {
    it('produces the changed strategy for a unit-relevant modified path', () => {
      const plan = resolveUnitPlan(
        {
          kind: 'git-diff',
          changedPaths: [{ status: 'modified', path: 'src/shared/lib/cache/index.ts' }],
        },
        { packageJsonOldRef: 'origin/develop' },
      );

      expect(plan.mode).toBe('focused');
      expect(plan).toMatchObject({ strategy: 'changed', baseRef: 'origin/develop' });
    });

    it('skips for a deterministically unit-irrelevant scope', () => {
      const plan = resolveUnitPlan(
        { kind: 'git-diff', changedPaths: [{ status: 'modified', path: 'docs/foo.md' }] },
        { packageJsonOldRef: 'origin/develop' },
      );

      expect(plan.mode).toBe('skip');
    });

    it('widens to full unit for a deleted unit-relevant source', () => {
      const plan = resolveUnitPlan(
        {
          kind: 'git-diff',
          changedPaths: [{ status: 'deleted', path: 'src/shared/lib/cache/index.ts' }],
        },
        { packageJsonOldRef: 'origin/develop' },
      );

      expect(plan.mode).toBe('full');
    });

    it('widens to full unit for a renamed unit-relevant source', () => {
      const plan = resolveUnitPlan(
        {
          kind: 'git-diff',
          changedPaths: [
            {
              status: 'renamed',
              oldPath: 'src/shared/lib/cache/index.ts',
              newPath: 'src/shared/lib/cache/store.ts',
            },
          ],
        },
        { packageJsonOldRef: 'origin/develop' },
      );

      expect(plan.mode).toBe('full');
    });

    it('widens to full unit for a unit-global infrastructure change', () => {
      const plan = resolveUnitPlan(
        { kind: 'git-diff', changedPaths: [{ status: 'modified', path: 'vitest.config.ts' }] },
        { packageJsonOldRef: 'origin/develop' },
      );

      expect(plan.mode).toBe('full');
    });

    it('widens to full unit when no resolved diff base is available for a relevant scope', () => {
      const plan = resolveUnitPlan(
        {
          kind: 'git-diff',
          changedPaths: [{ status: 'modified', path: 'src/shared/lib/cache/index.ts' }],
        },
        { packageJsonOldRef: null },
      );

      expect(plan.mode).toBe('full');
    });

    it('a deleted deterministically irrelevant path does not force full unit', () => {
      const plan = resolveUnitPlan(
        { kind: 'git-diff', changedPaths: [{ status: 'deleted', path: 'docs/foo.md' }] },
        { packageJsonOldRef: 'origin/develop' },
      );

      expect(plan.mode).toBe('skip');
    });
  });

  describe('explicit-files scope', () => {
    it('selects a direct existing unit test', () => {
      const plan = resolveUnitPlan(
        { kind: 'explicit-files', files: ['src/shared/lib/cache/index.test.ts'] },
        { fileExists: (filePath) => filePath === 'src/shared/lib/cache/index.test.ts' },
      );

      expect(plan).toEqual<UnitPlan>({
        mode: 'focused',
        strategy: 'explicit',
        directTests: ['src/shared/lib/cache/index.test.ts'],
        relatedPaths: [],
        reasons: ['direct unit test src/shared/lib/cache/index.test.ts'],
      });
    });

    it('routes an existing non-test source/support path to vitest related', () => {
      const plan = resolveUnitPlan(
        { kind: 'explicit-files', files: ['src/shared/lib/cache/index.ts'] },
        { fileExists: (filePath) => filePath === 'src/shared/lib/cache/index.ts' },
      );

      expect(plan).toEqual<UnitPlan>({
        mode: 'focused',
        strategy: 'explicit',
        directTests: [],
        relatedPaths: ['src/shared/lib/cache/index.ts'],
        reasons: ['related unit source/support src/shared/lib/cache/index.ts'],
      });
    });

    it('preserves both a direct test and a related source without widening to full unit', () => {
      const plan = resolveUnitPlan(
        {
          kind: 'explicit-files',
          files: ['src/shared/lib/cache/index.test.ts', 'src/shared/lib/cache/index.ts'],
        },
        { fileExists: () => true },
      );

      expect(plan).toEqual<UnitPlan>({
        mode: 'focused',
        strategy: 'explicit',
        directTests: ['src/shared/lib/cache/index.test.ts'],
        relatedPaths: ['src/shared/lib/cache/index.ts'],
        reasons: [
          'direct unit test src/shared/lib/cache/index.test.ts',
          'related unit source/support src/shared/lib/cache/index.ts',
        ],
      });
    });

    it('resolves a standard snapshot path to its owning test as a direct test', () => {
      const plan = resolveUnitPlan(
        { kind: 'explicit-files', files: ['src/foo/__snapshots__/bar.test.ts.snap'] },
        { fileExists: () => true },
      );

      expect(plan).toEqual<UnitPlan>({
        mode: 'focused',
        strategy: 'explicit',
        directTests: ['src/foo/bar.test.ts'],
        relatedPaths: [],
        reasons: [
          'snapshot ownership src/foo/__snapshots__/bar.test.ts.snap -> src/foo/bar.test.ts',
        ],
      });
    });

    it('skips for deterministically unit-irrelevant explicit paths', () => {
      const plan = resolveUnitPlan(
        { kind: 'explicit-files', files: ['docs/testing/architecture.md'] },
        { fileExists: () => true },
      );

      expect(plan.mode).toBe('skip');
    });

    it('widens to full unit for a removed/moved unit-relevant explicit path', () => {
      const plan = resolveUnitPlan(
        { kind: 'explicit-files', files: ['src/shared/lib/cache/removed.ts'] },
        { fileExists: () => false },
      );

      expect(plan.mode).toBe('full');
    });

    it('widens to full unit for a removed explicit unit test path', () => {
      const plan = resolveUnitPlan(
        { kind: 'explicit-files', files: ['src/shared/lib/cache/index.test.ts'] },
        { fileExists: () => false },
      );

      expect(plan.mode).toBe('full');
    });

    it('widens to full unit for an explicit unit-global infrastructure path', () => {
      const plan = resolveUnitPlan(
        { kind: 'explicit-files', files: ['package.json'] },
        { fileExists: () => true },
      );

      expect(plan.mode).toBe('full');
    });
  });
});
