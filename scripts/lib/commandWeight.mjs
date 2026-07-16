import toolingConfig from '../../config/tooling.json' with { type: 'json' };

const commandWeightConfig = toolingConfig.verification.commandWeight;

/**
 * Classify a verification command by the expected local resource cost.
 * @param input Command metadata used for scope-aware classification.
 * @param input.label Verification label.
 * @param [input.fileCount] Explicit file count for scoped commands.
 * @param [input.isFullRepo] Whether the command targets the whole repository.
 * @returns Resource weight for the command.
 */
export function classifyCommandWeight({ label, fileCount = 0, isFullRepo = false }) {
  switch (label) {
    case 'format':
    case 'oxlint':
    case 'material-static':
      return 'light';
    case 'eslint':
      return classifyFileScopedWeight(commandWeightConfig.eslint, fileCount, isFullRepo);
    case 'unit-tests':
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
      return 'expensive';
    case 'release-version':
    case 'release-config':
      return 'light';
    case 'build':
      return 'medium';
    default:
      return 'medium';
  }
}

/**
 * Resolve the ESLint concurrency value for the current environment.
 * @returns ESLint `--concurrency` value.
 */
export function resolveEslintConcurrency() {
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

function classifyFileScopedWeight(config, fileCount, isFullRepo) {
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

function isCi() {
  return process.env.GITHUB_ACTIONS === 'true';
}
