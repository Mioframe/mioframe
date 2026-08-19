import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/packageJsonImpact.ts', () => ({
  isVisualRelevantPackageJsonChange: vi.fn(),
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import {
  isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport,
  isVisualRelevantPackageJsonChange as isVisualRelevantPackageJsonChangeImport,
} from './lib/packageJsonImpact.ts';
import { resolveVerifyInvocation } from './lib/verifyInvocation.ts';
import {
  buildCommandEnv,
  buildCommands,
  COMMAND_TIMEOUT_MS_BY_LABEL,
  getCiProfileRisk,
  getActionRequired,
  getBlockingLogIssue,
  getCliFilesOverride,
  getVerifyProcessEnv,
  getAllSiblingTestFiles,
  getExtraEnvForEntry,
  PLAYWRIGHT_COMMAND_OVERHEAD_MS,
  printSummary,
  resolveCommandStatus,
  resolvePlaywrightCommandTimeoutMs,
  resolveVerifyChangedPathContext,
  runVerifyCli,
  type CommandEntry,
  type ExecutedCommandResult,
  type RunCommandEntry,
  type SkippedCommandEntry,
  type SkippedCommandResult,
} from './verify.ts';
import {
  resolvePlaywrightContainerProfile,
  VERIFY_PROFILE_ENV,
  type PlaywrightContainerProfile,
} from './playwrightContainer.ts';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);
const isVisualRelevantPackageJsonChange = vi.mocked(isVisualRelevantPackageJsonChangeImport);

function requireRunEntry(commands: readonly CommandEntry[], label: string): RunCommandEntry {
  const entry = commands.find((item) => item.label === label);

  expect(entry?.kind).toBe('run');

  if (entry?.kind !== 'run') {
    throw new Error(`expected a "run" entry for label ${label}`);
  }

  return entry;
}

function requireSkippedEntry(
  commands: readonly CommandEntry[],
  label: string,
): SkippedCommandEntry {
  const entry = commands.find((item) => item.label === label);

  expect(entry?.kind).toBe('skipped');

  if (entry?.kind !== 'skipped') {
    throw new Error(`expected a "skipped" entry for label ${label}`);
  }

  return entry;
}

function makeExecutedResult(
  overrides: Partial<ExecutedCommandResult> & Pick<ExecutedCommandResult, 'label' | 'status'>,
): ExecutedCommandResult {
  return {
    command: 'pnpm exec vitest run',
    displayCommand: 'pnpm exec vitest run',
    logPath: '.verify/logs/test.log',
    exitCode: overrides.status === 'passed' ? 0 : 1,
    hasWarnings: false,
    warningSummary: '',
    blockingLogIssue: null,
    triggerReason: null,
    stdout: '',
    stderr: '',
    terminatedBySignal: null,
    signal: null,
    ...overrides,
  };
}

function makeSkippedResult(
  overrides: Partial<SkippedCommandResult> & Pick<SkippedCommandResult, 'label' | 'reason'>,
): SkippedCommandResult {
  return {
    command: 'pnpm test',
    status: 'skipped',
    exitCode: null,
    stdout: '',
    stderr: '',
    hasWarnings: false,
    warningSummary: '',
    blockingLogIssue: null,
    triggerReason: null,
    ...overrides,
  };
}

function makeProfile(
  overrides: Partial<PlaywrightContainerProfile> & Pick<PlaywrightContainerProfile, 'name'>,
): PlaywrightContainerProfile {
  return {
    source: 'test',
    cpus: '2',
    memory: '6g',
    memorySwap: '8g',
    pidsLimit: '512',
    timeoutSeconds: '900',
    workers: '1',
    ...overrides,
  };
}

