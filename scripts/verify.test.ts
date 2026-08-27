import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/packageJsonImpact.ts', () => ({
  isVisualRelevantPackageJsonChange: vi.fn(),
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

// Structural E2E planning's real dependencies spawn Playwright/dependency-cruiser
// child processes; every buildCommands() call in this file that does not pass
// its own `structuralE2EPlan` override must still get fast, deterministic
// input instead of paying that real subprocess cost per test.
vi.mock('./lib/e2eOwnerInventoryCollector.ts', () => ({
  collectE2EOwnerInventory: vi.fn(() => []),
}));

// Kept consistent (empty) with the mocked collector above so the default
// filesystem/Playwright completeness check trivially passes for tests that
// do not pass their own `structuralE2EPlan` override; otherwise the real
// current `tests/e2e/**` tree (non-empty) would never match the empty
// mocked inventory.
vi.mock('./lib/e2eOwnerTree.ts', () => ({
  validateE2ETargetTree: vi.fn(() => ({ valid: true, errors: [], targetPaths: [] })),
}));

vi.mock('./lib/e2eGraph.ts', () => ({
  acquireProductionReverseGraph: vi.fn(() => ({ ok: true, graph: {} })),
}));

// Wraps (rather than replaces) the real resolver so every existing mutation
// test still exercises real registry logic; only tests in this file that
// explicitly inspect `.mock.calls` care about the wrapping.
vi.mock('./lib/mutationTargets.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/mutationTargets.ts')>();
  return { ...actual, resolveMutationPlan: vi.fn(actual.resolveMutationPlan) };
});

// The following wrap (rather than replace) their real resolvers/validators,
// purely so the `--fix-only` planning-order seam tests below can assert
// non-invocation; every other existing test in this file still exercises
// real planner logic.
vi.mock('./lib/unitRisk.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/unitRisk.ts')>();
  return { ...actual, resolveUnitPlan: vi.fn(actual.resolveUnitPlan) };
});
vi.mock('./lib/storybookBehaviorRisk.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/storybookBehaviorRisk.ts')>();
  return { ...actual, resolveStorybookBehaviorPlan: vi.fn(actual.resolveStorybookBehaviorPlan) };
});
vi.mock('./lib/storybookBuildRisk.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/storybookBuildRisk.ts')>();
  return { ...actual, resolveStorybookBuildPlan: vi.fn(actual.resolveStorybookBuildPlan) };
});
vi.mock('./lib/visualRisk.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/visualRisk.ts')>();
  return { ...actual, resolveVisualPlan: vi.fn(actual.resolveVisualPlan) };
});
vi.mock('./lib/e2eProjectApplicability.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/e2eProjectApplicability.ts')>();
  return {
    ...actual,
    validateE2EProjectApplicability: vi.fn(actual.validateE2EProjectApplicability),
  };
});
vi.mock('./lib/browserIntegrationRisk.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/browserIntegrationRisk.ts')>();
  return {
    ...actual,
    resolveBrowserIntegrationPlan: vi.fn(actual.resolveBrowserIntegrationPlan),
    resolveGenericBrowserIntegrationPlan: vi.fn(actual.resolveGenericBrowserIntegrationPlan),
  };
});
vi.mock('./lib/releaseStaticRisk.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/releaseStaticRisk.ts')>();
  return { ...actual, resolveReleaseStaticPlan: vi.fn(actual.resolveReleaseStaticPlan) };
});
vi.mock('./lib/e2eRisk.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/e2eRisk.ts')>();
  return { ...actual, resolveStructuralE2EPlan: vi.fn(actual.resolveStructuralE2EPlan) };
});

import {
  isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport,
  isVisualRelevantPackageJsonChange as isVisualRelevantPackageJsonChangeImport,
} from './lib/packageJsonImpact.ts';
import { collectE2EOwnerInventory as collectE2EOwnerInventoryImport } from './lib/e2eOwnerInventoryCollector.ts';
import { acquireProductionReverseGraph as acquireProductionReverseGraphImport } from './lib/e2eGraph.ts';
import { resolveMutationPlan as resolveMutationPlanImport } from './lib/mutationTargets.ts';
import { resolveUnitPlan as resolveUnitPlanImport } from './lib/unitRisk.ts';
import { resolveStorybookBehaviorPlan as resolveStorybookBehaviorPlanImport } from './lib/storybookBehaviorRisk.ts';
import { resolveStorybookBuildPlan as resolveStorybookBuildPlanImport } from './lib/storybookBuildRisk.ts';
import { resolveVisualPlan as resolveVisualPlanImport } from './lib/visualRisk.ts';
import { validateE2EProjectApplicability as validateE2EProjectApplicabilityImport } from './lib/e2eProjectApplicability.ts';
import {
  resolveBrowserIntegrationPlan as resolveBrowserIntegrationPlanImport,
  resolveGenericBrowserIntegrationPlan as resolveGenericBrowserIntegrationPlanImport,
} from './lib/browserIntegrationRisk.ts';
import { resolveStructuralE2EPlan as resolveStructuralE2EPlanImport } from './lib/e2eRisk.ts';
import { validateE2ETargetTree as validateE2ETargetTreeImport } from './lib/e2eOwnerTree.ts';
import { resolveReleaseStaticPlan as resolveReleaseStaticPlanImport } from './lib/releaseStaticRisk.ts';
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
  getExtraEnvForEntry,
  PLAYWRIGHT_COMMAND_OVERHEAD_MS,
  printSummary,
  resolveCommandStatus,
  resolvePlaywrightCommandTimeoutMs,
  resolveVerifyChangedPathContext,
  runVerifyCli,
  selectOnlyCommands,
  withVerificationType,
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
const collectE2EOwnerInventory = vi.mocked(collectE2EOwnerInventoryImport);
const acquireProductionReverseGraph = vi.mocked(acquireProductionReverseGraphImport);
const resolveMutationPlanSpy = vi.mocked(resolveMutationPlanImport);
const resolveUnitPlanSpy = vi.mocked(resolveUnitPlanImport);
const resolveStorybookBehaviorPlanSpy = vi.mocked(resolveStorybookBehaviorPlanImport);
const resolveStorybookBuildPlanSpy = vi.mocked(resolveStorybookBuildPlanImport);
const resolveVisualPlanSpy = vi.mocked(resolveVisualPlanImport);
const validateE2EProjectApplicabilitySpy = vi.mocked(validateE2EProjectApplicabilityImport);
const resolveBrowserIntegrationPlanSpy = vi.mocked(resolveBrowserIntegrationPlanImport);
const resolveGenericBrowserIntegrationPlanSpy = vi.mocked(
  resolveGenericBrowserIntegrationPlanImport,
);
const resolveReleaseStaticPlanSpy = vi.mocked(resolveReleaseStaticPlanImport);
const resolveStructuralE2EPlanSpy = vi.mocked(resolveStructuralE2EPlanImport);
const validateE2ETargetTreeSpy = vi.mocked(validateE2ETargetTreeImport);

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
    'artifact-static': 10 * 60 * 1000,
    'managed-updates-static': 8 * 60 * 1000,
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

  it('sizes the split managed-updates browser-integration and E2E leaf timeouts for their own fresh-container sessions', () => {
    const singleSessionTimeoutMs = resolvePlaywrightCommandTimeoutMs();

    expect(COMMAND_TIMEOUT_MS_BY_LABEL['managed-updates-browser-integration']).toBe(
      3 * singleSessionTimeoutMs,
    );
    expect(COMMAND_TIMEOUT_MS_BY_LABEL['managed-updates-e2e']).toBe(2 * singleSessionTimeoutMs);
  });
});

