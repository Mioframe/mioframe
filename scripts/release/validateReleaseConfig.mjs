import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OPTIONAL_ENV_KEYS = ['VITE_GOOGLE_CLIENT_ID', 'VITE_SENTRY_DSN', 'SENTRY_AUTH_TOKEN'];
const STABLE_BASE_PATH = '/';
const BRANCH_OR_PR_PATH_PATTERN = /^\/(?:branch|pr)\//;

/**
 * Read and parse a JSON file, for release config validation.
 * @param filePath Path to the JSON file.
 * @param readFile Injectable file reader, for tests.
 * @returns Parsed JSON contents.
 */
function readJson(filePath, readFile) {
  return JSON.parse(readFile(filePath, 'utf8'));
}

/**
 * Validate release-only config assumptions that are not covered by
 * `validateVersion.mjs`: base path consistency, PWA/preview-mode assumptions,
 * and env/config presence semantics for the release artifact build and
 * stable deploy. See `docs/release.md#release-config-validation`.
 *
 * Deliberately does not read or validate secret values themselves — only
 * their presence/absence and consistency with release-mode assumptions
 * (docs/release.md).
 * @param [options] Validation inputs.
 * @param [options.env] Process environment.
 * @param [options.deps] Test seams for file/process access and logging.
 * @returns `true` when validation passed, `false` otherwise. Also sets
 * `process.exitCode` on failure.
 */
export function validateReleaseConfig({ env = process.env, deps = {} } = {}) {
  const { readFile = readFileSync, log = console.log, logError = console.error } = deps;

  const errors = [];
  const notices = [];

  let toolingConfig;

  try {
    toolingConfig = readJson('config/tooling.json', readFile);
  } catch (readError) {
    return finish({
      errors: [
        `Unable to read/parse config/tooling.json: ${readError instanceof Error ? readError.message : String(readError)}`,
      ],
      notices,
      log,
      logError,
    });
  }

  const actualBasePath = toolingConfig.release?.basePath;

  if (typeof actualBasePath !== 'string' || actualBasePath.trim() === '') {
    errors.push('config/tooling.json is missing release.basePath.');
  } else if (actualBasePath !== STABLE_BASE_PATH) {
    errors.push(
      `config/tooling.json release.basePath "${actualBasePath}" must be "${STABLE_BASE_PATH}" for the organization root Pages deployment. ` +
        'Release artifact validation, stable deploy, and GitHub Pages hosting must all agree on this base path.',
    );
  } else {
    notices.push(`release base path: ${STABLE_BASE_PATH}`);
  }

  if (env.VITE_DISABLE_PWA === '1') {
    errors.push(
      'VITE_DISABLE_PWA=1 is set. Release artifact validation and stable deploy must build with PWA enabled; ' +
        'VITE_DISABLE_PWA=1 is a PR-preview-only setting (see the deploy-preview job in .github/workflows/verify.yml).',
    );
  } else {
    notices.push('VITE_DISABLE_PWA: not set (PWA enabled, as required for release)');
  }

  if (typeof env.BASE_URL === 'string' && env.BASE_URL.length > 0) {
    if (BRANCH_OR_PR_PATH_PATTERN.test(env.BASE_URL)) {
      errors.push(
        `BASE_URL "${env.BASE_URL}" looks like a branch or PR preview path. Release artifact validation and ` +
          `stable deploy must use the stable base path (${STABLE_BASE_PATH}), not a branch or PR preview path.`,
      );
    } else if (env.BASE_URL !== STABLE_BASE_PATH) {
      errors.push(
        `BASE_URL "${env.BASE_URL}" does not match the stable base path "${STABLE_BASE_PATH}".`,
      );
    } else {
      notices.push(`BASE_URL: ${env.BASE_URL}`);
    }
  } else {
    notices.push(
      `BASE_URL: not set; release tooling falls back to config/tooling.json release.basePath (${STABLE_BASE_PATH}).`,
    );
  }

  const isGithubActions = env.GITHUB_ACTIONS === 'true';

  for (const key of OPTIONAL_ENV_KEYS) {
    if (!(key in env)) {
      notices.push(
        `${key}: not set (optional; the dependent feature is disabled at build/runtime)`,
      );
      continue;
    }

    if (env[key].trim() === '') {
      if (isGithubActions) {
        // GitHub Actions expands `${{ secrets.X }}` to an empty string when the
        // secret is not configured, and there is no way from inside the job to
        // tell that apart from an explicitly empty value. Treat it the same as
        // "not set" here instead of failing the release gate for an optional
        // integration that was never configured.
        notices.push(
          `${key}: set but empty in GitHub Actions (treated as not configured, not an error — ` +
            'GitHub Actions cannot distinguish an absent secret from an explicit empty value)',
        );
        continue;
      }

      errors.push(
        `${key} is set but empty. An empty value silently disables the dependent feature without a clear signal — ` +
          'either remove the variable/secret entirely, or provide a real value.',
      );
      continue;
    }

    notices.push(`${key}: set`);
  }

  const hasSentryDsn = typeof env.VITE_SENTRY_DSN === 'string' && env.VITE_SENTRY_DSN.trim() !== '';
  const hasSentryAuthToken =
    typeof env.SENTRY_AUTH_TOKEN === 'string' && env.SENTRY_AUTH_TOKEN.trim() !== '';

  if (hasSentryDsn && !hasSentryAuthToken) {
    notices.push(
      'VITE_SENTRY_DSN is set without SENTRY_AUTH_TOKEN: runtime error reporting is enabled, but source maps will not be uploaded to Sentry.',
    );
  } else if (!hasSentryDsn && hasSentryAuthToken) {
    notices.push(
      'SENTRY_AUTH_TOKEN is set without VITE_SENTRY_DSN: the Sentry build plugin may run and upload artifacts, but the runtime will not report errors (no DSN).',
    );
  }

  return finish({ errors, notices, log, logError });
}

function finish({ errors, notices, log, logError }) {
  for (const notice of notices) {
    log(`[release-config] ${notice}`);
  }

  if (errors.length > 0) {
    for (const message of errors) {
      logError(`[release-config] ERROR: ${message}`);
    }

    process.exitCode = 1;
    return false;
  }

  log('[release-config] passed');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateReleaseConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