describe('resolvePlaywrightCommandTimeoutMs', () => {
  it('derives the outer timeout from a given container timeout plus the fixed allowance', () => {
    expect(resolvePlaywrightCommandTimeoutMs('900')).toBe(
      900 * 1000 + PLAYWRIGHT_COMMAND_OVERHEAD_MS,
    );
  });

  it('is strictly greater than the container timeout by exactly the documented allowance', () => {
    const containerTimeoutMs = 900 * 1000;

    expect(resolvePlaywrightCommandTimeoutMs('900') - containerTimeoutMs).toBe(
      PLAYWRIGHT_COMMAND_OVERHEAD_MS,
    );
  });

  it('changes correspondingly when the input container timeout changes', () => {
    expect(resolvePlaywrightCommandTimeoutMs('600')).toBe(
      600 * 1000 + PLAYWRIGHT_COMMAND_OVERHEAD_MS,
    );
    expect(resolvePlaywrightCommandTimeoutMs('1200')).toBe(
      1200 * 1000 + PLAYWRIGHT_COMMAND_OVERHEAD_MS,
    );
  });

  it('defaults to config/tooling.json verification.playwrightContainer.timeoutSeconds', () => {
    expect(resolvePlaywrightCommandTimeoutMs()).toBe(
      Number(toolingConfig.verification.playwrightContainer.timeoutSeconds) * 1000 +
        PLAYWRIGHT_COMMAND_OVERHEAD_MS,
    );
  });

  it('rejects a non-numeric container timeout', () => {
    expect(() => resolvePlaywrightCommandTimeoutMs('not-a-number')).toThrow();
  });

  it('rejects a zero or negative container timeout', () => {
    expect(() => resolvePlaywrightCommandTimeoutMs('0')).toThrow();
    expect(() => resolvePlaywrightCommandTimeoutMs('-5')).toThrow();
  });
});

describe('COMMAND_TIMEOUT_MS_BY_LABEL', () => {
  const playwrightBackedLabels = ['e2e', 'storybook-behavior', 'visual', 'release-smoke'];
  const unrelatedLabelsWithFixedLimits = {
    'e2e-install': 10 * 60 * 1000,
    mutation: 20 * 60 * 1000,
    build: 10 * 60 * 1000,
    artifact: 8 * 60 * 1000,
    'storybook-build': 10 * 60 * 1000,
  };

  it('derives Playwright-backed lane timeouts from the canonical container timeout', () => {
    const expected = resolvePlaywrightCommandTimeoutMs();

    for (const label of playwrightBackedLabels) {
      expect(COMMAND_TIMEOUT_MS_BY_LABEL[label]).toBe(expected);
    }
  });

  it('keeps every Playwright-backed lane timeout strictly greater than the container timeout', () => {
    const containerTimeoutMs =
      Number(toolingConfig.verification.playwrightContainer.timeoutSeconds) * 1000;

    for (const label of playwrightBackedLabels) {
      expect(COMMAND_TIMEOUT_MS_BY_LABEL[label]).toBeGreaterThan(containerTimeoutMs);
    }
  });

  it('leaves unrelated command limits unchanged', () => {
    for (const [label, expectedMs] of Object.entries(unrelatedLabelsWithFixedLimits)) {
      expect(COMMAND_TIMEOUT_MS_BY_LABEL[label]).toBe(expectedMs);
    }
  });

  it('sizes the managed-updates aggregate timeout for exactly four sequential container sessions', () => {
    const singleSessionTimeoutMs = resolvePlaywrightCommandTimeoutMs();

    expect(COMMAND_TIMEOUT_MS_BY_LABEL['managed-updates']).toBe(4 * singleSessionTimeoutMs);
  });
});