describe('getCliFilesOverride', () => {
  it('rejects bare --files with no paths', () => {
    expect(() => getCliFilesOverride(['--files'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only static --files src/foo.ts',
    );
  });

  it('rejects --only with an empty --files list', () => {
    expect(() => getCliFilesOverride(['--only', 'static', '--files'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only static --files src/foo.ts',
    );
  });

  it('rejects empty comma-delimited --files values', () => {
    expect(() => getCliFilesOverride(['--files=,'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only static --files src/foo.ts',
    );
    expect(() => getCliFilesOverride(['--files= , '])).toThrow(
      'Missing value for --files. Example: pnpm verify --only static --files src/foo.ts',
    );
  });

  it('keeps explicit file lists working', () => {
    expect(getCliFilesOverride(['--only', 'static', '--files', 'scripts/verify.ts'])).toEqual([
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

  it('runs the complete registered mutation inventory in full mode, with no affected -m override', () => {
    const commands = buildCommands([], { fullMode: true });
    const entry = requireRunEntry(commands, 'mutation');

    expect(entry.command).toBe('pnpm');
    expect(entry.args).toEqual(['exec', 'stryker', 'run']);
    expect(entry.verificationType).toBe('mutation');
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
    expect(requireRunEntry(commands, 'artifact-static').args).toEqual([
      'scripts/release/productionArtifactStaticProof.ts',
    ]);
    expect(requireRunEntry(commands, 'artifact').args).toEqual([
      'e2e:release',
      '--label',
      'artifact',
      'src/shared/service/appUpdate/productionArtifactSmoke.browser-integration.spec.ts',
    ]);
    expect(requireRunEntry(commands, 'release-smoke').args).toEqual([
      'e2e:release',
      '--label',
      'release-smoke',
      'tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts',
    ]);
    expect(requireRunEntry(commands, 'managed-updates-static').args).toEqual([
      'scripts/release/managedUpdatesControllerArtifactIdentityProof.ts',
    ]);
    expect(requireRunEntry(commands, 'managed-updates-browser-integration').command).toBe('node');
    expect(requireRunEntry(commands, 'managed-updates-browser-integration').args).toEqual([
      'scripts/release/managedUpdatesProof.ts',
      '--kind',
      'browser-integration',
    ]);
    expect(requireRunEntry(commands, 'managed-updates-e2e').command).toBe('node');
    expect(requireRunEntry(commands, 'managed-updates-e2e').args).toEqual([
      'scripts/release/managedUpdatesProof.ts',
      '--kind',
      'e2e',
    ]);
  });

  it('runs each production-artifact E2E leaf exactly once in full mode (no duplication with structural focused routing)', () => {
    const commands = buildCommands([], { fullMode: true });

    expect(commands.filter((entry) => entry.label === 'release-smoke')).toHaveLength(1);
    expect(commands.filter((entry) => entry.label === 'managed-updates-e2e')).toHaveLength(1);
  });

  it('runs both split managed-updates leaves through the proof runner, not a direct Playwright command', () => {
    const commands = buildCommands([], { fullMode: true });
    const browserIntegration = requireRunEntry(commands, 'managed-updates-browser-integration');
    const e2e = requireRunEntry(commands, 'managed-updates-e2e');

    for (const entry of [browserIntegration, e2e]) {
      expect(entry.command).not.toBe('pnpm');
      expect(entry.args).not.toContain('e2e:release');
      expect(entry.args).not.toContain(
        'src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts',
      );
    }
  });

  it('assigns exactly one verification type to every runnable release-only leaf, and null to the setup-only build prerequisite', () => {
    const commands = buildCommands([], { fullMode: true });

    expect(requireRunEntry(commands, 'release-version').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'release-config').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'build').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'publisher-node-import').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'artifact-static').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'artifact').verificationType).toBe('browser-integration');
    expect(requireRunEntry(commands, 'release-smoke').verificationType).toBe('e2e');
    expect(requireRunEntry(commands, 'managed-updates-static').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'managed-updates-browser-integration').verificationType).toBe(
      'browser-integration',
    );
    expect(requireRunEntry(commands, 'managed-updates-e2e').verificationType).toBe('e2e');
  });

  it('routes managed-updates-static through the existing expensive-command lock boundary', () => {
    // Two real `vite build` invocations (see
    // scripts/release/managedUpdatesControllerArtifactIdentityProof.ts)
    // must use the same expensive-command coordination the historical
    // `managed-updates` aggregate used, not a weaker `medium` weight that
    // bypasses withExpensiveCommandLock in scripts/verify.ts.
    const commands = buildCommands([], { fullMode: true });

    expect(requireRunEntry(commands, 'managed-updates-static').weight).toBe('expensive');
  });

  it('does not add release-sensitive static/browser-integration/E2E leaves for an empty changed-file set outside full mode', () => {
    const commands = buildCommands([], { fullMode: false });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('release-version');
    expect(labels).not.toContain('release-config');
    expect(labels).not.toContain('build');
    expect(labels).not.toContain('artifact-static');
    expect(labels).not.toContain('artifact');
    expect(labels).not.toContain('release-smoke');
    expect(labels).not.toContain('managed-updates-static');
    expect(labels).not.toContain('managed-updates-browser-integration');
    expect(labels).not.toContain('managed-updates-e2e');
  });
});

describe('buildCommands release-sensitive static lane (releaseStaticRisk integration)', () => {
  it('selects release-version outside full mode for a package.json change, without requiring --full', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);
    const commands = buildCommands(['package.json'], { fullMode: false });

    expect(requireRunEntry(commands, 'release-version').args).toEqual([
      'scripts/release/validateVersion.mjs',
    ]);
    expect(commands.map((entry) => entry.label)).not.toContain('build');
  });

  it('selects release-config outside full mode for a config/tooling.json change', () => {
    const commands = buildCommands(['config/tooling.json'], { fullMode: false });

    expect(requireRunEntry(commands, 'release-config').args).toEqual([
      'scripts/release/validateReleaseConfig.mjs',
    ]);
    expect(requireRunEntry(commands, 'build').args).toEqual(['scripts/release/buildArtifact.mjs']);
  });

  it('selects publisher-node-import outside full mode for a publisher implementation change', () => {
    const commands = buildCommands(['scripts/pages/lib/releasePublish.mjs'], { fullMode: false });

    expect(requireRunEntry(commands, 'publisher-node-import').args).toEqual([
      'scripts/release/publisherWireContractImportProof.mjs',
    ]);
  });

  it('selects build, artifact-static, and managed-updates-static outside full mode for a src/sw.ts change', () => {
    const commands = buildCommands(['src/sw.ts'], { fullMode: false });

    expect(requireRunEntry(commands, 'build').args).toEqual(['scripts/release/buildArtifact.mjs']);
    expect(requireRunEntry(commands, 'artifact-static').args).toEqual([
      'scripts/release/productionArtifactStaticProof.ts',
    ]);
    expect(requireRunEntry(commands, 'managed-updates-static').args).toEqual([
      'scripts/release/managedUpdatesControllerArtifactIdentityProof.ts',
    ]);
  });

  it('does not select any release-sensitive static leaf outside full mode for an unrelated change', () => {
    const commands = buildCommands(['docs/testing/architecture.md'], { fullMode: false });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('release-version');
    expect(labels).not.toContain('release-config');
    expect(labels).not.toContain('build');
    expect(labels).not.toContain('artifact-static');
    expect(labels).not.toContain('managed-updates-static');
    expect(labels).not.toContain('publisher-node-import');
  });

  it('selects build and artifact-static outside full mode, and under --only static, for an ordinary production src/** change', () => {
    const commands = buildCommands(['src/features/documentCreate/index.ts'], { fullMode: false });

    expect(requireRunEntry(commands, 'build').args).toEqual(['scripts/release/buildArtifact.mjs']);
    expect(requireRunEntry(commands, 'artifact-static').args).toEqual([
      'scripts/release/productionArtifactStaticProof.ts',
    ]);

    const selectedStatic = selectOnlyCommands(commands, 'static');
    expect(selectedStatic.map((entry) => entry.label)).toEqual(
      expect.arrayContaining(['build', 'artifact-static']),
    );
  });

  it('stamps every selected release-sensitive static leaf with the static verification type', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);
    const commands = buildCommands(['src/sw.ts', 'package.json'], { fullMode: false });

    expect(requireRunEntry(commands, 'build').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'artifact-static').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'managed-updates-static').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'release-version').verificationType).toBe('static');
  });

  it('still runs the complete static leaf set unconditionally in literal --full mode', () => {
    const commands = buildCommands(['src/features/documentCreate/index.ts'], { fullMode: true });

    expect(requireRunEntry(commands, 'release-version').kind).toBe('run');
    expect(requireRunEntry(commands, 'release-config').kind).toBe('run');
    expect(requireRunEntry(commands, 'build').kind).toBe('run');
    expect(requireRunEntry(commands, 'publisher-node-import').kind).toBe('run');
    expect(requireRunEntry(commands, 'artifact-static').kind).toBe('run');
    expect(requireRunEntry(commands, 'managed-updates-static').kind).toBe('run');
  });

  it('lets --only static select a release-sensitive leaf without requiring --full', () => {
    const commands = buildCommands(['src/sw.ts'], { fullMode: false });
    const selected = selectOnlyCommands(commands, 'static');

    expect(selected.some((entry) => entry.label === 'artifact-static')).toBe(true);
    expect(selected.every((entry) => entry.verificationType === 'static')).toBe(true);
  });
});

