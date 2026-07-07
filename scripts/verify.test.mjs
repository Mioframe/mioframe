import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/packageJsonImpact.mjs', () => ({
  isVisualRelevantPackageJsonChange: vi.fn(),
}));

import { isVisualRelevantPackageJsonChange } from './lib/packageJsonImpact.mjs';
import {
  buildCommandEnv,
  buildCommands,
  getCiProfileRisk,
  getActionRequired,
  getBlockingLogIssue,
  getCliFilesOverride,
  getVerifyProcessEnv,
  getAllSiblingTestFiles,
  getExtraEnvForEntry,
  getVerifyBaseRef,
  printSummary,
  resolveCommandStatus,
  runVerifyCli,
} from './verify.mjs';
import { resolvePlaywrightContainerProfile, VERIFY_PROFILE_ENV } from './playwrightContainer.mjs';

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

describe('getVerifyProcessEnv', () => {
  it('applies an explicit verify profile override to the process env', () => {
    expect(getVerifyProcessEnv({ GITHUB_ACTIONS: 'false' }, 'github-actions')).toMatchObject({
      GITHUB_ACTIONS: 'false',
      [VERIFY_PROFILE_ENV]: 'github-actions',
    });
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
    expect(byLabel['unit-tests'].args).toEqual(['exec', 'vitest', 'run', '--reporter=verbose']);
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

describe('buildCommandEnv', () => {
  it('propagates a github-actions profile override into expensive child command env', () => {
    const childEnv = buildCommandEnv(
      {
        label: 'e2e',
        weight: 'expensive',
      },
      [],
      {
        expensiveLockEnv: { MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1' },
        verifyLockEnv: { MIOFRAME_VERIFY_LOCK_HELD: '1' },
        verifyProcessEnv: getVerifyProcessEnv({ GITHUB_ACTIONS: 'false' }, 'github-actions'),
      },
    );

    expect(childEnv[VERIFY_PROFILE_ENV]).toBe('github-actions');
    expect(childEnv.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBe('1');
    expect(resolvePlaywrightContainerProfile(childEnv).name).toBe('github-actions');
  });
});

// Blocking log signals are classified inside verify itself: a unit-tests run
// that exits with code 0 but emitted Vue runtime warnings must fail through
// the normal VERIFY RESULT flow. Generic Vite/Rollup/dependency warnings and
// other labels stay non-fatal.
describe('getBlockingLogIssue', () => {
  const vueWarnLog = [
    'stderr | src/shared/ui/Sheets/MDBottomSheetContainer.test.ts > renders',
    '[Vue warn]: Invalid watch source: 0',
    'Tests  12 passed (12)',
  ].join('\n');

  it('flags unit-tests logs with a line-start Vue runtime warning', () => {
    const issue = getBlockingLogIssue('unit-tests', vueWarnLog);

    expect(issue).toEqual({
      reason: 'Vue runtime warnings were emitted during unit tests',
      warningSummary: '[Vue warn]: Invalid watch source: 0',
    });
  });

  it('flags ANSI-colored Vue runtime warning lines', () => {
    const esc = String.fromCharCode(27);
    const coloredLog = `${esc}[33m[Vue warn]: Invalid watch source: 0${esc}[39m`;

    expect(getBlockingLogIssue('unit-tests', coloredLog)).not.toBeNull();
  });

  it('ignores the marker mid-line, e.g. in a verbose-reporter test name with [Vue warn]', () => {
    const log = [
      '  ✓ getBlockingLogIssue > ignores the marker mid-line with [Vue warn] in the name',
      'fixture text mentioning [Vue warn] mid-string',
    ].join('\n');

    expect(getBlockingLogIssue('unit-tests', log)).toBeNull();
  });

  it('ignores generic Vite/Rollup/dependency warnings', () => {
    const log = [
      "warning: 'foo' is deprecated",
      '(!) Some chunks are larger than 500 kB after minification.',
      "[vite] warning: Duplicate key 'a' in object literal",
      'npm WARN deprecated package@1.0.0',
    ].join('\n');

    expect(getBlockingLogIssue('unit-tests', log)).toBeNull();
  });

  it('only applies to the unit-tests label', () => {
    expect(getBlockingLogIssue('e2e', vueWarnLog)).toBeNull();
    expect(getBlockingLogIssue('type-check', vueWarnLog)).toBeNull();
  });
});

describe('resolveCommandStatus', () => {
  it('fails a zero-exit unit-tests command whose log has Vue runtime warnings', () => {
    const { status, blockingLogIssue } = resolveCommandStatus(
      'unit-tests',
      0,
      '[Vue warn]: Invalid watch source: 0',
    );

    expect(status).toBe('failed');
    expect(blockingLogIssue?.reason).toBe('Vue runtime warnings were emitted during unit tests');
  });

  it('passes a zero-exit unit-tests command with a clean log', () => {
    expect(resolveCommandStatus('unit-tests', 0, 'Tests  12 passed (12)')).toEqual({
      status: 'passed',
      blockingLogIssue: null,
    });
  });

  it('keeps non-zero exit codes failed', () => {
    expect(resolveCommandStatus('unit-tests', 1, 'Tests  1 failed (12)').status).toBe('failed');
  });
});

describe('getActionRequired', () => {
  const blockedUnitTestsResult = {
    label: 'unit-tests',
    command: 'pnpm exec vitest run --reporter=verbose src/foo.test.ts',
    displayCommand: 'pnpm exec vitest run --reporter=verbose src/foo.test.ts',
    status: 'failed',
    exitCode: 0,
    hasWarnings: false,
    warningSummary: '',
    blockingLogIssue: {
      reason: 'Vue runtime warnings were emitted during unit tests',
      warningSummary: '[Vue warn]: Invalid watch source: 0',
    },
  };

  it('asks to fix failed unit-tests results', () => {
    const actions = getActionRequired([
      { ...blockedUnitTestsResult, exitCode: 1, blockingLogIssue: null },
    ]);

    expect(actions).toContainEqual(expect.stringContaining('Fix failed unit-tests errors'));
    expect(actions).not.toContain('None.');
  });

  it('includes the blocking-signal reason and warning summary', () => {
    const actions = getActionRequired([blockedUnitTestsResult]);

    expect(actions).toContainEqual(expect.stringContaining('Fix failed unit-tests errors'));
    expect(actions).toContainEqual(
      expect.stringContaining('Vue runtime warnings were emitted during unit tests'),
    );
    expect(actions).toContainEqual(expect.stringContaining('[Vue warn]: Invalid watch source: 0'));
  });

  it('still reports None. when nothing failed or warned', () => {
    const actions = getActionRequired([
      {
        label: 'unit-tests',
        command: 'pnpm exec vitest run --reporter=verbose src/foo.test.ts',
        status: 'passed',
        exitCode: 0,
        hasWarnings: false,
        warningSummary: '',
        blockingLogIssue: null,
      },
    ]);

    expect(actions).toEqual(['None.']);
  });

  it('adds a CI-profile rerun action when local Playwright risk remains', () => {
    const actions = getActionRequired(
      [
        {
          label: 'e2e',
          command: 'pnpm e2e:container',
          status: 'passed',
          exitCode: 0,
          hasWarnings: false,
          warningSummary: '',
          blockingLogIssue: null,
        },
      ],
      {
        ciProfileRisk: {
          affectedChecks: ['e2e'],
          activeProfile: { name: 'local' },
        },
      },
    );

    expect(actions).toContainEqual(
      expect.stringContaining(
        'CI-profile risk remains for e2e because local Playwright used profile local.',
      ),
    );
    expect(actions).toContainEqual(
      expect.stringContaining('pnpm verify --profile github-actions --only e2e'),
    );
  });

  it('reports a zero-exit blocked unit-tests result through the normal VERIFY RESULT summary', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const summary = printSummary([], 'local-changes', [blockedUnitTestsResult]);

      expect(summary).toEqual({ status: 'failed', hasFailed: true, hasCiProfileRisk: false });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');

      expect(output).toContain('VERIFY RESULT');
      expect(output).toContain('status: failed ❌');
      expect(output).toContain('Fix failed unit-tests errors');
      expect(output).toContain('Vue runtime warnings were emitted during unit tests');
      expect(output).toContain('[Vue warn]: Invalid watch source: 0');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('reports CI-profile risk in the summary when local e2e passed under the local profile', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const summary = printSummary(
        ['scripts/verify.mjs'],
        'local-base origin/develop',
        [
          {
            label: 'e2e',
            command: 'pnpm e2e:container',
            displayCommand: 'pnpm e2e:container',
            status: 'passed',
            exitCode: 0,
            hasWarnings: false,
            warningSummary: '',
            triggerReason: 'low-level path scripts/verify.mjs -> full app e2e',
          },
          {
            label: 'e2e-install',
            status: 'skipped',
            reason: 'browser install is not required; Playwright container provides browsers',
          },
        ],
        {
          baseRef: 'origin/develop',
          processEnv: {
            GITHUB_ACTIONS: 'false',
          },
        },
      );

      expect(summary).toEqual({ status: 'passed', hasFailed: false, hasCiProfileRisk: true });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('profile: local (source: default-local)');
      expect(output).toContain('base ref: origin/develop');
      expect(output).toContain('status: passed with CI-profile risk');
      expect(output).toContain('heavy-check triggers:');
      expect(output).toContain('e2e: low-level path scripts/verify.mjs -> full app e2e');
      expect(output).toContain('ci profile risk:');
      expect(output).toContain('Affected checks: e2e');
      expect(output).toContain('workers: 1 -> 2');
    } finally {
      logSpy.mockRestore();
    }
  });
});

describe('getCiProfileRisk', () => {
  it('omits CI-profile risk when Playwright checks did not run', () => {
    expect(
      getCiProfileRisk([
        {
          label: 'type-check',
          status: 'passed',
        },
      ]),
    ).toBeNull();
  });

  it('omits CI-profile risk when the GitHub Actions profile is already active', () => {
    expect(
      getCiProfileRisk(
        [
          {
            label: 'visual',
            status: 'passed',
          },
        ],
        {
          GITHUB_ACTIONS: 'true',
        },
      ),
    ).toBeNull();
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