describe('getAllSiblingTestFiles', () => {
  it('maps scripts production .mjs files to sibling .test.mjs', () => {
    const result = getAllSiblingTestFiles('scripts/agentEnvironment.mjs');

    expect(result).toContain('scripts/agentEnvironment.test.mjs');
  });

  it('maps scripts production .ts files to sibling .test.ts', () => {
    const result = getAllSiblingTestFiles('scripts/lib/commandLock.ts');

    expect(result).toContain('scripts/lib/commandLock.test.ts');
  });

  it('returns already-test scripts .test.mjs files', () => {
    const result = getAllSiblingTestFiles('scripts/agentEnvironment.test.mjs');

    expect(result).toEqual(['scripts/agentEnvironment.test.mjs']);
  });

  it('returns already-test scripts .test.ts files', () => {
    const result = getAllSiblingTestFiles('scripts/lib/commandLock.test.ts');

    expect(result).toEqual(['scripts/lib/commandLock.test.ts']);
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
    expect(getCliFilesOverride(['--only', 'eslint', '--files', 'scripts/verify.ts'])).toEqual([
      'scripts/verify.ts',
    ]);
  });

  it('keeps comma-delimited file lists working', () => {
    expect(
      getCliFilesOverride(['--files=scripts/verify.ts,scripts/playwrightContainer.ts']),
    ).toEqual(['scripts/playwrightContainer.ts', 'scripts/verify.ts']);
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
    expect(runByLabel['storybook-behavior']).toBe('run');
    expect(runByLabel.visual).toBe('run');
  });

  it('does not run mutation testing in full/release mode', () => {
    const commands = buildCommands([], { fullMode: true });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('mutation');
  });

  it('targets the whole project instead of a changed-file list', () => {
    const commands = buildCommands([], { fullMode: true });

    expect(requireRunEntry(commands, 'format').args).toContain('.');
    expect(requireRunEntry(commands, 'format').args).not.toContain('src/app/main.ts');
    expect(requireRunEntry(commands, 'oxlint').args).toContain('.');
    expect(requireRunEntry(commands, 'eslint').args).toContain('.');
    expect(requireRunEntry(commands, 'unit-tests').args).toEqual([
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
    ]);
  });

  it('adds the release-only checks with their own labels and commands', () => {
    const commands = buildCommands([], { fullMode: true });

    expect(requireRunEntry(commands, 'release-version').args).toEqual([
      'scripts/release/validateVersion.mjs',
    ]);
    expect(requireRunEntry(commands, 'release-config').args).toEqual([
      'scripts/release/validateReleaseConfig.mjs',
    ]);
    expect(requireRunEntry(commands, 'build').args).toEqual(['scripts/release/buildArtifact.mjs']);
    expect(requireRunEntry(commands, 'artifact').args).toEqual([
      'e2e:release',
      '--label',
      'artifact',
      'tests/e2e/release/productionArtifactSmoke.spec.ts',
    ]);
    expect(requireRunEntry(commands, 'release-smoke').args).toEqual([
      'e2e:release',
      '--label',
      'release-smoke',
      'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts',
    ]);
    expect(requireRunEntry(commands, 'managed-updates').command).toBe('node');
    expect(requireRunEntry(commands, 'managed-updates').args).toEqual([
      'scripts/release/managedUpdatesProof.mjs',
    ]);
  });

  it('runs the managed-updates label through the aggregate proof runner, not a direct eight-file Playwright command', () => {
    const commands = buildCommands([], { fullMode: true });
    const managedUpdates = requireRunEntry(commands, 'managed-updates');

    expect(managedUpdates.command).not.toBe('pnpm');
    expect(managedUpdates.args).not.toContain('e2e:release');
    expect(managedUpdates.args).not.toContain('tests/e2e/release/managedUpdatesLifecycle.spec.ts');
  });

  it('does not add release-only checks outside full mode', () => {
    const commands = buildCommands([], { fullMode: false });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('release-version');
    expect(labels).not.toContain('release-config');
    expect(labels).not.toContain('build');
    expect(labels).not.toContain('artifact');
    expect(labels).not.toContain('release-smoke');
    expect(labels).not.toContain('managed-updates');
  });
});

describe('buildCommands visual compatibility', () => {
  it('fails closed for a legacy invalid visual plan', () => {
    const commands = buildCommands([], {
      fullMode: false,
      visualPlan: {
        mode: 'invalid',
        specs: [],
        reasons: ['broken visual impact metadata'],
      },
    });

    expect(commands.find((entry) => entry.label === 'visual')).toEqual({
      kind: 'failed',
      label: 'visual',
      command: 'pnpm test:visual',
      reason: 'invalid visual impact plan: broken visual impact metadata',
    });
  });
});

