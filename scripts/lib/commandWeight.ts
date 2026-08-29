import toolingConfig from '../../config/tooling.json' with { type: 'json' };

const commandWeightConfig = toolingConfig.verification.commandWeight;

/** Expected local resource cost of a verification command. */
export type CommandWeight = 'light' | 'medium' | 'expensive';

/** Command metadata used for scope-aware weight classification. */
export interface ClassifyCommandWeightInput {
  /** Verification label. */
  label: string;
  /** Explicit file count for scoped commands. */
  fileCount?: number;
  /** Whether the command targets the whole repository. */
  isFullRepo?: boolean;
}

/**
 * Classify a verification command by the expected local resource cost.
 * @param input Command metadata used for scope-aware classification.
 * @returns Resource weight for the command.
 */
export function classifyCommandWeight({
  label,
  fileCount = 0,
  isFullRepo = false,
}: ClassifyCommandWeightInput): CommandWeight {
  switch (label) {
    case 'format':
    case 'oxlint':
      return 'light';
    case 'eslint':
      return classifyFileScopedWeight(commandWeightConfig.eslint, fileCount, isFullRepo);
    case 'unit-tests':
    case 'unit-related':
      return classifyFileScopedWeight(commandWeightConfig.vitest, fileCount, isFullRepo);
    case 'type-check':
      return 'medium';
    case 'e2e':
    case 'e2e-install':
    case 'storybook-behavior':
    case 'visual':
    case 'visual-update':
    case 'mutation':
    case 'playwright-container':
    case 'artifact':
    case 'release-smoke':
    case 'managed-updates-browser-integration':
    case 'managed-updates-e2e':
    case 'browser-integration-local':
    // Two real `vite build` invocations (see
    // scripts/release/managedUpdatesControllerArtifactIdentityProof.ts);
    // must route through the same expensive-command lock boundary the
    // historical `managed-updates` aggregate used.
    case 'managed-updates-static':
      return 'expensive';
    case 'release-version':
    case 'release-config':
    case 'publisher-node-import':
      return 'light';
    case 'build':
    case 'storybook-build':
    case 'artifact-static':
      return 'medium';
    default:
      return 'medium';
  }
}

/**
 * Resolve the ESLint concurrency value for the current environment.
 * @returns ESLint `--concurrency` value.
 */
export function resolveEslintConcurrency(): string {
  const explicitOverride =
    process.env.MIOFRAME_ESLINT_CONCURRENCY ?? process.env.ESLINT_CONCURRENCY;

  if (explicitOverride !== undefined && explicitOverride !== '') {
    return explicitOverride;
  }

  if (isCi()) {
    return 'auto';
  }

  // Keep local verify warning-free; forced worker concurrency can emit
  // ESLintPoorConcurrencyWarning even when lint itself succeeds.
  return 'off';
}

interface FileScopedWeightConfig {
  lightMaxFiles: number;
  mediumMaxFiles: number;
}

function classifyFileScopedWeight(
  config: FileScopedWeightConfig,
  fileCount: number,
  isFullRepo: boolean,
): CommandWeight {
  if (isFullRepo) {
    return 'expensive';
  }

  if (fileCount <= config.lightMaxFiles) {
    return 'light';
  }

  if (fileCount <= config.mediumMaxFiles) {
    return 'medium';
  }

  return 'expensive';
}

function isCi(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}