describe('buildCommands browser-integration lane (browserIntegrationRisk integration)', () => {
  it('selects only the artifact leaf outside full mode for a direct productionArtifactSmoke spec change', () => {
    const commands = buildCommands(
      ['src/shared/service/appUpdate/productionArtifactSmoke.browser-integration.spec.ts'],
      { fullMode: false },
    );

    expect(requireRunEntry(commands, 'artifact').args).toEqual([
      'e2e:release',
      '--label',
      'artifact',
      'src/shared/service/appUpdate/productionArtifactSmoke.browser-integration.spec.ts',
    ]);
    expect(commands.map((entry) => entry.label)).not.toContain(
      'managed-updates-browser-integration',
    );
  });

  it('selects only the managed-updates-browser-integration leaf outside full mode for a direct managed-update spec change', () => {
    const commands = buildCommands(
      ['src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts'],
      { fullMode: false },
    );

    expect(requireRunEntry(commands, 'managed-updates-browser-integration').args).toEqual([
      'scripts/release/managedUpdatesProof.ts',
      '--kind',
      'browser-integration',
    ]);
    expect(commands.map((entry) => entry.label)).not.toContain('artifact');
  });

  it('selects both leaves outside full mode for an appUpdate production source change', () => {
    const commands = buildCommands(['src/shared/service/appUpdate/workerInstall.ts'], {
      fullMode: false,
    });

    expect(requireRunEntry(commands, 'artifact').kind).toBe('run');
    expect(requireRunEntry(commands, 'managed-updates-browser-integration').kind).toBe('run');
  });

  it('leaves both labels entirely absent outside full mode for an unrelated change', () => {
    const commands = buildCommands(['src/features/documentCreate/index.ts'], { fullMode: false });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('artifact');
    expect(labels).not.toContain('managed-updates-browser-integration');
  });

  it('makes --only browser-integration select the relevant leaf without requiring --full', () => {
    const commands = buildCommands(
      ['src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts'],
      { fullMode: false },
    );
    const selected = selectOnlyCommands(commands, 'browser-integration');

    expect(selected.map((entry) => entry.label)).toEqual(['managed-updates-browser-integration']);
  });
});