describe('buildCommands e2e project applicability', () => {
  it('fails closed when the project applicability registry is invalid', () => {
    const commands = buildCommands([], {
      fullMode: false,
      projectApplicabilityValidation: {
        valid: false,
        errors: ['app e2e spec tests/e2e/newSpec.spec.ts has no project applicability entry'],
      },
    });

    expect(commands.find((entry) => entry.label === 'e2e')).toEqual({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason:
        'invalid app e2e scenario registry state: app e2e spec tests/e2e/newSpec.spec.ts has no project applicability entry',
    });
  });

  it('combines an invalid app e2e scenario registry and an invalid project applicability registry', () => {
    const commands = buildCommands([], {
      fullMode: false,
      appE2EPlan: { mode: 'invalid', specs: [], reasons: ['broken scenario registry'] },
      projectApplicabilityValidation: {
        valid: false,
        errors: ['broken applicability registry'],
      },
    });

    expect(commands.find((entry) => entry.label === 'e2e')).toEqual({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason:
        'invalid app e2e scenario registry state: broken scenario registry; broken applicability registry',
    });
  });

  it('runs e2e normally when the project applicability registry is valid', () => {
    const commands = buildCommands([], {
      fullMode: false,
      appE2EPlan: { mode: 'skip', specs: [], reasons: ['empty e2e scope'] },
      projectApplicabilityValidation: { valid: true, errors: [] },
    });

    expect(commands.find((entry) => entry.label === 'e2e')).toMatchObject({
      kind: 'skipped',
      label: 'e2e',
      reason: 'empty e2e scope',
    });
  });
});

describe('buildCommands type-check applicability', () => {
  it.each([
    'scripts/verify.ts',
    'scripts/verifyStatus.ts',
    'scripts/lib/e2eRisk.ts',
    'scripts/verify.test.ts',
    'scripts/lib/e2eRisk.test.ts',
  ])('runs type-check for directly executed verifier TypeScript: %s', (filePath) => {
    const commands = buildCommands([filePath], { fullMode: false });

    requireRunEntry(commands, 'type-check');
  });
});

describe('buildCommands mutation scope', () => {
  it('still adds a scoped mutation run outside full mode when mutation scope is non-empty', () => {
    const commands = buildCommands(['src/shared/lib/cache/index.ts'], { fullMode: false });
    const mutationEntry = requireRunEntry(commands, 'mutation');

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

    requireSkippedEntry(commands, 'mutation');
  });

  describe('deleted production path', () => {
    it('skips mutation instead of targeting a nonexistent production file', () => {
      const deletedProductionPath = 'src/shared/lib/verifyMutationScopeDeletedFixture.ts';

      expect(fs.existsSync(deletedProductionPath)).toBe(false);

      const commands = buildCommands([deletedProductionPath], { fullMode: false });
      requireSkippedEntry(commands, 'mutation');

      for (const entry of commands) {
        const args = entry.kind === 'run' ? entry.args : [];
        expect(JSON.stringify(args)).not.toContain(deletedProductionPath);
      }
    });
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
    requireSkippedEntry(commands, 'visual');
    expect(isVisualRelevantPackageJsonChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs visual when the package.json impact check is not version-only', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(true);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    requireRunEntry(commands, 'visual');
  });

  it('does not consult the package.json impact check in full mode', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(false);

    const commands = buildCommands(['package.json'], { fullMode: true });
    requireRunEntry(commands, 'visual');
    expect(isVisualRelevantPackageJsonChange).not.toHaveBeenCalled();
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    buildCommands(['src/app/main.ts'], { fullMode: false });

    expect(isVisualRelevantPackageJsonChange).not.toHaveBeenCalled();
  });
});

describe('buildCommands package.json app e2e relevance', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('skips app e2e for a confirmed version-only package.json change with no other e2e-relevant files', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    const e2eEntry = requireSkippedEntry(commands, 'e2e');

    expect(e2eEntry.reason).toBe('empty e2e scope');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs full app e2e when the package.json impact check is runtime-relevant', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    const e2eEntry = requireRunEntry(commands, 'e2e');

    expect(e2eEntry.triggerReason).toContain('runtime-relevant package.json change');
  });

  it('runs full app e2e when the package.json comparison cannot be resolved', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const commands = buildCommands(['package.json'], { fullMode: false, packageJsonOldRef: null });
    requireRunEntry(commands, 'e2e');

    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: null });
  });

  it('still runs full app e2e for other full-app-e2e-relevant files when package.json is version-only', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const commands = buildCommands(['package.json', 'src/shared/service/serviceWorker.ts'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    const e2eEntry = requireRunEntry(commands, 'e2e');

    expect(e2eEntry.triggerReason).toContain(
      'unmapped application-E2E-relevant path src/shared/service/serviceWorker.ts',
    );
  });
});

