import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/packageJsonImpact.mjs', () => ({
  isVisualRelevantPackageJsonChange: vi.fn(),
}));

import { isVisualRelevantPackageJsonChange } from './lib/packageJsonImpact.mjs';
import {
  buildCommands,
  getActionRequired,
  getCliFilesOverride,
  getAllSiblingTestFiles,
  getExtraEnvForEntry,
  getVerifyBaseRef,
  printSummary,
  runVerifyCli,
} from './verify.mjs';

describe('getAllSiblingTestFiles', () => {
  it('maps scripts production .mjs files to sibling .test.mjs', () => {
    const result = getAllSiblingTestFiles('scripts/lib/commandLock.mjs');

    expect(result).toContain('scripts/lib/commandLock.test.mjs');
  });

  it('returns already-test scripts .test.mjs files', () => {
    const result = getAllSiblingTestFiles('scripts/lib/commandLock.test.mjs');

    expect(result).toEqual(['scripts/lib/commandLock.test.mjs']);
  });

  it('still discovers src/ sibling tests', () => {
    const result = getAllSiblingTestFiles('src/shared/lib/cache/index.ts');

    expect(result).toContain('src/shared/lib/cache/index.test.ts');
  });

  it('returns empty for non-src non-scripts files', () => {
    const result = getAllSiblingTestFiles('config/tooling.json');

    expect(result).toEqual([]);
  });
});

