import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import {
  calculateExpectedVersion,
  getFlagValue,
  isReleaseSyncBackBranch,
  readPackageVersion,
  readPrLabelNames,
  readVersionAtRef,
  resolveVersionImpactFromLabels,
  VERSION_IMPACT_LABELS,
} from './versionPolicy.mjs';

const VALID_IMPACTS = new Set(Object.keys(VERSION_IMPACT_LABELS));

/**
 * Resolve where this run's expected version and base ref come from: an
 * explicit local `--base`/`--impact` invocation, or the GitHub Actions
 * `pull_request` event context. Ordinary materialization applies only to
 * same-repository PRs targeting `develop`; missing/multiple labels and
 * non-`develop` targets resolve to a non-blocking skip, never an error.
 * GitHub Actions PR contexts require a base-ancestry check before a write;
 * explicit local diagnosis contexts do not.
 * @param env Process environment.
 * @param argv Raw CLI arguments.
 * @param deps Test seams for file access.
 * @returns The resolved context.
 */
export function resolveMaterializationContext(
  env = process.env,
  argv = process.argv.slice(2),
  deps = {},
) {
  const { readFile = readFileSync } = deps;

  const explicitBase = getFlagValue(argv, '--base');
  const explicitImpact = getFlagValue(argv, '--impact');

  if (explicitBase && explicitImpact) {
    if (!VALID_IMPACTS.has(explicitImpact)) {
      return {
        kind: 'error',
        message: `Invalid --impact "${explicitImpact}"; must be one of ${[...VALID_IMPACTS].join(', ')}.`,
      };
    }

    return {
      kind: 'materialize',
      baseRef: explicitBase,
      impact: explicitImpact,
      headBranch: undefined,
      requiresBaseAncestryCheck: false,
    };
  }

  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'pull_request') {
    return {
      kind: 'skip',
      reason:
        'not running in a GitHub Actions pull_request context; pass --base <ref> --impact <patch|minor|major> for local diagnosis',
    };
  }

  const baseBranch = env.GITHUB_BASE_REF;

  if (baseBranch !== 'develop') {
    return {
      kind: 'skip',
      reason: `PR base branch "${baseBranch}" is not develop; automatic materialization only applies to ordinary develop PRs`,
    };
  }

  let labelNames;

  try {
    labelNames = readPrLabelNames(env.GITHUB_EVENT_PATH, readFile);
  } catch (error) {
    return {
      kind: 'error',
      message: `Unable to read PR labels from the GitHub event payload: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const impactResult = resolveVersionImpactFromLabels(labelNames);

  if (!impactResult.ok) {
    const reason =
      impactResult.reason === 'missing'
        ? `no version-impact label present; add exactly one of ${Object.values(VERSION_IMPACT_LABELS).join(', ')} (docs/release.md#choosing-patch--minor--major)`
        : `multiple version-impact labels present (${impactResult.impacts
            .map((impact) => VERSION_IMPACT_LABELS[impact])
            .join(', ')}); exactly one is required`;

    return { kind: 'skip', reason };
  }

  return {
    kind: 'materialize',
    baseRef: `origin/${baseBranch}`,
    impact: impactResult.impact,
    headBranch: env.GITHUB_HEAD_REF,
    requiresBaseAncestryCheck: true,
  };
}

function writePackageVersion(packageJsonPath, nextVersion, readFile, writeFile) {
  const raw = readFile(packageJsonPath, 'utf8');
  const pattern = /"version":\s*"[^"]*"/;

  if (!pattern.test(raw)) {
    throw new Error(`${packageJsonPath} has no "version" field to update.`);
  }

  writeFile(packageJsonPath, raw.replace(pattern, `"version": "${nextVersion}"`), 'utf8');
}