describe('buildCommands removed/renamed spec safety', () => {
  it('runs full app e2e for a deleted app e2e spec without passing it as a command argument', () => {
    const commands = buildCommands(['tests/e2e/removedFlow.spec.ts'], { fullMode: false });
    const e2eEntry = requireRunEntry(commands, 'e2e');

    expect(e2eEntry.triggerReason).toContain('removed or renamed app e2e spec');
    expect(e2eEntry.args).not.toContain('tests/e2e/removedFlow.spec.ts');
  });

  it('runs the full storybook-behavior lane for a deleted behavior spec without passing it as a command argument', () => {
    const commands = buildCommands(['tests/e2e/storybook/removedFlow.spec.ts'], {
      fullMode: false,
    });
    const behaviorEntry = requireRunEntry(commands, 'storybook-behavior');

    expect(behaviorEntry.triggerReason).toContain('removed or renamed Storybook behavior spec');
    expect(behaviorEntry.args).not.toContain('tests/e2e/storybook/removedFlow.spec.ts');
  });
});

describe('buildCommands storybook-behavior lane', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('runs after e2e and before visual', () => {
    const commands = buildCommands([], { fullMode: true });
    const labels = commands.map((entry) => entry.label);

    expect(labels.indexOf('e2e')).toBeLessThan(labels.indexOf('storybook-behavior'));
    expect(labels.indexOf('storybook-behavior')).toBeLessThan(labels.indexOf('visual'));
  });

  it('skips storybook-behavior for an empty scope', () => {
    const commands = buildCommands(['src/app/main.ts'], { fullMode: false });
    const entry = requireSkippedEntry(commands, 'storybook-behavior');

    expect(entry.reason).toBe('empty storybook behavior scope');
  });

  it('runs the full lane for a Storybook infrastructure change', () => {
    const commands = buildCommands(['playwright.storybook.config.ts'], { fullMode: false });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.args).toEqual(['test:storybook-behavior']);
    expect(entry.triggerReason).toContain('Storybook/Playwright infrastructure path');
  });

  it('runs the full lane for a .storybook/ path change', () => {
    const commands = buildCommands(['.storybook/main.ts'], { fullMode: false });
    requireRunEntry(commands, 'storybook-behavior');
  });

  it('runs a focused lane for a changed existing central behavior spec', () => {
    const commands = buildCommands(['tests/e2e/storybook/colorOwnership.spec.ts'], {
      fullMode: false,
    });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.args).toEqual([
      'test:storybook-behavior',
      'tests/e2e/storybook/colorOwnership.spec.ts',
    ]);
  });

  it('skips storybook-behavior for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    requireSkippedEntry(commands, 'storybook-behavior');
  });

  it('runs the full lane when the package.json impact check is runtime-relevant', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.triggerReason).toContain('runtime-relevant package.json change');
  });
});

describe('buildCommands storybook-build lane', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('runs storybook-build in full mode', () => {
    const commands = buildCommands([], { fullMode: true });
    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.command).toBe('pnpm');
    expect(entry.args).toEqual(['storybook:build']);
  });

  it('runs after visual', () => {
    const commands = buildCommands([], { fullMode: true });
    const labels = commands.map((entry) => entry.label);

    expect(labels.indexOf('visual')).toBeLessThan(labels.indexOf('storybook-build'));
  });

  it('skips storybook-build for an unrelated focused scope', () => {
    const commands = buildCommands(['src/app/main.ts'], { fullMode: false });
    const entry = requireSkippedEntry(commands, 'storybook-build');

    expect(entry.reason).toBe('no storybook-relevant changes');
  });

  it('selects storybook-build for a changed story file', () => {
    const commands = buildCommands(['src/shared/ui/Checkbox/MDCheckbox.stories.ts'], {
      fullMode: false,
    });
    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.triggerReason).toContain('Storybook-relevant path');
  });

  it('selects storybook-build for a Storybook-wide dependency change', () => {
    const commands = buildCommands(['config/alias.ts'], { fullMode: false });
    requireRunEntry(commands, 'storybook-build');
  });

  it('skips storybook-build for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    requireSkippedEntry(commands, 'storybook-build');
  });

  it('runs storybook-build when the package.json impact check is runtime-relevant', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const commands = buildCommands(['package.json'], {
      fullMode: false,
      packageJsonOldRef: 'HEAD~1',
    });
    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.triggerReason).toContain('runtime-relevant package.json change');
  });
});