describe('buildCommands verification type composition', () => {
  it('assigns exactly one verification type to every non-release runnable/skipped leaf', () => {
    const commands = buildCommands([], { fullMode: true });
    const typeByLabel = {
      'agent-environment': 'static',
      format: 'static',
      oxlint: 'static',
      eslint: 'static',
      'type-check': 'static',
      'storybook-build': 'static',
      'unit-tests': 'unit',
      e2e: 'e2e',
      'storybook-behavior': 'behavior',
      visual: 'visual',
    };

    for (const [label, expectedType] of Object.entries(typeByLabel)) {
      const entry = commands.find((candidate) => candidate.label === label);

      expect(entry).toBeDefined();
      expect(entry?.verificationType).toBe(expectedType);
    }
  });

  it('leaves the pure execution prerequisite without a verification type', () => {
    const commands = buildCommands([], { fullMode: true });
    const e2eInstall = commands.find((entry) => entry.label === 'e2e-install');

    expect(e2eInstall?.verificationType).toBeNull();
  });

  it('owns Storybook buildability as static proof, distinct from behavior/visual artifact reuse', () => {
    // storybook-build is a `static` proof leaf in its own right: behavior/
    // visual reusing the identical build artifact is only an execution
    // optimization and must not merge Storybook buildability's proof
    // ownership into either lane's type.
    const commands = buildCommands([], { fullMode: true });
    const storybookBuild = commands.find((entry) => entry.label === 'storybook-build');
    const storybookBehavior = commands.find((entry) => entry.label === 'storybook-behavior');
    const visual = commands.find((entry) => entry.label === 'visual');

    expect(storybookBuild?.verificationType).toBe('static');
    expect(storybookBehavior?.verificationType).toBe('behavior');
    expect(visual?.verificationType).toBe('visual');
  });

  it('throws for an unregistered command label', () => {
    expect(() =>
      withVerificationType({ kind: 'run', label: 'not-a-real-label', command: 'node', args: [] }),
    ).toThrow('No verification type registered for verify command label: not-a-real-label');
  });
});

describe('selectOnlyCommands', () => {
  it('selects every leaf owned by the static type, including release-only static leaves in full mode', () => {
    const commands = buildCommands([], { fullMode: true });
    const selected = selectOnlyCommands(commands, 'static');

    expect(selected.every((entry) => entry.verificationType === 'static')).toBe(true);
    expect(selected.map((entry) => entry.label)).toEqual(
      expect.arrayContaining([
        'agent-environment',
        'format',
        'oxlint',
        'eslint',
        'type-check',
        'storybook-build',
        'release-version',
        'release-config',
        'build',
        'publisher-node-import',
        'artifact-static',
        'managed-updates-static',
      ]),
    );
    expect(selected.map((entry) => entry.label)).not.toContain('unit-tests');
  });

  it('includes the browser-integration release-only leaves under --only browser-integration', () => {
    const commands = buildCommands([], { fullMode: true });
    const selected = selectOnlyCommands(commands, 'browser-integration');

    expect(selected.map((entry) => entry.label)).toEqual([
      'artifact',
      'managed-updates-browser-integration',
      'browser-integration-local',
    ]);
  });

  it('includes the e2e-install prerequisite alongside the selected e2e proof leaf, in planned order', () => {
    const commands = buildCommands([], { fullMode: true });
    const selected = selectOnlyCommands(commands, 'e2e');

    expect(selected.map((entry) => entry.label)).toEqual([
      'e2e-install',
      'e2e',
      'release-smoke',
      'managed-updates-e2e',
    ]);
  });

  it('never selects a proof leaf owned by another type', () => {
    const commands = buildCommands([], { fullMode: true });

    for (const type of ['static', 'unit', 'behavior', 'visual', 'mutation'] as const) {
      const selected = selectOnlyCommands(commands, type);

      expect(
        selected.every((entry) => entry.label === 'e2e-install' || entry.verificationType === type),
      ).toBe(true);
    }
  });

  it('returns a valid, non-failing empty selection for performance, which has no current inventory', () => {
    const commands = buildCommands([], { fullMode: true });

    expect(selectOnlyCommands(commands, 'performance')).toEqual([]);
  });

  it('returns every command unchanged when onlyType is null', () => {
    const commands = buildCommands([], { fullMode: true });

    expect(selectOnlyCommands(commands, null)).toEqual(commands);
  });
});

// Additional proof for the broadened release-static production-artifact
// capability (primary proof owner: scripts/lib/releaseStaticRisk.test.ts):
// prove selected real `build` + `artifact-static` leaves under default
// composition for representative current Vite config dependency classes,
// through the real (unmocked) resolveReleaseStaticPlan wiring.
describe('buildCommands release-static production-artifact composition', () => {
  it.each([
    'config/alias.ts',
    'config/plugins/base.ts',
    'config/vueCustomElements.ts',
    '.browserslistrc',
    'tsconfig.app.json',
  ])('selects build and artifact-static for a real %s change', (filePath) => {
    const commands = buildCommands([filePath]);

    expect(requireRunEntry(commands, 'build').verificationType).toBe('static');
    expect(requireRunEntry(commands, 'artifact-static').verificationType).toBe('static');
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
      verificationType: 'visual',
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
        'invalid target E2E ownership state: app e2e spec tests/e2e/newSpec.spec.ts has no project applicability entry',
      verificationType: 'e2e',
    });
  });

  it('combines an invalid app e2e scenario registry and an invalid project applicability registry', () => {
    const commands = buildCommands([], {
      fullMode: false,
      structuralE2EPlan: { mode: 'invalid', reasons: ['broken scenario registry'] },
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
        'invalid target E2E ownership state: broken scenario registry; broken applicability registry',
      verificationType: 'e2e',
    });
  });

  it('runs e2e normally when the project applicability registry is valid', () => {
    const commands = buildCommands([], {
      fullMode: false,
      structuralE2EPlan: { mode: 'skip', reasons: ['empty e2e scope'] },
      projectApplicabilityValidation: { valid: true, errors: [] },
    });

    expect(commands.find((entry) => entry.label === 'e2e')).toMatchObject({
      kind: 'skipped',
      label: 'e2e',
      reason: 'empty e2e scope',
    });
  });
});

describe('buildCommands structural production-artifact E2E routing', () => {
  it('routes a focused productionArtifact selection through its special leaf, without running the ordinary e2e leaf', () => {
    const commands = buildCommands([], {
      fullMode: false,
      structuralE2EPlan: {
        mode: 'focused',
        ordinarySpecs: [],
        releaseSmokeSelected: true,
        managedUpdatesE2ESelected: false,
        reasons: ['selected'],
      },
    });

    expect(requireSkippedEntry(commands, 'e2e').reason).toBe(
      'no ordinary target E2E specs selected',
    );
    expect(requireRunEntry(commands, 'release-smoke')).toBeTruthy();
    expect(commands.find((entry) => entry.label === 'managed-updates-e2e')).toBeUndefined();
  });

  it('routes both ordinary and productionArtifact selections together in one focused plan', () => {
    const commands = buildCommands([], {
      fullMode: false,
      structuralE2EPlan: {
        mode: 'focused',
        ordinarySpecs: ['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'],
        releaseSmokeSelected: false,
        managedUpdatesE2ESelected: true,
        reasons: ['selected'],
      },
    });

    expect(requireRunEntry(commands, 'e2e').args).toEqual([
      'e2e:container',
      'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
    ]);
    expect(requireRunEntry(commands, 'managed-updates-e2e')).toBeTruthy();
    expect(commands.find((entry) => entry.label === 'release-smoke')).toBeUndefined();
  });

  it('widens a structural full-E2E fallback to include both production-artifact leaves exactly once', () => {
    const commands = buildCommands([], {
      fullMode: false,
      structuralE2EPlan: { mode: 'full', reasons: ['relevant change with no safe owner'] },
    });

    expect(requireRunEntry(commands, 'e2e').args).toEqual(['e2e:container']);
    expect(commands.filter((entry) => entry.label === 'release-smoke')).toHaveLength(1);
    expect(commands.filter((entry) => entry.label === 'managed-updates-e2e')).toHaveLength(1);
  });
});

