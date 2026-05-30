import { availableParallelism } from 'node:os';

import toolingConfig from '../../config/tooling.json' with { type: 'json' };

const commandWeightConfig = toolingConfig.verification.commandWeight;
const eslintConfig = toolingConfig.verification.eslint;

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
      return 'light';
    case 'eslint':
      return classifyFileScopedWeight(commandWeightConfig.eslint, fileCount, isFullRepo);
    case 'unit-tests':
      return classifyFileScopedWeight(commandWeightConfig.vitest, fileCount, isFullRepo);
    case 'type-check':
      return 'medium';
    case 'e2e':
    case 'e2e-install':
    case 'visual':
    case 'visual-update':
    case 'mutation':
    case 'playwright-container':
      return 'expensive';
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

  const parallelism = availableParallelism();
  const reservedForSystem = Math.max(1, parallelism - 1);
  const bounded = Math.min(eslintConfig.maxLocalConcurrency, reservedForSystem);

  return String(Math.max(1, bounded));
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
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}
