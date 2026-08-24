import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { RELEASE_IMPACT_CHECKS } from './lib/releaseRisk.ts';
import type { ChangedPath, ResolvedChangedPathsScope } from './lib/changedPaths.ts';
import {
  buildCommandEnv,
  buildCommands,
  COMMAND_TIMEOUT_MS_BY_LABEL,
  formatCheckCompletionLine,
  formatCheckRunningLine,
  formatFailureDetailLines,
  formatHeartbeatLine,
  getCiProfileRisk,
  getActionRequired,
  getBlockingLogIssue,
  getCliFilesOverride,
  getFailureReason,
  getVerifyProcessEnv,
  getExtraEnvForEntry,
  PLAYWRIGHT_COMMAND_OVERHEAD_MS,
  printSummary,
  resolveCommandStatus,
  resolvePlaywrightCommandTimeoutMs,
  resolveVerifyChangedPathContext,
  runVerifyCli,
  type CheckProgressLabel,
  type CommandEntry,
  type ExecutedCommandResult,
  type FailureDetail,
  type InvalidCommandResult,
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

function makeInvalidResult(
  overrides: Partial<InvalidCommandResult> & Pick<InvalidCommandResult, 'label' | 'reason'>,
): InvalidCommandResult {
  return {
    command: 'pnpm e2e:container',
    displayCommand: 'pnpm e2e:container',
    status: 'failed',
    note: overrides.reason,
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
  const playwrightBackedLabels = [
    'e2e',
    'storybook-behavior',
    'visual',
    'artifact',
    'release-smoke',
  ];
  const unrelatedLabelsWithFixedLimits = {
    'e2e-install': 10 * 60 * 1000,
    mutation: 20 * 60 * 1000,
    build: 10 * 60 * 1000,
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

// .github/workflows/verify.yml's `verification-release` job runs a single
// `pnpm verify --only release-impact` invocation. scripts/lib/releaseRisk.ts's
// `resolveReleasePlan` `full` mode (a release-sensitive infrastructure path,
// pnpm-lock.yaml, or a runtime-relevant package.json change) legitimately
// selects every RELEASE_IMPACT_CHECKS entry together, and scripts/verify.ts
// runs its resolved command list sequentially (a `for...of` loop with
// `await runCommand`, never `Promise.all`). So the worst-case wall-clock
// budget the GitHub Actions job timeout must cover is the SUM of every
// selected release check's own verifier-owned command timeout, not just the
// longest single check (`managed-updates`) in isolation.
describe('verification-release CI job timeout envelope', () => {
  // Reuses the plain-text job-block-extraction pattern already established
  // for workflow assertions elsewhere in this repo (see
  // scripts/release/managedDeploymentValidationWorkflow.test.mjs and
  // scripts/release/buildDateWorkflow.test.mjs) instead of introducing a
  // generic YAML parser dependency.
  function extractJob(source: string, jobName: string): string {
    const match = new RegExp(`\\n {2}${jobName}:\\n([\\s\\S]*?)(?=\\n {2}[\\w-]+:\\n|$)`).exec(
      source,
    );

    if (!match) {
      throw new Error(`Job "${jobName}" not found in workflow source`);
    }

    return match[1];
  }

  function readVerificationReleaseTimeoutMinutes(): number {
    const workflowPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../.github/workflows/verify.yml',
    );
    const source = fs.readFileSync(workflowPath, 'utf8');
    const jobBlock = extractJob(source, 'verification-release');
    const match = /\n {4}timeout-minutes: (\d+)\n/.exec(jobBlock);

    if (!match) {
      throw new Error('verification-release job is missing a top-level timeout-minutes value');
    }

    return Number(match[1]);
  }

  // Strictly-bounded worst case: only sums checks that carry an explicit
  // COMMAND_TIMEOUT_MS_BY_LABEL entry. release-config and
  // publisher-node-import are plain `node` invocations with no entry, so
  // verify.ts enforces no command-level deadline for them; they are real
  // release-impact checks but contribute no additional *verifier-owned*
  // minimum to this envelope. Their exclusion is itself asserted below so a
  // future timeout entry added for either label is not silently dropped from
  // this computation.
  function computeWorstCaseReleaseImpactEnvelopeMs(): number {
    return RELEASE_IMPACT_CHECKS.reduce((total, check) => {
      const timeoutMs = COMMAND_TIMEOUT_MS_BY_LABEL[check];

      return timeoutMs === undefined ? total : total + timeoutMs;
    }, 0);
  }

  it('has no verifier-owned command timeout for release-config or publisher-node-import', () => {
    const uncoveredChecks = RELEASE_IMPACT_CHECKS.filter(
      (check) => COMMAND_TIMEOUT_MS_BY_LABEL[check] === undefined,
    );

    expect(uncoveredChecks).toEqual(['release-config', 'publisher-node-import']);
  });

  it('keeps timeout-minutes strictly greater than the summed worst-case release-impact envelope plus a checkout/install/setup allowance', () => {
    const worstCaseEnvelopeMinutes = computeWorstCaseReleaseImpactEnvelopeMs() / (60 * 1000);
    // Conservative, documented allowance for actions/checkout,
    // pnpm/action-setup, and `pnpm install --frozen-lockfile` ahead of the
    // verify invocation itself. Not a measured budget: every other job in
    // this workflow completes that same setup sequence in a small fraction
    // of its own timeout, so 5 minutes is a deliberately generous buffer
    // rather than an attempt at a tight bound.
    const setupAllowanceMinutes = 5;
    const requiredMinimumMinutes = worstCaseEnvelopeMinutes + setupAllowanceMinutes;

    expect(readVerificationReleaseTimeoutMinutes()).toBeGreaterThan(requiredMinimumMinutes);
  });

  it('keeps timeout-minutes at least the existing 90-minute release-gate precedent (.github/workflows/release.yml release-gate)', () => {
    expect(readVerificationReleaseTimeoutMinutes()).toBeGreaterThanOrEqual(90);
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

  it('keeps release-version out of ordinary mode but adds the six source-impact checks as skipped when nothing release-sensitive changed', () => {
    const commands = buildCommands([], { fullMode: false });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('release-version');

    for (const label of [
      'release-config',
      'build',
      'publisher-node-import',
      'artifact',
      'release-smoke',
      'managed-updates',
    ]) {
      expect(labels).toContain(label);
      requireSkippedEntry(commands, label);
    }
  });

  it('adds a run entry for the matching source-impact release check when a release-sensitive file changed in ordinary mode', () => {
    const commands = buildCommands(['scripts/release/validateReleaseConfig.mjs'], {
      fullMode: false,
    });
    const releaseConfigEntry = requireRunEntry(commands, 'release-config');

    expect(releaseConfigEntry.command).toBe('node');
    expect(releaseConfigEntry.args).toEqual(['scripts/release/validateReleaseConfig.mjs']);

    for (const label of [
      'build',
      'publisher-node-import',
      'artifact',
      'release-smoke',
      'managed-updates',
    ]) {
      requireSkippedEntry(commands, label);
    }
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
  it('still adds a scoped mutation run outside full mode for a registered mutation target', () => {
    const commands = buildCommands(['src/shared/lib/reorder/reorderArray.ts'], {
      fullMode: false,
    });
    const mutationEntry = requireRunEntry(commands, 'mutation');

    expect(mutationEntry.args).toEqual([
      'exec',
      'stryker',
      'run',
      '-m',
      'src/shared/lib/reorder/reorderArray.ts',
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

describe('buildCommands storybook-behavior repeat', () => {
  it('appends exactly one Playwright repeat argument to a focused storybook-behavior command', () => {
    const commands = buildCommands(['tests/e2e/storybook/colorOwnership.spec.ts'], {
      fullMode: false,
      repeat: 10,
    });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.args).toEqual([
      'test:storybook-behavior',
      'tests/e2e/storybook/colorOwnership.spec.ts',
      '--repeat-each',
      '10',
    ]);
  });

  it('leaves an ordinary storybook-behavior command without a repeat argument', () => {
    const commands = buildCommands(['tests/e2e/storybook/colorOwnership.spec.ts'], {
      fullMode: false,
      repeat: null,
    });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.args).toEqual([
      'test:storybook-behavior',
      'tests/e2e/storybook/colorOwnership.spec.ts',
    ]);
  });

  it('does not add a repeat argument to a skipped storybook-behavior command', () => {
    const commands = buildCommands(['src/app/main.ts'], { fullMode: false, repeat: 10 });
    const entry = requireSkippedEntry(commands, 'storybook-behavior');

    expect(entry.reason).toBe('empty storybook behavior scope');
  });

  it('does not leak the repeat argument to any other label', () => {
    const commands = buildCommands([], { fullMode: true, repeat: 10 });

    for (const entry of commands) {
      if (entry.kind !== 'run' || entry.label === 'storybook-behavior') {
        continue;
      }

      expect(entry.args).not.toContain('--repeat-each');
    }
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

  it('runs before storybook-behavior and visual', () => {
    const commands = buildCommands([], { fullMode: true });
    const labels = commands.map((entry) => entry.label);

    expect(labels.indexOf('storybook-build')).toBeLessThan(labels.indexOf('storybook-behavior'));
    expect(labels.indexOf('storybook-build')).toBeLessThan(labels.indexOf('visual'));
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

  it('selects storybook-build when only storybook-behavior requires it', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildPlan: { mode: 'skip', reasons: ['no storybook-relevant changes'] },
      storybookBehaviorPlan: {
        mode: 'focused',
        specs: ['tests/e2e/storybook/colorOwnership.spec.ts'],
        reasons: ['scenario shared color ownership -> tests/e2e/storybook/colorOwnership.spec.ts'],
      },
      visualPlan: { mode: 'skip', specs: [], reasons: ['empty visual scope'] },
    });

    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.triggerReason).toContain(
      'storybook-behavior lane requires a Storybook static build',
    );
  });

  it('selects storybook-build when only visual requires it', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildPlan: { mode: 'skip', reasons: ['no storybook-relevant changes'] },
      storybookBehaviorPlan: {
        mode: 'none',
        specs: [],
        reasons: ['empty storybook behavior scope'],
      },
      visualPlan: {
        mode: 'focused',
        specs: ['src/shared/ui/material/components/x/x.visual.spec.ts'],
        reasons: ['changed colocated visual spec x -> x'],
      },
    });

    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.triggerReason).toContain('visual lane requires a Storybook static build');
  });

  it('does not select storybook-build merely because storybook-behavior is invalid', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildPlan: { mode: 'skip', reasons: ['no storybook-relevant changes'] },
      storybookBehaviorPlan: { mode: 'invalid', specs: [], reasons: ['broken scenario registry'] },
      visualPlan: { mode: 'skip', specs: [], reasons: ['empty visual scope'] },
    });

    requireSkippedEntry(commands, 'storybook-build');
  });

  it('does not select storybook-build merely because visual is invalid', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildPlan: { mode: 'skip', reasons: ['no storybook-relevant changes'] },
      storybookBehaviorPlan: {
        mode: 'none',
        specs: [],
        reasons: ['empty storybook behavior scope'],
      },
      visualPlan: { mode: 'invalid', specs: [], reasons: ['broken visual impact metadata'] },
    });

    requireSkippedEntry(commands, 'storybook-build');
  });
});

describe('buildCommands storybook-build CI fallback', () => {
  const fallbackStorybookBuildPlan = {
    mode: 'full' as const,
    reasons: ['Storybook-relevant path .storybook/preview.ts -> storybook build'],
  };
  const skipStorybookBehaviorPlan = {
    mode: 'none' as const,
    specs: [],
    reasons: ['empty storybook behavior scope'],
  };
  const skipVisualPlan = { mode: 'skip' as const, specs: [], reasons: ['empty visual scope'] };

  it('builds when the ordinary plan requires it and neither browser lane will run', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildCiFallback: true,
      storybookBuildPlan: fallbackStorybookBuildPlan,
      storybookBehaviorPlan: skipStorybookBehaviorPlan,
      visualPlan: skipVisualPlan,
    });

    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.args).toEqual(['storybook:build']);
    expect(entry.triggerReason).toBe(fallbackStorybookBuildPlan.reasons.join('; '));
  });

  it('skips when storybook-behavior will run, even though the ordinary plan requires a build', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildCiFallback: true,
      storybookBuildPlan: fallbackStorybookBuildPlan,
      storybookBehaviorPlan: {
        mode: 'focused',
        specs: ['tests/e2e/storybook/colorOwnership.spec.ts'],
        reasons: ['scenario shared color ownership -> tests/e2e/storybook/colorOwnership.spec.ts'],
      },
      visualPlan: skipVisualPlan,
    });

    const entry = requireSkippedEntry(commands, 'storybook-build');

    expect(entry.reason).toBe(
      'CI fallback: a self-contained Storybook browser lane already supplies the static build prerequisite',
    );
  });

  it('skips when visual will run, even though the ordinary plan requires a build', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildCiFallback: true,
      storybookBuildPlan: fallbackStorybookBuildPlan,
      storybookBehaviorPlan: skipStorybookBehaviorPlan,
      visualPlan: {
        mode: 'full',
        specs: [],
        reasons: ['broad visual-relevant path -> full visual lane'],
      },
    });

    const entry = requireSkippedEntry(commands, 'storybook-build');

    expect(entry.reason).toBe(
      'CI fallback: a self-contained Storybook browser lane already supplies the static build prerequisite',
    );
  });

  it('skips with the ordinary reason when the build plan does not require a build', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildCiFallback: true,
      storybookBuildPlan: { mode: 'skip', reasons: ['no storybook-relevant changes'] },
      storybookBehaviorPlan: skipStorybookBehaviorPlan,
      visualPlan: skipVisualPlan,
    });

    const entry = requireSkippedEntry(commands, 'storybook-build');

    expect(entry.reason).toBe('no storybook-relevant changes');
  });

  it('ignores the fallback flag in full mode and still builds unconditionally', () => {
    const commands = buildCommands([], {
      fullMode: true,
      storybookBuildCiFallback: true,
      storybookBehaviorPlan: {
        mode: 'focused',
        specs: ['tests/e2e/storybook/colorOwnership.spec.ts'],
        reasons: ['scenario shared color ownership -> tests/e2e/storybook/colorOwnership.spec.ts'],
      },
      visualPlan: {
        mode: 'full',
        specs: [],
        reasons: ['broad visual-relevant path -> full visual lane'],
      },
    });

    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.triggerReason).toBe('full-project release verification');
  });

  it('does not affect the ordinary (non-CI-fallback) reuse-aware trigger', () => {
    const commands = buildCommands([], {
      fullMode: false,
      storybookBuildCiFallback: false,
      storybookBuildPlan: { mode: 'skip', reasons: ['no storybook-relevant changes'] },
      storybookBehaviorPlan: {
        mode: 'focused',
        specs: ['tests/e2e/storybook/colorOwnership.spec.ts'],
        reasons: ['scenario shared color ownership -> tests/e2e/storybook/colorOwnership.spec.ts'],
      },
      visualPlan: skipVisualPlan,
    });

    const entry = requireRunEntry(commands, 'storybook-build');

    expect(entry.triggerReason).toContain(
      'storybook-behavior lane requires a Storybook static build',
    );
  });

  it('ignores STORYBOOK_BUILD_CI_FALLBACK in the process environment', () => {
    vi.stubEnv('STORYBOOK_BUILD_CI_FALLBACK', '1');

    try {
      // storybook-build itself does not require a build, but storybook-behavior does; the
      // ordinary (non-CI-fallback) reuse-aware trigger runs the build here. If the removed
      // STORYBOOK_BUILD_CI_FALLBACK env var still had any effect, this would instead skip with
      // the CI-fallback-specific reason since the flag defaults to false.
      const commands = buildCommands([], {
        fullMode: false,
        storybookBuildPlan: { mode: 'skip', reasons: ['no storybook-relevant changes'] },
        storybookBehaviorPlan: {
          mode: 'focused',
          specs: ['tests/e2e/storybook/colorOwnership.spec.ts'],
          reasons: [
            'scenario shared color ownership -> tests/e2e/storybook/colorOwnership.spec.ts',
          ],
        },
        visualPlan: skipVisualPlan,
      });

      const entry = requireRunEntry(commands, 'storybook-build');

      expect(entry.triggerReason).toContain(
        'storybook-behavior lane requires a Storybook static build',
      );
    } finally {
      vi.unstubAllEnvs();
    }
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

  it('routes a changed colocated *.visual.spec.ts file to its real scan-owner tests in the unit-tests vitest scope, without ever treating the spec itself as Vitest source', () => {
    const commands = buildCommands(
      ['src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.visual.spec.ts'],
      { fullMode: false },
    );
    const entry = requireRunEntry(commands, 'unit-tests');

    expect(entry.args).toEqual([
      'exec',
      'vitest',
      'related',
      'playwright.lanes.test.ts',
      'scripts/lib/visualRisk.test.ts',
      'src/readRecoveryImportBoundary.test.ts',
      '--run',
      '--reporter=verbose',
    ]);
    expect(entry.args).not.toContain(
      'src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.visual.spec.ts',
    );
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

  it('does not set STORYBOOK_STATIC_SKIP_BUILD for unrelated labels', () => {
    expect(
      getExtraEnvForEntry({ label: 'e2e' }, [{ label: 'storybook-build', status: 'passed' }]),
    ).toEqual({});
  });

  it('does not set STORYBOOK_STATIC_SKIP_BUILD when storybook-build has not run yet', () => {
    expect(getExtraEnvForEntry({ label: 'storybook-behavior' }, [])).toEqual({});
    expect(getExtraEnvForEntry({ label: 'visual' }, [])).toEqual({});
  });

  it('does not set STORYBOOK_STATIC_SKIP_BUILD when storybook-build failed', () => {
    expect(
      getExtraEnvForEntry({ label: 'storybook-behavior' }, [
        { label: 'storybook-build', status: 'failed' },
      ]),
    ).toEqual({});
  });

  it('sets STORYBOOK_STATIC_SKIP_BUILD once storybook-build has passed, for storybook-behavior and visual', () => {
    const priorResults = [{ label: 'storybook-build', status: 'passed' }];

    expect(getExtraEnvForEntry({ label: 'storybook-behavior' }, priorResults)).toEqual({
      STORYBOOK_STATIC_SKIP_BUILD: '1',
    });
    expect(getExtraEnvForEntry({ label: 'visual' }, priorResults)).toEqual({
      STORYBOOK_STATIC_SKIP_BUILD: '1',
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

  // Per docs/testing/verify-agent-output.md "Verbose mode": verbose output may
  // still include the full plan/trigger/environment/profile/base-ref
  // inventory this contract otherwise retires from the default summary.
  // These two cases now force `verbose: true` explicitly and keep the
  // detailed-inventory coverage there; see the "printSummary default
  // (non-verbose) mode" describe block below for the now-bounded default
  // presentation this contract requires.
  it('reports a zero-exit blocked unit-tests result through the verbose VERIFY RESULT summary', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const summary = printSummary([], 'local-changes', [blockedUnitTestsResult], {
        totalDurationMs: 1234,
        invocation: resolveVerifyInvocation(['--verbose'], { GITHUB_ACTIONS: 'false' }),
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

  it('reports no CI-profile risk in the verbose summary once local and GitHub Actions defaults are canonical', () => {
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
          invocation: resolveVerifyInvocation(['--verbose'], { GITHUB_ACTIONS: 'false' }),
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

// Per docs/testing/verify-agent-output.md "Progress contract": before a
// runnable check, print one compact index/total (or focused) running line.
describe('formatCheckRunningLine', () => {
  it('renders a multi-check running line with the runnable index/total', () => {
    expect(
      formatCheckRunningLine({ label: 'unit-tests', checkIndex: 2, totalRunnableChecks: 5 }),
    ).toBe('[verify 2/5] unit-tests running');
  });

  it('renders a focused single-check running line without a denominator', () => {
    expect(
      formatCheckRunningLine({ label: 'unit-tests', checkIndex: null, totalRunnableChecks: null }),
    ).toBe('[verify] unit-tests running');
  });
});

// Per docs/testing/verify-agent-output.md "Progress contract": on
// completion, print one compact line with status and elapsed time, never a
// fabricated percentage/ETA.
describe('formatCheckCompletionLine', () => {
  const multiProgress: CheckProgressLabel = {
    label: 'unit-tests',
    checkIndex: 2,
    totalRunnableChecks: 5,
  };
  const focusedProgress: CheckProgressLabel = {
    label: 'unit-tests',
    checkIndex: null,
    totalRunnableChecks: null,
  };

  it('renders a compact multi-check passed line with duration', () => {
    expect(formatCheckCompletionLine(multiProgress, 'passed', 18_000)).toBe(
      '[verify 2/5] unit-tests passed (18s)',
    );
  });

  it('renders a compact multi-check failed line with duration', () => {
    expect(formatCheckCompletionLine(multiProgress, 'failed', 18_000)).toBe(
      '[verify 2/5] unit-tests failed (18s)',
    );
  });

  it('renders a focused completion line without a denominator', () => {
    expect(formatCheckCompletionLine(focusedProgress, 'passed', 18_000)).toBe(
      '[verify] unit-tests passed (18s)',
    );
  });

  it('distinguishes passed-with-warnings from a clean pass instead of collapsing the state', () => {
    const passedLine = formatCheckCompletionLine(multiProgress, 'passed', 18_000);
    const warningsLine = formatCheckCompletionLine(multiProgress, 'passed-with-warnings', 18_000);

    expect(warningsLine).not.toBe(passedLine);
    expect(warningsLine).toMatch(/warning/i);
  });

  it('never fabricates a percentage or ETA for any completion status', () => {
    for (const status of ['passed', 'passed-with-warnings', 'failed'] as const) {
      expect(formatCheckCompletionLine(multiProgress, status, 18_000)).not.toMatch(/%|\bETA\b/i);
    }
  });
});

// Per docs/testing/verify-agent-output.md "Long-running heartbeat": bounded,
// verifier-owned liveness only. The heartbeat must never carry a parameter
// for child-process output, so it can never echo the last output line.
describe('formatHeartbeatLine', () => {
  it('renders a bounded heartbeat with index/total, elapsed, owned timeout, and log path', () => {
    expect(
      formatHeartbeatLine({
        label: 'e2e',
        checkIndex: 2,
        totalRunnableChecks: 5,
        elapsedMs: 2 * 60_000,
        timeoutMs: 17 * 60_000,
        logPath: '.verify/logs/e2e.log',
      }),
    ).toBe('[verify 2/5] e2e still running (2m 0s; timeout 17m 0s; log .verify/logs/e2e.log)');
  });

  it('omits the timeout segment when the verifier does not own a timeout for this label', () => {
    expect(
      formatHeartbeatLine({
        label: 'mutation',
        checkIndex: null,
        totalRunnableChecks: null,
        elapsedMs: 60_000,
        timeoutMs: null,
        logPath: '.verify/logs/mutation.log',
      }),
    ).toBe('[verify] mutation still running (1m 0s; log .verify/logs/mutation.log)');
  });

  it('never fabricates a percentage or ETA', () => {
    const line = formatHeartbeatLine({
      label: 'e2e',
      checkIndex: 2,
      totalRunnableChecks: 5,
      elapsedMs: 2 * 60_000,
      timeoutMs: 17 * 60_000,
      logPath: '.verify/logs/e2e.log',
    });

    expect(line).not.toMatch(/%|\bETA\b/i);
  });

  it('has no parameter for child-output text, proving by construction it cannot echo the last output line', () => {
    // HeartbeatProgress intentionally carries no output/last-line field. If the directive
    // below stops erroring, someone added a child-output parameter and reintroduced the
    // regression docs/testing/verify-agent-output.md forbids ("Echoing the last child-output
    // line in normal heartbeats").
    formatHeartbeatLine({
      label: 'e2e',
      checkIndex: 2,
      totalRunnableChecks: 5,
      elapsedMs: 2 * 60_000,
      timeoutMs: 17 * 60_000,
      logPath: '.verify/logs/e2e.log',
      // @ts-expect-error lastOutputLine is not a key of HeartbeatProgress.
      lastOutputLine: 'this must not compile',
    });
  });
});

// Per docs/testing/verify-agent-output.md "Actionable failure, not generic
// noise": omit a pointer line entirely rather than printing a null
// placeholder when that field is not representable.
describe('formatFailureDetailLines', () => {
  const fullDetail: FailureDetail = {
    check: 'unit-tests',
    reason: 'Vue runtime warnings were emitted during unit tests',
    logPath: '.verify/logs/unit-tests.log',
    rerun: 'pnpm verify --only unit-tests',
  };

  it('renders all four lines in order when every field is representable', () => {
    expect(formatFailureDetailLines(fullDetail)).toEqual([
      'unit-tests: failed',
      'reason: Vue runtime warnings were emitted during unit tests',
      'details: .verify/logs/unit-tests.log',
      'rerun: pnpm verify --only unit-tests',
    ]);
  });

  it('omits the details line, without a null placeholder, when no child process ran', () => {
    const lines = formatFailureDetailLines({ ...fullDetail, logPath: null });

    expect(lines).toEqual([
      'unit-tests: failed',
      'reason: Vue runtime warnings were emitted during unit tests',
      'rerun: pnpm verify --only unit-tests',
    ]);
    expect(lines.some((line) => line.startsWith('details:'))).toBe(false);
  });

  it('omits the rerun line, without a null placeholder, when no rerun is representable', () => {
    const lines = formatFailureDetailLines({ ...fullDetail, rerun: null });

    expect(lines).toEqual([
      'unit-tests: failed',
      'reason: Vue runtime warnings were emitted during unit tests',
      'details: .verify/logs/unit-tests.log',
    ]);
    expect(lines.some((line) => line.startsWith('rerun:'))).toBe(false);
  });

  it('omits both pointer lines when neither is representable', () => {
    expect(formatFailureDetailLines({ ...fullDetail, logPath: null, rerun: null })).toEqual([
      'unit-tests: failed',
      'reason: Vue runtime warnings were emitted during unit tests',
    ]);
  });
});

// Per docs/testing/verify-agent-output.md "Failure-detail extraction": prefer
// a verifier-owned reason, then a structured/stable reporter summary (none
// implemented, since no stable reporter-summary contract exists across every
// child tool), then exit code — and never an arbitrary excerpt of captured
// output, which is not proof of relevance and can surface unrelated
// trailing chatter instead of the real error.
describe('getFailureReason', () => {
  it('prefers a verifier-owned blocking-log reason on an executed result over its raw output', () => {
    const result = makeExecutedResult({
      label: 'unit-tests',
      status: 'failed',
      exitCode: 0,
      blockingLogIssue: {
        reason: 'Vue runtime warnings were emitted during unit tests',
        warningSummary: '[Vue warn]: Invalid watch source: 0',
      },
      stdout: 'irrelevant noisy output that must not override the blocking reason',
    });

    expect(getFailureReason(result)).toBe('Vue runtime warnings were emitted during unit tests');
  });

  it('prefers the invalid-plan reason on a pre-execution failed plan entry', () => {
    const result = makeInvalidResult({
      label: 'e2e',
      reason: 'invalid app e2e scenario registry state: duplicate scenario id foo',
    });

    expect(getFailureReason(result)).toBe(
      'invalid app e2e scenario registry state: duplicate scenario id foo',
    );
  });

  // An arbitrary output tail is not proof of relevance. Even when captured
  // stdout contains a real-looking error line, `getFailureReason` must not
  // present an excerpt of it as `reason` unless it comes from a recognized
  // verifier-owned/structured source; the correct default fallback is the
  // exact exit code.
  it('does not infer a reason from unstructured output; falls back to exit code even when stdout contains a real-looking error line', () => {
    const result = makeExecutedResult({
      label: 'type-check',
      status: 'failed',
      exitCode: 1,
      blockingLogIssue: null,
      stdout: 'src/foo.ts(12,3): error TS2322: Type mismatch',
      stderr: '',
    });

    const reason = getFailureReason(result);

    expect(reason).toBe('exit code 1');
    expect(reason).not.toContain('TS2322');
  });

  // A real error can be followed by unrelated trailing chatter (a
  // build-tool footer, a package-manager notice, blank lines). Tail-slicing
  // would present that trailing noise as the "reason", misleading the next
  // agent toward the wrong fix. The default reason must not surface any of
  // it.
  it('does not present unrelated trailing output as the reason when a real error is followed by unrelated trailing chatter', () => {
    const result = makeExecutedResult({
      label: 'build',
      status: 'failed',
      exitCode: 1,
      blockingLogIssue: null,
      stdout: [
        'src/foo.ts(12,3): error TS2322: Type "string" is not assignable to type "number".',
        '',
        'vite v5.4.10 building for production...',
        'done in 842ms.',
        '',
        'npm notice New minor version of npm available! 10.2.0 -> 10.5.0',
      ].join('\n'),
      stderr: '',
    });

    const reason = getFailureReason(result);

    expect(reason).toBe('exit code 1');
    expect(reason).not.toContain('TS2322');
    expect(reason).not.toContain('done in 842ms');
    expect(reason).not.toContain('npm notice');
    expect(reason).not.toContain('New minor version');
  });

  // Regression guard for the hard bound required by
  // docs/testing/verify-agent-output.md's "very large child output does not
  // grow normal terminal output proportionally" acceptance criterion. Under
  // the corrected contract no excerpt is derived from output at all, so a
  // huge captured output must not leak into, or lengthen, the reason.
  it('never grows proportionally with a very large captured output (hard bound)', () => {
    const hugeOutput = 'x'.repeat(50_000);
    const result = makeExecutedResult({
      label: 'type-check',
      status: 'failed',
      exitCode: 1,
      blockingLogIssue: null,
      stdout: hugeOutput,
      stderr: hugeOutput,
    });

    const reason = getFailureReason(result);

    expect(reason).toBe('exit code 1');
    expect(reason.length).toBeLessThan(500);
  });

  it('falls back to the exit code when no reason or output is available', () => {
    const result = makeExecutedResult({
      label: 'build',
      status: 'failed',
      exitCode: 3,
      blockingLogIssue: null,
      stdout: '',
      stderr: '',
    });

    expect(getFailureReason(result)).toBe('exit code 3');
  });
});

// Per docs/testing/verify-agent-output.md "Final summary": bounded by
// default, everything currently always-on (base ref, changed-file count,
// environment, profile, verbose/only metadata, the full per-check
// inventory, the complete skipped-check list, heavy-check triggers, and an
// empty "ci profile risk: - none" line) moves to verbose-only.
describe('printSummary default (non-verbose) mode', () => {
  it('prints a compact bounded result on success without the always-on inventory', () => {
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
          processEnv: { GITHUB_ACTIONS: 'false' },
          invocation: resolveVerifyInvocation(['--base', 'origin/develop'], {
            GITHUB_ACTIONS: 'false',
          }),
          totalDurationMs: 252_000,
        },
      );

      expect(summary).toEqual({ status: 'passed', hasFailed: false, hasCiProfileRisk: false });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');

      // Still present: compact result, plus the durable log-directory pointer
      // and elapsed time from the doc's compact success example.
      expect(output).toContain('VERIFY RESULT');
      expect(output).toContain('passed');
      expect(output).toContain('.verify/logs');
      expect(output).toMatch(/4m\s*12s/);

      // Retired from default output per the Forbidden list.
      expect(output).not.toContain('base ref:');
      expect(output).not.toContain('changed files:');
      expect(output).not.toContain('environment:');
      expect(output).not.toContain('profile:');
      expect(output).not.toContain('verbose:');
      expect(output).not.toContain('only:');
      expect(output).not.toContain('mode:');
      expect(output).not.toContain('heavy-check triggers');
      expect(output).not.toContain('checks skipped');
      expect(output).not.toContain('trigger:');
      expect(output).not.toContain('low-level path scripts/verify.ts -> full app e2e');
      expect(output).not.toContain('e2e-install');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('prints a bounded actionable failure summary with reason/details/rerun per failed check', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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

    try {
      const summary = printSummary(
        ['scripts/verify.ts'],
        'local-changes',
        [blockedUnitTestsResult],
        {
          totalDurationMs: 18_000,
          invocation: resolveVerifyInvocation(['--base', 'origin/develop'], {
            GITHUB_ACTIONS: 'false',
          }),
          baseRef: 'origin/develop',
        },
      );

      expect(summary).toEqual({ status: 'failed', hasFailed: true, hasCiProfileRisk: false });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');

      // Actionable per the "Actionable failure, not generic noise" contract:
      // check label, bounded reason, exact log path, canonical rerun.
      expect(output).toContain('unit-tests');
      expect(output).toContain('failed');
      expect(output).toContain('Vue runtime warnings were emitted during unit tests');
      expect(output).toContain(blockedUnitTestsResult.logPath);
      expect(output).toContain(
        'pnpm verify --base origin/develop --profile local --only unit-tests',
      );

      // Retired from default output per the Forbidden list, even on failure.
      expect(output).not.toContain('base ref:');
      expect(output).not.toContain('changed files:');
      expect(output).not.toContain('environment:');
      expect(output).not.toContain('profile:');
      expect(output).not.toContain('verbose:');
      expect(output).not.toContain('only:');
      expect(output).not.toContain('mode:');
      expect(output).not.toContain('heavy-check triggers');
      expect(output).not.toContain('checks skipped');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('keeps a pre-execution invalid-plan failure actionable without a log pointer', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const invalidResult = makeInvalidResult({
        label: 'e2e',
        reason: 'invalid app e2e scenario registry state: duplicate scenario id foo',
      });

      const summary = printSummary(['scripts/verify.ts'], 'local-changes', [invalidResult], {
        totalDurationMs: 5_000,
        invocation: resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false' }),
      });

      expect(summary).toEqual({ status: 'failed', hasFailed: true, hasCiProfileRisk: false });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');

      expect(output).toContain('e2e');
      expect(output).toContain(
        'invalid app e2e scenario registry state: duplicate scenario id foo',
      );
      expect(output).toContain('pnpm verify --profile local --only e2e');
      // No child process ran for this entry, so there is nothing to point a
      // "details:"/log line at; the reason/rerun stay actionable regardless.
      expect(output).not.toContain('details: .verify/logs/e2e.log');
    } finally {
      logSpy.mockRestore();
    }
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
      changedPaths: [],
      scope: 'full-project',
      baseRef: null,
      packageJsonOldRef: null,
    });
    expect(resolveScope).not.toHaveBeenCalled();
    expect(projectChangedFiles).not.toHaveBeenCalled();
  });

  it('passes git-diff changed paths through unmodified', () => {
    const changedPaths: ChangedPath[] = [
      { status: 'added', path: 'src/added.ts' },
      { status: 'modified', path: 'src/modified.ts' },
      { status: 'deleted', path: 'src/deleted.ts' },
      { status: 'renamed', oldPath: 'src/old.ts', newPath: 'src/new.ts' },
    ];
    const resolveScope = vi.fn(
      (): ResolvedChangedPathsScope => ({
        input: { kind: 'git-diff', changedPaths },
        scope: 'local',
        baseRef: null,
        packageJsonOldRef: null,
      }),
    );
    const projectChangedFiles = vi.fn(() => []);
    const invocation = resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false' });

    const result = resolveVerifyChangedPathContext(invocation, {
      resolveScope,
      projectChangedFiles,
    });

    expect(result.changedPaths).toEqual(changedPaths);
  });

  it('synthesizes explicit-files changed paths as modified, never deleted', () => {
    const resolveScope = vi.fn(
      (): ResolvedChangedPathsScope => ({
        input: { kind: 'explicit-files', files: ['a.ts', 'b.ts'] },
        scope: 'explicit-files',
        baseRef: null,
        packageJsonOldRef: null,
      }),
    );
    const projectChangedFiles = vi.fn(() => ['a.ts', 'b.ts']);
    const invocation = resolveVerifyInvocation(['--only', 'eslint', '--files', 'a.ts', 'b.ts'], {
      GITHUB_ACTIONS: 'false',
    });

    const result = resolveVerifyChangedPathContext(invocation, {
      resolveScope,
      projectChangedFiles,
    });

    expect(result.changedPaths).toEqual([
      { status: 'modified', path: 'a.ts' },
      { status: 'modified', path: 'b.ts' },
    ]);
  });
});

// Deterministic real-CLI subprocess proof for
// docs/testing/verify-output-correction.md's M1/M2 presentation defects
// (see also scripts/REVIEW.md). Both specs launch the real `scripts/verify.ts`
// CLI via `process.execPath`, with a temporary PATH prepended so verify's own
// internal `spawn('node' | 'pnpm', ...)` calls resolve to small deterministic
// shim scripts instead of doing real release/lint work. Only that external
// child-process boundary is replaced: real CLI argument resolution, command
// planning (`buildCommands`/`selectOnlyCommands`), the real `main()`
// execution loop, progress formatting, `runCommand()`, log capture, and the
// real final summary all run unmodified. `GITHUB_ACTIONS=1` is set on the
// subprocess env solely so `scripts/lib/commandLock.ts`'s `shouldSkipLock`
// bypasses the real machine lock (see its `isGitHubActions` check), so this
// proof can never contend with a concurrently running local `pnpm verify`.
//
// The oracle for both specs is docs/testing/verify-agent-output.md plus
// docs/testing/verify-output-correction.md, never scripts/verify.ts's
// current output.

const OXLINT_WARNING_TOKEN = 'MIOFRAME_TEST_OXLINT_WARNING_9f2c31';

/**
 * Build a temporary PATH-shim directory with deterministic executable
 * `node`/`pnpm` scripts that stand in for every external child process
 * `scripts/verify.ts` spawns in these specs. `node` always exits 0 with no
 * output (used by the plain `node scripts/release/*.mjs` release checks).
 * `pnpm` also exits 0 for every invocation except one whose arguments
 * contain `oxlint`, which additionally prints one stable warning-bearing
 * line carrying {@link OXLINT_WARNING_TOKEN} so the real
 * `getWarningSummary()` / `runCommand()` / `printCompactVerifySummary()`
 * warning path executes for real instead of being mocked away.
 */
function createVerifyCliPathShimDir(): string {
  const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-cli-shim-'));
  const pnpmShimSource = [
    '#!/bin/sh',
    '# Deterministic pnpm shim for scripts/verify.test.ts CLI subprocess proof.',
    '# Replaces only the external child-process boundary; never real work.',
    'case " $* " in',
    '  *" oxlint "*)',
    `    echo "example.ts:1:1  warning  no-unused-vars: 1 warning generated (${OXLINT_WARNING_TOKEN})"`,
    '    ;;',
    'esac',
    'exit 0',
    '',
  ].join('\n');
  const nodeShimSource = [
    '#!/bin/sh',
    '# Deterministic node shim for scripts/verify.test.ts CLI subprocess proof.',
    'exit 0',
    '',
  ].join('\n');

  const pnpmPath = path.join(shimDir, 'pnpm');
  const nodePath = path.join(shimDir, 'node');
  fs.writeFileSync(pnpmPath, pnpmShimSource);
  fs.writeFileSync(nodePath, nodeShimSource);
  fs.chmodSync(pnpmPath, 0o755);
  fs.chmodSync(nodePath, 0o755);

  return shimDir;
}

/**
 * Run the real `scripts/verify.ts` CLI as a subprocess through a
 * deterministic PATH-shim child-process boundary (see
 * {@link createVerifyCliPathShimDir}).
 * @param args Verify CLI arguments (after the script path).
 * @param shimDir Directory from {@link createVerifyCliPathShimDir}.
 * @returns Captured stdout and process exit status.
 */
function runVerifyCliSubprocess(
  args: readonly string[],
  shimDir: string,
): { stdout: string; status: number | null } {
  const result = spawnSync(process.execPath, ['scripts/verify.ts', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_ACTIONS: 'true',
      PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}`,
    },
  });

  return { stdout: result.stdout, status: result.status };
}

// M1: docs/testing/verify-output-correction.md "runnable progress is based
// on resolved runnable population". scripts/release/buildArtifact.mjs has an
// accepted four-check release mapping in scripts/lib/releaseRisk.ts's
// NARROW_EXACT_MAPPINGS (['artifact', 'build', 'managed-updates',
// 'release-smoke']), so a `--only release-impact` invocation scoped to it
// must resolve exactly four runnable checks and report indexed 1/4..4/4
// progress -- not the denominator-free `[verify]` form every `--only`
// invocation currently renders unconditionally.
describe('verify CLI subprocess: release-impact progress indexing (M1)', () => {
  it('reports indexed 1/4..4/4 running/completion progress for a resolved four-check release-impact invocation, counting only runnable checks', () => {
    const shimDir = createVerifyCliPathShimDir();

    try {
      const { stdout, status } = runVerifyCliSubprocess(
        ['--only', 'release-impact', '--files', 'scripts/release/buildArtifact.mjs'],
        shimDir,
      );

      expect(status).toBe(0);

      // Run order matches RELEASE_IMPACT_CHECKS declaration order in
      // scripts/lib/releaseRisk.ts, filtered to the four selected checks:
      // build, artifact, release-smoke, managed-updates. release-config and
      // publisher-node-import are skipped for this changed file and must
      // never be counted in the denominator.
      expect(stdout).toContain('[verify 1/4] build running');
      expect(stdout).toContain('[verify 2/4] artifact running');
      expect(stdout).toContain('[verify 3/4] release-smoke running');
      expect(stdout).toContain('[verify 4/4] managed-updates running');

      expect(stdout).toMatch(/\[verify 1\/4] build passed \(/);
      expect(stdout).toMatch(/\[verify 2\/4] artifact passed \(/);
      expect(stdout).toMatch(/\[verify 3\/4] release-smoke passed \(/);
      expect(stdout).toMatch(/\[verify 4\/4] managed-updates passed \(/);
    } finally {
      fs.rmSync(shimDir, { recursive: true, force: true });
    }
  });

  // Regression guard for the required final rule's other branch ("resolved
  // runnable count <= 1 -> [verify]"): a release-impact invocation resolving
  // exactly one runnable check (scripts/release/validateReleaseConfig.mjs ->
  // only release-config) must stay denominator-free rather than render the
  // degenerate `1/1`.
  it('keeps a single-runnable release-impact invocation denominator-free', () => {
    const shimDir = createVerifyCliPathShimDir();

    try {
      const { stdout, status } = runVerifyCliSubprocess(
        ['--only', 'release-impact', '--files', 'scripts/release/validateReleaseConfig.mjs'],
        shimDir,
      );

      expect(status).toBe(0);
      expect(stdout).toContain('[verify] release-config running');
      expect(stdout).toMatch(/\[verify] release-config passed \(/);
      expect(stdout).not.toMatch(/\[verify \d+\/\d+] release-config/);
    } finally {
      fs.rmSync(shimDir, { recursive: true, force: true });
    }
  });
});

// M2: docs/testing/verify-output-correction.md "warning detail has one
// normal-mode owner". Today runCommand() prints the bounded warning summary
// immediately after a passed-with-warnings child process regardless of
// verbose mode, and printCompactVerifySummary() prints the same warning
// summary again -- so normal-mode output duplicates it, and the compact
// block that is supposed to be the one normal-mode owner never carries the
// exact per-check `.verify/logs/<label>.log` pointer.
describe('verify CLI subprocess: normal-mode warning non-duplication (M2)', () => {
  it('prints the bounded oxlint warning summary exactly once in normal mode, with the exact log path and focused rerun', () => {
    const shimDir = createVerifyCliPathShimDir();

    try {
      const { stdout, status } = runVerifyCliSubprocess(
        ['--only', 'oxlint', '--files', 'scripts/verify.ts'],
        shimDir,
      );

      expect(status).toBe(0);

      const summaryMarkerIndex = stdout.indexOf('VERIFY RESULT');
      expect(summaryMarkerIndex).toBeGreaterThan(-1);
      const preSummarySection = stdout.slice(0, summaryMarkerIndex);
      const summarySection = stdout.slice(summaryMarkerIndex);

      // The completion line may report passed-with-warnings as progress
      // state, but the bounded warning detail itself (identified by its
      // unique token) must have exactly one owner in normal-mode output: the
      // compact final summary. runCommand()'s current unconditional
      // immediate print puts the token in preSummarySection too, so this
      // must fail against the current implementation.
      expect(stdout).toMatch(/\[verify] oxlint passed with warnings \(/);
      expect(preSummarySection).not.toContain(OXLINT_WARNING_TOKEN);
      expect(summarySection).toContain(OXLINT_WARNING_TOKEN);

      const tokenOccurrences = (stdout.match(new RegExp(OXLINT_WARNING_TOKEN, 'g')) ?? []).length;
      expect(tokenOccurrences).toBe(1);

      // The compact warning block must carry the exact owning-check log
      // pointer, per "warning block includes the exact
      // .verify/logs/oxlint.log pointer" -- currently missing from
      // printCompactVerifySummary()'s warning loop entirely.
      expect(summarySection).toContain('.verify/logs/oxlint.log');
      expect(summarySection).toMatch(/rerun: pnpm verify .*--only oxlint/);
    } finally {
      fs.rmSync(shimDir, { recursive: true, force: true });
    }
  });

  // Per "Verbose mode does not need the normal-mode non-duplication
  // guarantee": --verbose may still raw-stream the child's actual output and
  // print additional immediate diagnostic detail.
  it('retains raw/additional warning diagnostics in verbose mode', () => {
    const shimDir = createVerifyCliPathShimDir();

    try {
      const { stdout, status } = runVerifyCliSubprocess(
        ['--verbose', '--only', 'oxlint', '--files', 'scripts/verify.ts'],
        shimDir,
      );

      expect(status).toBe(0);
      // Verbose mode raw-streams the child's actual stdout line.
      expect(stdout).toContain('example.ts:1:1');

      const tokenOccurrences = (stdout.match(new RegExp(OXLINT_WARNING_TOKEN, 'g')) ?? []).length;
      expect(tokenOccurrences).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(shimDir, { recursive: true, force: true });
    }
  });
});