describe('buildCommands E2E acquisition seams (cheap classifier gates expensive acquisition)', () => {
  beforeEach(() => {
    collectE2EOwnerInventory.mockClear();
    acquireProductionReverseGraph.mockClear();
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('acquires neither the Playwright owner inventory nor the dependency-cruiser graph for a docs-only default invocation', () => {
    buildCommands(['docs/testing/architecture.md']);

    expect(collectE2EOwnerInventory).not.toHaveBeenCalled();
    expect(acquireProductionReverseGraph).not.toHaveBeenCalled();
  });

  it('acquires neither for an empty changed-file set', () => {
    buildCommands([]);

    expect(collectE2EOwnerInventory).not.toHaveBeenCalled();
    expect(acquireProductionReverseGraph).not.toHaveBeenCalled();
  });

  it('acquires neither for --fix-only with no --only, even for a production-source change', () => {
    buildCommands(['src/entities/repository/index.ts'], { fixMode: 'fix-only' });

    expect(collectE2EOwnerInventory).not.toHaveBeenCalled();
  });

  it('acquires neither for --only <non-e2e>, even for a production-source change', () => {
    buildCommands(['src/entities/repository/index.ts'], { onlyType: 'unit' });

    expect(collectE2EOwnerInventory).not.toHaveBeenCalled();
  });

  it('acquires the Playwright owner inventory for a default invocation with relevant production source', () => {
    buildCommands(['src/entities/repository/index.ts']);

    expect(collectE2EOwnerInventory).toHaveBeenCalledTimes(1);
  });

  it('acquires the Playwright owner inventory for --only e2e with a direct target E2E spec change', () => {
    buildCommands(['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'], { onlyType: 'e2e' });

    expect(collectE2EOwnerInventory).toHaveBeenCalledTimes(1);
  });

  it('acquires for a runtime-relevant package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    buildCommands(['package.json']);

    expect(collectE2EOwnerInventory).toHaveBeenCalledTimes(1);
  });

  it('does not acquire for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    buildCommands(['package.json']);

    expect(collectE2EOwnerInventory).not.toHaveBeenCalled();
  });

  it('always acquires in literal --full mode regardless of the cheap classifier', () => {
    buildCommands(['docs/testing/architecture.md'], { fullMode: true });

    expect(collectE2EOwnerInventory).toHaveBeenCalledTimes(1);
  });
});

// M1 (docs/testing/verify-redesign-final-review-architecture-revision-agent-task.md's
// "C. One E2E relevance gate before all E2E structural validation"):
// target-tree/project-applicability structural validation must sit behind
// the same E2E relevance decision as the expensive Playwright/dependency-
// cruiser acquisition above, not run unconditionally after it.
describe('buildCommands E2E structural validation relevance gate', () => {
  beforeEach(() => {
    validateE2ETargetTreeSpy.mockClear();
    validateE2EProjectApplicabilitySpy.mockClear();
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('calls neither validator for a docs-only default invocation', () => {
    buildCommands(['docs/testing/architecture.md']);

    expect(validateE2ETargetTreeSpy).not.toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).not.toHaveBeenCalled();
  });

  it('calls neither validator for an empty changed-file set', () => {
    buildCommands([]);

    expect(validateE2ETargetTreeSpy).not.toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).not.toHaveBeenCalled();
  });

  it('calls neither validator for --only <non-e2e>, even for a production-source change', () => {
    buildCommands(['src/entities/repository/index.ts'], { onlyType: 'unit' });

    expect(validateE2ETargetTreeSpy).not.toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).not.toHaveBeenCalled();
  });

  it('calls both validators for a default invocation with relevant production source', () => {
    buildCommands(['src/entities/repository/index.ts']);

    expect(validateE2ETargetTreeSpy).toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).toHaveBeenCalledTimes(1);
  });

  it('calls both validators for --only e2e with a direct target E2E spec change', () => {
    buildCommands(['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'], { onlyType: 'e2e' });

    expect(validateE2ETargetTreeSpy).toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).toHaveBeenCalledTimes(1);
  });

  it('always calls both validators in literal --full mode regardless of the cheap classifier', () => {
    buildCommands(['docs/testing/architecture.md'], { fullMode: true });

    expect(validateE2ETargetTreeSpy).toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).toHaveBeenCalledTimes(1);
  });
});