describe('buildCommands visual relevance for src/app/styles/base.css', () => {
  it('selects visual for a base.css change', () => {
    const commands = buildCommands(['src/app/styles/base.css'], { fullMode: false });
    requireRunEntry(commands, 'visual');
  });
});

describe('buildCommands visual lane (visualRisk integration)', () => {
  it('produces a focused test:visual command with the exact spec for a resolvable colocated visual owner', () => {
    const commands = buildCommands(
      ['src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue'],
      { fullMode: false },
    );
    const entry = requireRunEntry(commands, 'visual');

    expect(entry.args).toEqual([
      'test:visual',
      'src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.visual.spec.ts',
    ]);
  });

  it('produces the full test:visual command for a legacy central visual change', () => {
    const commands = buildCommands(['tests/e2e/visual/shared-ui/md-button.spec.ts'], {
      fullMode: false,
    });
    const entry = requireRunEntry(commands, 'visual');

    expect(entry.args).toEqual(['test:visual']);
  });

  it('skips visual for an unrelated change', () => {
    const commands = buildCommands(['src/entities/document/model/document.ts'], {
      fullMode: false,
    });
    const entry = requireSkippedEntry(commands, 'visual');

    expect(entry.reason).toBe('empty visual scope');
  });

  it('excludes a changed colocated *.visual.spec.ts file from the unit-tests vitest scope', () => {
    const commands = buildCommands(
      ['src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.visual.spec.ts'],
      { fullMode: false },
    );
    requireSkippedEntry(commands, 'unit-tests');
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
  const blockedUnitTestsResult = makeExecutedResult({
    label: 'unit-tests',
    command: 'pnpm exec vitest run --reporter=verbose src/foo.test.ts',
    displayCommand: 'pnpm exec vitest run --reporter=verbose src/foo.test.ts',
    status: 'failed',
    exitCode: 0,
    blockingLogIssue: {
      reason: 'Vue runtime warnings were emitted during unit tests',
      warningSummary: '[Vue warn]: Invalid watch source: 0',
    },
  });

  it('asks to fix failed unit-tests results', () => {
    const actions = getActionRequired([
      makeExecutedResult({ ...blockedUnitTestsResult, exitCode: 1, blockingLogIssue: null }),
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
      makeExecutedResult({
        label: 'unit-tests',
        command: 'pnpm exec vitest run --reporter=verbose src/foo.test.ts',
        status: 'passed',
      }),
    ]);

    expect(actions).toEqual(['None.']);
  });

  it('adds a CI-profile rerun action when local Playwright risk remains', () => {
    const actions = getActionRequired(
      [
        makeExecutedResult({
          label: 'e2e',
          command: 'pnpm e2e:container',
          status: 'passed',
        }),
      ],
      {
        ciProfileRisk: {
          affectedChecks: ['e2e'],
          activeProfile: makeProfile({ name: 'local' }),
          githubActionsProfile: makeProfile({ name: 'github-actions' }),
          differences: [],
        },
        invocation: resolveVerifyInvocation(['--base', 'origin/develop'], {
          GITHUB_ACTIONS: 'false',
        }),
      },
    );

    expect(actions).toContainEqual(
      expect.stringContaining(
        'CI-profile risk remains for e2e because local Playwright used profile local.',
      ),
    );
    expect(actions).toContainEqual(
      expect.stringContaining(
        'pnpm verify --base origin/develop --profile github-actions --only e2e',
      ),
    );
  });

  it('reports a zero-exit blocked unit-tests result through the normal VERIFY RESULT summary', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const summary = printSummary([], 'local-changes', [blockedUnitTestsResult], {
        totalDurationMs: 1234,
      });

      expect(summary).toEqual({ status: 'failed', hasFailed: true, hasCiProfileRisk: false });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');

      expect(output).toContain('VERIFY RESULT');
      expect(output).toContain('status: failed ❌');
      expect(output).toContain('Fix failed unit-tests errors');
      expect(output).toContain('Vue runtime warnings were emitted during unit tests');
      expect(output).toContain('[Vue warn]: Invalid watch source: 0');
      expect(output).toContain('total elapsed:');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('reports no CI-profile risk in the summary once local and GitHub Actions defaults are canonical', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const summary = printSummary(
        ['scripts/verify.ts'],
        'local-base origin/develop',
        [
          makeExecutedResult({
            label: 'e2e',
            command: 'pnpm e2e:container',
            displayCommand: 'pnpm e2e:container',
            status: 'passed',
            triggerReason: 'low-level path scripts/verify.ts -> full app e2e',
          }),
          makeSkippedResult({
            label: 'e2e-install',
            reason: 'browser install is not required; Playwright container provides browsers',
          }),
        ],
        {
          baseRef: 'origin/develop',
          processEnv: {
            GITHUB_ACTIONS: 'false',
          },
        },
      );

      expect(summary).toEqual({ status: 'passed', hasFailed: false, hasCiProfileRisk: false });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('profile: local (source: default-local)');
      expect(output).toContain('base ref: origin/develop');
      expect(output).toContain('status: passed ✅');
      expect(output).toContain('heavy-check triggers:');
      expect(output).toContain('e2e: low-level path scripts/verify.ts -> full app e2e');
      expect(output).toContain('ci profile risk:');
      expect(output).toContain('- none');
    } finally {
      logSpy.mockRestore();
    }
  });
});

describe('getCiProfileRisk', () => {
  it('omits CI-profile risk when Playwright checks did not run', () => {
    expect(
      getCiProfileRisk([
        makeExecutedResult({
          label: 'type-check',
          status: 'passed',
        }),
      ]),
    ).toBeNull();
  });

  it('omits CI-profile risk when the GitHub Actions profile is already active', () => {
    expect(
      getCiProfileRisk(
        [
          makeExecutedResult({
            label: 'visual',
            status: 'passed',
          }),
        ],
        {
          GITHUB_ACTIONS: 'true',
        },
      ),
    ).toBeNull();
  });

  it('omits CI-profile risk for a passed storybook-behavior check since defaults are canonical', () => {
    expect(
      getCiProfileRisk(
        [
          makeExecutedResult({
            label: 'storybook-behavior',
            status: 'passed',
          }),
        ],
        {
          GITHUB_ACTIONS: 'false',
        },
      ),
    ).toBeNull();
  });
});

describe('verify help output', () => {
  it('distinguishes ignored environment bases from rejected explicit full-mode scope', () => {
    const result = spawnSync(process.execPath, ['scripts/verify.ts', '--help'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_BASE_REF: 'develop',
        VERIFY_BASE: 'origin/other',
      },
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(
      'Full mode ignores GITHUB_BASE_REF and VERIFY_BASE; explicit --base/--files are rejected.',
    );
  });
});

describe('runVerifyCli', () => {
  it('fails before running checks when verify lock acquisition is blocked', async () => {
    const runMain = vi.fn();

    await expect(
      runVerifyCli({
        runMain,
        withVerifyLock: vi.fn(() => {
          throw new Error('Another local pnpm verify is already running.');
        }),
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runMain).not.toHaveBeenCalled();
  });
});

describe('resolveVerifyChangedPathContext', () => {
  it('does not resolve Git changed paths for full-project scope', () => {
    const resolveScope = vi.fn();
    const projectChangedFiles = vi.fn();
    const invocation = resolveVerifyInvocation(['--full'], {
      GITHUB_ACTIONS: 'true',
      GITHUB_BASE_REF: 'develop',
      VERIFY_BASE: 'origin/other',
    });

    expect(
      resolveVerifyChangedPathContext(invocation, { resolveScope, projectChangedFiles }),
    ).toEqual({
      changedFiles: [],
      scope: 'full-project',
      baseRef: null,
      packageJsonOldRef: null,
    });
    expect(resolveScope).not.toHaveBeenCalled();
    expect(projectChangedFiles).not.toHaveBeenCalled();
  });
});
