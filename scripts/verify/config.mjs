import path from 'node:path';
import toolingConfig from '../../config/tooling.json' with { type: 'json' };

export const VERIFY_DIR = '.verify';
export const VERIFY_LOG_DIR = path.posix.join(VERIFY_DIR, 'logs');
export const MAX_RELEVANT_LINES = 20;
export const MAX_FILE_ARGS_IN_SUMMARY = 4;
export const MAX_ROLLING_BUFFER_CHARS = 128 * 1024;
export const HEARTBEAT_INTERVAL_MS = 60 * 1000;
export const KILL_GRACE_MS = 10 * 1000;
export const EXPENSIVE_SKIP_REASON =
  'previous check failed; skipped expensive verification to save CI minutes';

export const VALID_COMMAND_LABELS = [
  'format',
  'oxlint',
  'eslint',
  'type-check',
  'unit-tests',
  'e2e-install',
  'e2e',
  'visual',
  'mutation',
];

export const COMMAND_TIMEOUT_MS_BY_LABEL = new Map([
  ['e2e-install', 10 * 60 * 1000],
  ['e2e', 12 * 60 * 1000],
  ['visual', 15 * 60 * 1000],
  ['mutation', 12 * 60 * 1000],
]);

export const DISPLAY_COMMAND_BY_LABEL = new Map([
  ['format', 'pnpm exec oxfmt --check'],
  ['oxlint', 'pnpm exec oxlint'],
  ['eslint', 'pnpm exec eslint --cache --concurrency=auto'],
  ['type-check', 'pnpm type-check'],
  ['unit-tests', 'pnpm exec vitest run'],
  ['e2e-install', 'pnpm e2e:install'],
  ['e2e', 'pnpm exec playwright test'],
  ['visual', 'pnpm test:visual'],
  ['mutation', 'pnpm exec stryker run -m <source file>'],
]);

export const FORMATTABLE_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.mts',
  '.scss',
  '.ts',
  '.tsx',
  '.vue',
  '.yaml',
  '.yml',
]);

export const LINTABLE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.vue']);
export const SOURCE_EXTENSIONS = ['.ts', '.vue'];

export const IGNORED_PREFIXES = [
  'node_modules/',
  'dist/',
  `${toolingConfig.storybook.staticDir}/`,
  'coverage/',
  'reports/',
  'playwright-report/',
  'test-results/',
  '.stryker-tmp/',
];

export const FORMAT_LINT_IGNORED_PREFIXES = ['.github/'];