describe('getCliFilesOverride', () => {
  it('rejects bare --files with no paths', () => {
    expect(() => getCliFilesOverride(['--files'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  });

  it('rejects --only with an empty --files list', () => {
    expect(() => getCliFilesOverride(['--only', 'eslint', '--files'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  });

  it('rejects empty comma-delimited --files values', () => {
    expect(() => getCliFilesOverride(['--files=,'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
    expect(() => getCliFilesOverride(['--files= , '])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  });

  it('keeps explicit file lists working', () => {
    expect(getCliFilesOverride(['--only', 'eslint', '--files', 'scripts/verify.mjs'])).toEqual([
      'scripts/verify.mjs',
    ]);
  });

  it('keeps comma-delimited file lists working', () => {
    expect(
      getCliFilesOverride(['--files=scripts/verify.mjs,scripts/playwrightContainer.mjs']),
    ).toEqual(['scripts/playwrightContainer.mjs', 'scripts/verify.mjs']);
  });
});

describe('getVerifyBaseRef', () => {
  it('reads VERIFY_BASE from process env', () => {
    expect(getVerifyBaseRef({ VERIFY_BASE: 'origin/develop' })).toBe('origin/develop');
  });
});

describe('buildCommands full mode', () => {
  it('never skips a check for empty changed-file scope in full mode', () => {
    const commands = buildCommands([], { fullMode: true });
    const runByLabel = Object.fromEntries(commands.map((entry) => [entry.label, entry.kind]));

    expect(runByLabel.format).toBe('run');
    expect(runByLabel.oxlint).toBe('run');
    expect(runByLabel.eslint).toBe('run');
    expect(runByLabel['type-check']).toBe('run');
    expect(runByLabel['unit-tests']).toBe('run');
    expect(runByLabel.e2e).toBe('run');
    expect(runByLabel.visual).toBe('run');
  });

  it('does not run mutation testing in full/release mode', () => {
    const commands = buildCommands([], { fullMode: true });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('mutation');
  });

  it('targets the whole project instead of a changed-file list', () => {
    const commands = buildCommands([], { fullMode: true });
    const byLabel = Object.fromEntries(commands.map((entry) => [entry.label, entry]));

    expect(byLabel.format.args).toContain('.');
    expect(byLabel.format.args).not.toContain('src/app/main.ts');
    expect(byLabel.oxlint.args).toContain('.');
    expect(byLabel.eslint.args).toContain('.');
    expect(byLabel['unit-tests'].args).toEqual(['exec', 'vitest', 'run']);
  });

  it('adds the release-only checks with their own labels and commands', () => {
    const commands = buildCommands([], { fullMode: true });
    const byLabel = Object.fromEntries(commands.map((entry) => [entry.label, entry]));

    expect(byLabel['release-version'].args).toEqual(['scripts/release/validateVersion.mjs']);
    expect(byLabel['release-config'].args).toEqual(['scripts/release/validateReleaseConfig.mjs']);
    expect(byLabel.build.args).toEqual(['scripts/release/buildArtifact.mjs']);
    expect(byLabel.artifact.args).toEqual([
      'e2e:release',
      '--label',
      'artifact',
      'tests/e2e/release/productionArtifactSmoke.spec.ts',
    ]);
    expect(byLabel['release-smoke'].args).toEqual([
      'e2e:release',
      '--label',
      'release-smoke',
      'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts',
    ]);
  });

  it('does not add release-only checks outside full mode', () => {
    const commands = buildCommands([], { fullMode: false });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('release-version');
    expect(labels).not.toContain('release-config');
    expect(labels).not.toContain('build');
    expect(labels).not.toContain('artifact');
    expect(labels).not.toContain('release-smoke');
  });
});

describe('buildCommands mutation scope', () => {
  it('still adds a scoped mutation run outside full mode when mutation scope is non-empty', () => {
    const commands = buildCommands(['src/shared/lib/cache/index.ts'], { fullMode: false });
    const mutationEntry = commands.find((entry) => entry.label === 'mutation');

    expect(mutationEntry.kind).toBe('run');
    expect(mutationEntry.args).toEqual([
      'exec',
      'stryker',
      'run',
      '-m',
      'src/shared/lib/cache/index.ts',
    ]);
  });

  it('skips mutation outside full mode when mutation scope is empty', () => {
    const commands = buildCommands([], { fullMode: false });
    const mutationEntry = commands.find((entry) => entry.label === 'mutation');

    expect(mutationEntry.kind).toBe('skipped');
  });
});

describe('buildCommands package.json visual relevance', () => {
  beforeEach(() => {
    isVisualRelevantPackageJsonChange.mockReset();
  });

  it('skips visual when the package.json impact check confirms a version-only change', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(false);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    const visualEntry = commands.find((entry) => entry.label === 'visual');

    expect(visualEntry.kind).toBe('skipped');
    expect(isVisualRelevantPackageJsonChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs visual when the package.json impact check is not version-only', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(true);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    const visualEntry = commands.find((entry) => entry.label === 'visual');

    expect(visualEntry.kind).toBe('run');
  });

  it('does not consult the package.json impact check in full mode', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(false);

    const commands = buildCommands(['package.json'], { fullMode: true });
    const visualEntry = commands.find((entry) => entry.label === 'visual');

    expect(visualEntry.kind).toBe('run');
    expect(isVisualRelevantPackageJsonChange).not.toHaveBeenCalled();
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    buildCommands(['src/app/main.ts'], { fullMode: false });

    expect(isVisualRelevantPackageJsonChange).not.toHaveBeenCalled();
  });
});

describe('getExtraEnvForEntry', () => {
  it('does not set the skip flag for unrelated labels', () => {
    expect(getExtraEnvForEntry({ label: 'build' }, [{ label: 'build', status: 'passed' }])).toEqual(
      {},
    );
  });

  it('does not set the skip flag when build has not run yet', () => {
    expect(getExtraEnvForEntry({ label: 'artifact' }, [])).toEqual({});
  });

  it('does not set the skip flag when build failed', () => {
    expect(
      getExtraEnvForEntry({ label: 'artifact' }, [{ label: 'build', status: 'failed' }]),
    ).toEqual({});
  });

  it('sets RELEASE_ARTIFACT_SKIP_BUILD once build has passed, for artifact and release-smoke', () => {
    const priorResults = [{ label: 'build', status: 'passed' }];

    expect(getExtraEnvForEntry({ label: 'artifact' }, priorResults)).toEqual({
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
    });
    expect(getExtraEnvForEntry({ label: 'release-smoke' }, priorResults)).toEqual({
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
    });
  });
});

// Vue runtime warnings fail the unit-tests command at the Vitest layer
// (src/setupVitest.ts guard makes vitest exit non-zero); verify only
// aggregates exit codes. These tests pin the summary contract for a failed
// unit-tests command.
describe('getActionRequired', () => {
  const failedUnitTestsResult = {
    label: 'unit-tests',
    command: 'pnpm exec vitest run src/foo.test.ts',
    displayCommand: 'pnpm exec vitest run src/foo.test.ts',
    status: 'failed',
    exitCode: 1,
    hasWarnings: false,
    warningSummary: '',
  };

  it('asks to fix failed unit-tests results', () => {
    const actions = getActionRequired([failedUnitTestsResult]);

    expect(actions).toContainEqual(expect.stringContaining('Fix failed unit-tests errors'));
    expect(actions).not.toContain('None.');
  });

  it('still reports None. when nothing failed or warned', () => {
    const actions = getActionRequired([
      {
        label: 'unit-tests',
        command: 'pnpm exec vitest run src/foo.test.ts',
        status: 'passed',
        exitCode: 0,
        hasWarnings: false,
        warningSummary: '',
      },
    ]);

    expect(actions).toEqual(['None.']);
  });

  it('reports failed unit-tests through the normal VERIFY RESULT summary', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const summary = printSummary([], 'local-changes', [failedUnitTestsResult]);

      expect(summary).toEqual({ status: 'failed', hasFailed: true });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');

      expect(output).toContain('VERIFY RESULT');
      expect(output).toContain('status: failed ❌');
      expect(output).toContain('Fix failed unit-tests errors');
    } finally {
      logSpy.mockRestore();
    }
  });
});

describe('runVerifyCli', () => {
  it('fails before running checks when verify lock acquisition is blocked', async () => {
    const runMain = vi.fn();

    await expect(
      runVerifyCli({
        runMain,
        withVerifyLock: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runMain).not.toHaveBeenCalled();
  });
});