// M1 (docs/testing/verify-redesign-final-review-correction-02-agent-task.md's
// "Make --fix-only return before all proof planning"): a fixer-only build
// must construct and return its fixer command plan without invoking any
// non-static proof planner/validator dependency at all, not merely without
// the expensive Playwright/dependency-cruiser acquisition those planners may
// trigger.
describe('buildCommands --fix-only planning-order seams', () => {
  beforeEach(() => {
    resolveUnitPlanSpy.mockClear();
    resolveStorybookBehaviorPlanSpy.mockClear();
    resolveStorybookBuildPlanSpy.mockClear();
    resolveVisualPlanSpy.mockClear();
    resolveMutationPlanSpy.mockClear();
    validateE2EProjectApplicabilitySpy.mockClear();
    resolveBrowserIntegrationPlanSpy.mockClear();
    resolveGenericBrowserIntegrationPlanSpy.mockClear();
    resolveReleaseStaticPlanSpy.mockClear();
    resolveStructuralE2EPlanSpy.mockClear();
    validateE2ETargetTreeSpy.mockClear();
    collectE2EOwnerInventory.mockClear();
    acquireProductionReverseGraph.mockClear();
  });

  it('calls no non-static proof planner/validator for a docs-only --fix-only invocation', () => {
    buildCommands(['docs/testing/architecture.md'], { fixMode: 'fix-only' });

    expect(resolveUnitPlanSpy).not.toHaveBeenCalled();
    expect(resolveStorybookBehaviorPlanSpy).not.toHaveBeenCalled();
    expect(resolveStorybookBuildPlanSpy).not.toHaveBeenCalled();
    expect(resolveVisualPlanSpy).not.toHaveBeenCalled();
    expect(resolveMutationPlanSpy).not.toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).not.toHaveBeenCalled();
    expect(resolveBrowserIntegrationPlanSpy).not.toHaveBeenCalled();
    expect(resolveGenericBrowserIntegrationPlanSpy).not.toHaveBeenCalled();
    expect(resolveReleaseStaticPlanSpy).not.toHaveBeenCalled();
    expect(resolveStructuralE2EPlanSpy).not.toHaveBeenCalled();
    expect(validateE2ETargetTreeSpy).not.toHaveBeenCalled();
    expect(collectE2EOwnerInventory).not.toHaveBeenCalled();
    expect(acquireProductionReverseGraph).not.toHaveBeenCalled();
  });

  it('calls no non-static proof planner/validator for --fix-only with a broad production/release-sensitive change', () => {
    buildCommands(
      [
        'src/entities/repository/index.ts',
        'src/sw.ts',
        'package.json',
        'stryker.config.mjs',
        'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
      ],
      { fixMode: 'fix-only' },
    );

    expect(resolveUnitPlanSpy).not.toHaveBeenCalled();
    expect(resolveStorybookBehaviorPlanSpy).not.toHaveBeenCalled();
    expect(resolveStorybookBuildPlanSpy).not.toHaveBeenCalled();
    expect(resolveVisualPlanSpy).not.toHaveBeenCalled();
    expect(resolveMutationPlanSpy).not.toHaveBeenCalled();
    expect(validateE2EProjectApplicabilitySpy).not.toHaveBeenCalled();
    expect(resolveBrowserIntegrationPlanSpy).not.toHaveBeenCalled();
    expect(resolveGenericBrowserIntegrationPlanSpy).not.toHaveBeenCalled();
    expect(resolveReleaseStaticPlanSpy).not.toHaveBeenCalled();
    expect(resolveStructuralE2EPlanSpy).not.toHaveBeenCalled();
    expect(validateE2ETargetTreeSpy).not.toHaveBeenCalled();
  });

  it('still constructs the fixer-only command plan for --fix-only', () => {
    const commands = buildCommands(['src/entities/repository/index.ts'], {
      fixMode: 'fix-only',
    });

    expect(commands.map((entry) => entry.label)).toEqual([
      'agent-environment',
      'format',
      'oxlint',
      'eslint',
    ]);
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

describe('buildCommands mutation registry scope', () => {
  it('selects exactly the registered target when its exact source changes', () => {
    const commands = buildCommands(['src/shared/lib/changeObject/deepPatchJsonObject.ts'], {
      fullMode: false,
    });
    const mutationEntry = requireRunEntry(commands, 'mutation');

    expect(mutationEntry.args).toEqual([
      'exec',
      'stryker',
      'run',
      '-m',
      'src/shared/lib/changeObject/deepPatchJsonObject.ts',
    ]);
  });

  it('selects exactly the registered target when its exact owning test changes', () => {
    const commands = buildCommands(['src/shared/lib/migrations/defineVersion.test.ts'], {
      fullMode: false,
    });
    const mutationEntry = requireRunEntry(commands, 'mutation');

    expect(mutationEntry.args).toEqual([
      'exec',
      'stryker',
      'run',
      '-m',
      'src/shared/lib/migrations/defineVersion.ts',
    ]);
  });

  it('does not register an unrelated production source merely because it has a sibling unit test', () => {
    const commands = buildCommands(['src/shared/lib/cache/index.ts'], { fullMode: false });

    requireSkippedEntry(commands, 'mutation');
  });

  it('skips mutation outside full mode when mutation scope is empty', () => {
    const commands = buildCommands([], { fullMode: false });

    requireSkippedEntry(commands, 'mutation');
  });

  it('selects the complete registered inventory for a mutation-infrastructure change', () => {
    const commands = buildCommands(['stryker.config.mjs'], { fullMode: false });
    const mutationEntry = requireRunEntry(commands, 'mutation');

    expect(mutationEntry.args).toEqual([
      'exec',
      'stryker',
      'run',
      '-m',
      [
        'src/shared/lib/changeObject/deepPatchJsonObject.ts',
        'src/shared/lib/changeObject/deepPutJsonObject.ts',
        'src/shared/lib/migrations/defineMigrations.ts',
        'src/shared/lib/migrations/defineVersion.ts',
      ].join(','),
    ]);
  });

  it('fails closed for an invalid mutation registry state', () => {
    const commands = buildCommands([], {
      fullMode: false,
      mutationPlan: { mode: 'invalid', sources: [], reasons: ['registered source does not exist'] },
    });

    expect(commands.find((entry) => entry.label === 'mutation')).toEqual({
      kind: 'failed',
      label: 'mutation',
      command: 'pnpm exec stryker run',
      reason: 'invalid mutation registry state: registered source does not exist',
      verificationType: 'mutation',
    });
  });

  // B3 (docs/testing/verify-redesign-pass-e-correction.md): literal --full
  // must not bypass registry structural invalidity before Stryker execution.
  it('fails closed for an invalid mutation registry state in literal full mode, without a runnable Stryker child', () => {
    const commands = buildCommands([], {
      fullMode: true,
      mutationPlan: { mode: 'invalid', sources: [], reasons: ['registered source does not exist'] },
    });

    expect(commands.find((entry) => entry.label === 'mutation')).toEqual({
      kind: 'failed',
      label: 'mutation',
      command: 'pnpm exec stryker run',
      reason: 'invalid mutation registry state: registered source does not exist',
      verificationType: 'mutation',
    });
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

    // M2 (docs/testing/verify-redesign-final-review-correction-02-agent-task.md):
    // deleted/renamed-away mutation infrastructure must still reach
    // resolveMutationPlan()'s changed-file classification; it must not be
    // erased by filesystem-existence filtering before mutation planning.
    it('passes a deleted/renamed-away path through to the mutation planner instead of filtering it by filesystem existence', () => {
      resolveMutationPlanSpy.mockClear();
      const deletedInfraPath = 'stryker.config.mjs';
      const deletedUnrelatedPath = 'src/shared/lib/verifyMutationScopeDeletedFixture.ts';

      expect(fs.existsSync(deletedUnrelatedPath)).toBe(false);

      buildCommands([deletedInfraPath, deletedUnrelatedPath], { fullMode: false });

      expect(resolveMutationPlanSpy).toHaveBeenCalledWith(
        expect.arrayContaining([deletedInfraPath, deletedUnrelatedPath]),
        expect.anything(),
      );
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
      'relevant production change src/shared/service/serviceWorker.ts has no safely established E2E product owner',
    );
  });
});

describe('buildCommands removed/renamed spec safety', () => {
  it('runs full app e2e for a deleted target E2E spec whose owner no longer exists, without passing it as a command argument', () => {
    const removedSpec = 'tests/e2e/pages/GoneOwner/removedFlow.e2e.spec.ts';
    const commands = buildCommands([removedSpec], { fullMode: false });
    const e2eEntry = requireRunEntry(commands, 'e2e');

    expect(e2eEntry.triggerReason).toContain('removed/moved target E2E spec');
    expect(e2eEntry.args).not.toContain(removedSpec);
  });

  it('runs the full storybook-behavior lane for a deleted behavior spec without passing it as a command argument', () => {
    const removedSpec = 'src/shared/ui/Snackbar/RemovedFlow.behavior.spec.ts';
    const commands = buildCommands([removedSpec], {
      fullMode: false,
    });
    const behaviorEntry = requireRunEntry(commands, 'storybook-behavior');

    expect(behaviorEntry.triggerReason).toContain('removed or renamed colocated behavior spec');
    expect(behaviorEntry.args).not.toContain(removedSpec);
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

  it('runs a focused lane for a changed existing owner-local behavior spec', () => {
    const commands = buildCommands(['src/shared/ui/Snackbar/MDSnackbar.behavior.spec.ts'], {
      fullMode: false,
    });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.args).toEqual([
      'test:storybook-behavior',
      'src/shared/ui/Snackbar/MDSnackbar.behavior.spec.ts',
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
    const commands = buildCommands(['src/shared/ui/Snackbar/MDSnackbar.behavior.spec.ts'], {
      fullMode: false,
      repeat: 10,
    });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.args).toEqual([
      'test:storybook-behavior',
      'src/shared/ui/Snackbar/MDSnackbar.behavior.spec.ts',
      '--repeat-each',
      '10',
    ]);
  });

  it('leaves an ordinary storybook-behavior command without a repeat argument', () => {
    const commands = buildCommands(['src/shared/ui/Snackbar/MDSnackbar.behavior.spec.ts'], {
      fullMode: false,
      repeat: null,
    });
    const entry = requireRunEntry(commands, 'storybook-behavior');

    expect(entry.args).toEqual([
      'test:storybook-behavior',
      'src/shared/ui/Snackbar/MDSnackbar.behavior.spec.ts',
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

  it('produces the full test:visual command for the cross-owner visual helper change', () => {
    const commands = buildCommands(['tests/e2e/visual/storybook.ts'], {
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

describe('buildCommands unit planning', () => {
  it('produces native vitest --changed with the resolved diff base for a unit-relevant git-diff scope', () => {
    const commands = buildCommands(['src/shared/lib/cache/index.ts'], {
      fullMode: false,
      changedPathsInput: {
        kind: 'git-diff',
        changedPaths: [{ status: 'modified', path: 'src/shared/lib/cache/index.ts' }],
      },
      packageJsonOldRef: 'origin/develop',
    });

    expect(requireRunEntry(commands, 'unit-tests').args).toEqual([
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
      '--changed',
      'origin/develop',
    ]);
    expect(commands.find((entry) => entry.label === 'unit-related')).toBeUndefined();
  });

  it('widens a git-diff scope to full unit for a removed unit-relevant source path', () => {
    const commands = buildCommands([], {
      fullMode: false,
      changedPathsInput: {
        kind: 'git-diff',
        changedPaths: [{ status: 'deleted', path: 'src/shared/lib/cache/index.ts' }],
      },
      packageJsonOldRef: 'origin/develop',
    });

    expect(requireRunEntry(commands, 'unit-tests').args).toEqual([
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
    ]);
  });

  it('widens a git-diff scope to full unit for a unit-global infrastructure change', () => {
    const commands = buildCommands(['vitest.config.ts'], {
      fullMode: false,
      changedPathsInput: {
        kind: 'git-diff',
        changedPaths: [{ status: 'modified', path: 'vitest.config.ts' }],
      },
      packageJsonOldRef: 'origin/develop',
    });

    expect(requireRunEntry(commands, 'unit-tests').args).toEqual([
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
    ]);
  });

  it('skips unit for a deterministically unit-irrelevant git-diff scope', () => {
    const commands = buildCommands(['docs/testing/architecture.md'], {
      fullMode: false,
      changedPathsInput: {
        kind: 'git-diff',
        changedPaths: [{ status: 'modified', path: 'docs/testing/architecture.md' }],
      },
      packageJsonOldRef: 'origin/develop',
    });

    requireSkippedEntry(commands, 'unit-tests');
  });

  it('produces native vitest related --run for an explicit non-test source path', () => {
    const commands = buildCommands(['src/shared/lib/cache/index.ts'], { fullMode: false });

    const relatedEntry = requireRunEntry(commands, 'unit-related');

    expect(relatedEntry.args).toEqual([
      'exec',
      'vitest',
      'related',
      '--run',
      '--reporter=verbose',
      'src/shared/lib/cache/index.ts',
    ]);
    expect(commands.find((entry) => entry.label === 'unit-tests')).toBeUndefined();
  });

  it('preserves both a direct test and a related source path as two unit leaves without full-unit widening', () => {
    const commands = buildCommands(
      ['src/shared/lib/cache/index.test.ts', 'src/shared/lib/changeObject/deepPatchJsonObject.ts'],
      { fullMode: false },
    );

    expect(requireRunEntry(commands, 'unit-tests').args).toEqual([
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
      'src/shared/lib/cache/index.test.ts',
    ]);
    expect(requireRunEntry(commands, 'unit-related').args).toEqual([
      'exec',
      'vitest',
      'related',
      '--run',
      '--reporter=verbose',
      'src/shared/lib/changeObject/deepPatchJsonObject.ts',
    ]);
  });

  it('widens an explicit scope to full unit for a removed/moved unit-relevant path', () => {
    const removedPath = 'src/shared/lib/verifyUnitPlanRemovedFixture.ts';

    expect(fs.existsSync(removedPath)).toBe(false);

    const commands = buildCommands([removedPath], { fullMode: false });

    expect(requireRunEntry(commands, 'unit-tests').args).toEqual([
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
    ]);
  });

  it('widens an explicit scope to full unit for a unit-global infrastructure path', () => {
    const commands = buildCommands(['package.json'], { fullMode: false });

    expect(requireRunEntry(commands, 'unit-tests').args).toEqual([
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
    ]);
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

  it('sets RELEASE_ARTIFACT_SKIP_BUILD once build has passed, for artifact-static, artifact, and release-smoke', () => {
    const priorResults = [{ label: 'build', status: 'passed' }];

    expect(getExtraEnvForEntry({ label: 'artifact-static' }, priorResults)).toEqual({
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
    });
    expect(getExtraEnvForEntry({ label: 'artifact' }, priorResults)).toEqual({
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
    });
    expect(getExtraEnvForEntry({ label: 'release-smoke' }, priorResults)).toEqual({
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
    });
  });

  it('also treats a passed artifact-static leaf as a fresh-artifact source for artifact and release-smoke', () => {
    const priorResults = [{ label: 'artifact-static', status: 'passed' }];

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

  // B1 (docs/testing/verify-redesign-pass-e-correction.md): Vitest's own
  // --changed/related passWithNoTests-implicit-true diagnostic exits 0, so a
  // unit-relevant scope with zero matching tests must still fail closed
  // through this same blocking-log mechanism.
  const noTestFilesLog = [
    'RUN  v4.1.10 /home/mioframe',
    '',
    'No test files found, exiting with code 0',
    'filter: src/app/router.ts',
  ].join('\n');

  it('flags a unit-tests log with the Vitest zero-match diagnostic', () => {
    const issue = getBlockingLogIssue('unit-tests', noTestFilesLog);

    expect(issue).toEqual({
      reason: 'Vitest found no matching unit test files for this affected scope',
      warningSummary: 'No test files found, exiting with code 0',
    });
  });

  it('flags a unit-related log with the Vitest zero-match diagnostic', () => {
    const issue = getBlockingLogIssue('unit-related', noTestFilesLog);

    expect(issue).toEqual({
      reason: 'Vitest found no matching unit test files for this related scope',
      warningSummary: 'No test files found, exiting with code 0',
    });
  });

  it('does not flag the zero-match diagnostic for an unrelated label', () => {
    expect(getBlockingLogIssue('e2e', noTestFilesLog)).toBeNull();
  });

  it('ignores the zero-match marker mid-line', () => {
    const log = 'this test asserts the message "No test files found, exiting with code 0"';

    expect(getBlockingLogIssue('unit-tests', log)).toBeNull();
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

  it('fails a zero-exit unit-tests command whose log reports no matching test files', () => {
    const { status, blockingLogIssue } = resolveCommandStatus(
      'unit-tests',
      0,
      'No test files found, exiting with code 0',
    );

    expect(status).toBe('failed');
    expect(blockingLogIssue?.reason).toBe(
      'Vitest found no matching unit test files for this affected scope',
    );
  });

  it('fails a zero-exit unit-related command whose log reports no matching test files', () => {
    const { status } = resolveCommandStatus(
      'unit-related',
      0,
      'No test files found, exiting with code 0',
    );

    expect(status).toBe('failed');
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

  it('retains a valid full-scope rerun for a failed leaf in full mode, instead of an invalid --full --only combination', () => {
    const fullInvocation = resolveVerifyInvocation(['--full'], { GITHUB_ACTIONS: 'false' });

    const actions = getActionRequired(
      [
        makeExecutedResult({
          label: 'artifact-static',
          command: 'node scripts/release/productionArtifactStaticProof.ts',
          status: 'failed',
          exitCode: 1,
        }),
      ],
      { invocation: fullInvocation },
    );

    expect(actions).toContainEqual(expect.stringContaining('Fix failed artifact-static errors'));
    expect(actions).toContainEqual(expect.stringContaining('pnpm verify --full'));
    expect(actions.some((action) => action.includes('--only'))).toBe(false);
  });

  it('retains a valid full-scope rerun for every split managed-updates leaf, never narrowing by type', () => {
    const fullInvocation = resolveVerifyInvocation(['--full'], { GITHUB_ACTIONS: 'false' });

    for (const label of [
      'managed-updates-static',
      'managed-updates-browser-integration',
      'managed-updates-e2e',
    ]) {
      const actions = getActionRequired(
        [
          makeExecutedResult({
            label,
            command: 'node scripts/release/managedUpdatesProof.ts',
            status: 'failed',
            exitCode: 1,
          }),
        ],
        { invocation: fullInvocation },
      );

      expect(actions).toContainEqual(expect.stringContaining(`Fix failed ${label} errors`));
      expect(actions).toContainEqual(expect.stringContaining('pnpm verify --full'));
      expect(actions.some((action) => action.includes('--only'))).toBe(false);
    }
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

  it('never narrows the CI-profile rerun by type during a full invocation', () => {
    const fullInvocation = resolveVerifyInvocation(['--full'], { GITHUB_ACTIONS: 'false' });

    const actions = getActionRequired(
      [
        makeExecutedResult({
          label: 'visual',
          command: 'pnpm test:visual',
          status: 'passed',
        }),
      ],
      {
        ciProfileRisk: {
          affectedChecks: ['visual'],
          activeProfile: makeProfile({ name: 'local' }),
          githubActionsProfile: makeProfile({ name: 'github-actions' }),
          differences: [],
        },
        invocation: fullInvocation,
      },
    );

    expect(actions).toContainEqual(
      expect.stringContaining('pnpm verify --full --profile github-actions'),
    );
    expect(actions.some((action) => action.includes('--only'))).toBe(false);
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

  it('reports the selected verification type on the summary "only" line', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      printSummary([], 'local-changes', [], {
        invocation: resolveVerifyInvocation(['--only', 'unit'], { GITHUB_ACTIONS: 'false' }),
        totalDurationMs: 0,
      });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('only: unit');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('reports "all" on the summary "only" line for an unfocused invocation', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      printSummary([], 'local-changes', [], {
        invocation: resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false' }),
        totalDurationMs: 0,
      });

      const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('only: all');
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

  it('lists exactly the eight canonical verification types for --only and no legacy labels', () => {
    const result = spawnSync(process.execPath, ['scripts/verify.ts', '--help'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env },
    });

    expect(result.status).toBe(0);

    for (const type of [
      'static',
      'unit',
      'behavior',
      'visual',
      'browser-integration',
      'performance',
      'mutation',
      'e2e',
    ]) {
      expect(result.stdout).toContain(`\n  ${type}\n`);
    }

    expect(result.stdout).not.toContain('--storybook-build-ci-fallback');
    expect(result.stdout).not.toContain('--full --only');
    expect(result.stdout).not.toContain('--only eslint');
    expect(result.stdout).not.toContain('--only unit-tests');
    expect(result.stdout).not.toContain('--only storybook-behavior');
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
      input: null,
    });
    expect(resolveScope).not.toHaveBeenCalled();
    expect(projectChangedFiles).not.toHaveBeenCalled();
  });

  it('preserves the resolved git-diff scope input for a focused invocation', () => {
    const gitDiffInput = {
      kind: 'git-diff' as const,
      changedPaths: [{ status: 'modified' as const, path: 'src/foo.ts' }],
    };
    const resolveScope = vi.fn(() => ({
      input: gitDiffInput,
      scope: 'local-changes',
      baseRef: null,
      packageJsonOldRef: 'HEAD',
    }));
    const projectChangedFiles = vi.fn(() => ['src/foo.ts']);
    const invocation = resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false' });

    expect(
      resolveVerifyChangedPathContext(invocation, { resolveScope, projectChangedFiles }),
    ).toEqual({
      changedFiles: ['src/foo.ts'],
      scope: 'local-changes',
      baseRef: null,
      packageJsonOldRef: 'HEAD',
      input: gitDiffInput,
    });
  });
});