function getBaseAncestry(baseRef, spawn) {
  try {
    const result = spawn('git', ['merge-base', '--is-ancestor', baseRef, 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result?.status === 0) {
      return 'ancestor';
    }

    return result?.status === 1 ? 'stale' : 'error';
  } catch {
    return 'error';
  }
}

/**
 * Deterministically materialize `package.json`'s `version` field for an
 * ordinary same-repository PR into `develop`, from its declared
 * `version:patch|minor|major` label and the current base version. Infra
 * failures (unreadable event payload, unreadable base version, invalid base
 * SemVer, failed ancestry check, failed write) fail this step. A missing or
 * multiple version-impact label or stale PR base is a non-blocking skip:
 * `package.json` is left untouched and the blocking decision is left to
 * `release-version`. See
 * `docs/release.md#same-repository-ci-materialization`.
 * @param [options] Materialization inputs.
 * @param [options.argv] Raw CLI arguments.
 * @param [options.env] Process environment.
 * @param [options.deps] Test seams for file/process access and logging.
 * @returns A result describing what happened. Also sets `process.exitCode`
 * on infra failure.
 */
export function materializePrVersion({
  argv = process.argv.slice(2),
  env = process.env,
  deps = {},
} = {}) {
  const {
    readFile = readFileSync,
    writeFile = writeFileSync,
    spawn = spawnSync,
    log = console.log,
    logError = console.error,
  } = deps;

  let currentVersionRaw;

  try {
    currentVersionRaw = readPackageVersion('package.json', readFile);
  } catch (error) {
    logError(
      `[materialize-pr-version] ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    return { status: 'error' };
  }

  const context = resolveMaterializationContext(env, argv, { readFile });

  if (context.kind === 'error') {
    logError(`[materialize-pr-version] ERROR: ${context.message}`);
    process.exitCode = 1;
    return { status: 'error' };
  }

  if (context.kind === 'skip') {
    log(`[materialize-pr-version] skipped: ${context.reason}`);
    return { status: 'skipped', reason: context.reason };
  }

  if (context.headBranch && isReleaseSyncBackBranch(context.headBranch, currentVersionRaw)) {
    log(
      `[materialize-pr-version] skipped: release sync-back branch "${context.headBranch}" is exempt from version materialization (docs/release.md#release-sync-back).`,
    );
    return { status: 'skipped', reason: 'sync-back' };
  }

  if (context.requiresBaseAncestryCheck) {
    const baseAncestry = getBaseAncestry(context.baseRef, spawn);

    if (baseAncestry === 'stale') {
      log(
        `[materialize-pr-version] skipped: ${context.baseRef} is not an ancestor of HEAD. Synchronize this PR with develop; the resulting synchronize run will recalculate the expected version.`,
      );
      return { status: 'skipped', reason: 'stale-base' };
    }

    if (baseAncestry === 'error') {
      logError(
        `[materialize-pr-version] ERROR: unable to determine whether ${context.baseRef} is an ancestor of HEAD. Ensure the base branch is fetched and retry.`,
      );
      process.exitCode = 1;
      return { status: 'error' };
    }
  }

  const baseVersionRaw = readVersionAtRef(context.baseRef, 'package.json', spawn);

  if (baseVersionRaw === null) {
    logError(
      `[materialize-pr-version] ERROR: unable to read package.json version at ${context.baseRef}. Fetch the base branch and rerun (git fetch --no-tags origin <base branch>).`,
    );
    process.exitCode = 1;
    return { status: 'error' };
  }

  const expectedVersion = calculateExpectedVersion(baseVersionRaw, context.impact);

  if (expectedVersion === null) {
    logError(
      `[materialize-pr-version] ERROR: ${context.baseRef} package.json version "${baseVersionRaw}" is not valid SemVer.`,
    );
    process.exitCode = 1;
    return { status: 'error' };
  }

  if (currentVersionRaw === expectedVersion) {
    log(
      `[materialize-pr-version] package.json already at expected version ${expectedVersion}; no change needed.`,
    );
    return { status: 'unchanged', version: expectedVersion };
  }

  try {
    writePackageVersion('package.json', expectedVersion, readFile, writeFile);
  } catch (error) {
    logError(
      `[materialize-pr-version] ERROR: failed to write package.json: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    return { status: 'error' };
  }

  log(
    `[materialize-pr-version] materialized package.json version: ${currentVersionRaw} -> ${expectedVersion} (${context.impact} bump from ${context.baseRef} ${baseVersionRaw}).`,
  );
  return { status: 'materialized', from: currentVersionRaw, to: expectedVersion };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    materializePrVersion();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
