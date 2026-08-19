import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  VERSION_IMPACT_LABELS,
  compareSemver,
  getFlagValue,
  incrementSemver,
  isReleaseSyncBackBranch,
  formatSemver,
  parseSemver,
  readPackageVersion,
  readPrLabelNames,
  readVersionAtRef,
  resolveVersionImpactFromLabels,
} from './versionPolicy.mjs';

const TAG_PATTERN = /^v(\d+\.\d+\.\d+)$/;

/**
 * Check whether a Git tag exists locally (e.g. as fetched by a full-history checkout).
 * @param tag Tag name, e.g. `v0.1.0`.
 * @param spawn Injectable `spawnSync`, for tests.
 * @returns `true` when the tag ref resolves.
 */
export function tagExists(tag, spawn = spawnSync) {
  const result = spawn('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return result.status === 0;
}

/**
 * Resolve the release-version-validation context from CLI flags or CI
 * environment variables. CLI flags always win, so the check can be run
 * locally against an explicit ref or tag.
 * @param env Process environment.
 * @param argv Raw CLI arguments.
 * @returns The resolved context describing which checks apply.
 */
export function resolveVersionContext(env = process.env, argv = process.argv.slice(2)) {
  const explicitTag = getFlagValue(argv, '--tag');

  if (explicitTag) {
    return { kind: 'tag', tag: explicitTag };
  }

  const explicitBase = getFlagValue(argv, '--base');

  if (explicitBase) {
    return {
      kind: 'compare',
      baseRef: explicitBase,
      targetBranch: getFlagValue(argv, '--target'),
      headBranch: getFlagValue(argv, '--head'),
    };
  }

  if (env.GITHUB_ACTIONS !== 'true') {
    return { kind: 'local' };
  }

  if (typeof env.GITHUB_REF === 'string' && env.GITHUB_REF.startsWith('refs/tags/')) {
    return { kind: 'tag', tag: env.GITHUB_REF.slice('refs/tags/'.length) };
  }

  if (env.GITHUB_EVENT_NAME === 'pull_request' && env.GITHUB_BASE_REF) {
    if (env.GITHUB_BASE_REF !== 'develop' && env.GITHUB_BASE_REF !== 'main') {
      return {
        kind: 'stacked-pr',
        baseRef: `origin/${env.GITHUB_BASE_REF}`,
        targetBranch: env.GITHUB_BASE_REF,
      };
    }

    return {
      kind: 'compare',
      baseRef: `origin/${env.GITHUB_BASE_REF}`,
      targetBranch: env.GITHUB_BASE_REF,
      headBranch: env.GITHUB_HEAD_REF,
    };
  }

  if (env.GITHUB_EVENT_NAME === 'push' && env.GITHUB_REF === 'refs/heads/main') {
    return { kind: 'push-main' };
  }

  return { kind: 'ci-other' };
}

function requiresReleaseNotes(context) {
  return (
    context.kind === 'tag' ||
    context.kind === 'push-main' ||
    (context.kind === 'compare' && context.targetBranch === 'main')
  );
}

/**
 * Resolve the exactly-one version-impact label declared for an ordinary
 * develop PR, from an explicit `--impact` flag (local diagnosis) or the
 * GitHub Actions PR event payload.
 * @param argv Raw CLI arguments.
 * @param env Process environment.
 * @param deps Test seams for file access.
 * @returns `{ kind: 'ok', impact }` or `{ kind: 'error', message }`.
 */
function resolveDevelopVersionImpact(argv, env, deps) {
  const explicitImpact = getFlagValue(argv, '--impact');

  if (explicitImpact) {
    if (!Object.hasOwn(VERSION_IMPACT_LABELS, explicitImpact)) {
      return {
        kind: 'error',
        message: `Invalid --impact "${explicitImpact}"; must be one of ${Object.keys(VERSION_IMPACT_LABELS).join(', ')}.`,
      };
    }

    return { kind: 'ok', impact: explicitImpact };
  }

  if (env.GITHUB_ACTIONS !== 'true') {
    return {
      kind: 'error',
      message:
        'No version-impact label information available: pass --impact <patch|minor|major> for a local check, or run in GitHub Actions PR context.',
    };
  }

  let labelNames;

  try {
    labelNames = readPrLabelNames(env.GITHUB_EVENT_PATH, deps.readFile);
  } catch (error) {
    return {
      kind: 'error',
      message: `Unable to read PR labels from the GitHub event payload: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const impactResult = resolveVersionImpactFromLabels(labelNames);

  if (!impactResult.ok) {
    if (impactResult.reason === 'missing') {
      return {
        kind: 'error',
        message: `Missing version-impact label: add exactly one of ${Object.values(VERSION_IMPACT_LABELS).join(', ')} (docs/release.md#choosing-patch--minor--major).`,
      };
    }

    return {
      kind: 'error',
      message: `Multiple version-impact labels present (${impactResult.impacts
        .map((impact) => VERSION_IMPACT_LABELS[impact])
        .join(', ')}); exactly one is required (docs/release.md#choosing-patch--minor--major).`,
    };
  }

  return { kind: 'ok', impact: impactResult.impact };
}

/**
 * Validate release/version metadata: `package.json` version format, an exact
 * label-selected bump against the PR base branch for ordinary `develop` PRs,
 * exact version inheritance (no label required) for a stacked PR into any
 * other branch, a tag-matches-version check on tag pushes, and release
 * notes/checklist existence ahead of a `main` promotion. A narrow
 * same-version exception applies to release sync-back PRs from `main` into
 * `develop` (see `isReleaseSyncBackBranch` and
 * `docs/release.md#release-sync-back`). See `docs/release.md` for the full
 * policy this enforces.
 * @param [options] Validation inputs.
 * @param [options.argv] Raw CLI arguments.
 * @param [options.env] Process environment.
 * @param [options.deps] Test seams for file/process access and logging.
 * @returns `true` when validation passed, `false` otherwise. Also sets
 * `process.exitCode` on failure.
 */
export function validateRelease({
  argv = process.argv.slice(2),
  env = process.env,
  deps = {},
} = {}) {
  const {
    readFile = readFileSync,
    spawn = spawnSync,
    fileExists = existsSync,
    log = console.log,
    logError = console.error,
  } = deps;

  const errors = [];
  const notices = [];
  let currentVersionRaw;

  try {
    currentVersionRaw = readPackageVersion('package.json', readFile);
  } catch (readError) {
    return finish({
      errors: [readError instanceof Error ? readError.message : String(readError)],
      notices,
      log,
      logError,
    });
  }

  const currentVersion = parseSemver(currentVersionRaw);

  if (!currentVersion) {
    errors.push(`package.json version "${currentVersionRaw}" is not a valid X.Y.Z SemVer version.`);
    return finish({ errors, notices, log, logError });
  }

  notices.push(`package.json version: ${currentVersionRaw}`);

  const context = resolveVersionContext(env, argv);
  notices.push(`release context: ${context.kind}`);

  if (context.kind === 'compare') {
    const baseVersionRaw = readVersionAtRef(context.baseRef, 'package.json', spawn);

    if (baseVersionRaw === null) {
      errors.push(
        `Unable to read package.json version at ${context.baseRef}. Fetch the base branch and rerun (git fetch --no-tags origin <base branch>).`,
      );
    } else {
      const baseVersion = parseSemver(baseVersionRaw);

      if (!baseVersion) {
        errors.push(
          `${context.baseRef} package.json version "${baseVersionRaw}" is not valid SemVer.`,
        );
      } else {
        const cmp = compareSemver(currentVersion, baseVersion);
        const releaseTag = `v${currentVersionRaw}`;
        const isMainCompare = context.targetBranch === 'main';
        const isDevelopCompare = context.targetBranch === 'develop';
        const isUnreleasedRepair = cmp === 0 && isMainCompare && !tagExists(releaseTag, spawn);
        const isSyncBackException =
          cmp === 0 &&
          isDevelopCompare &&
          isReleaseSyncBackBranch(context.headBranch, currentVersionRaw);

        if (isDevelopCompare && !isSyncBackException) {
          const impactResult = resolveDevelopVersionImpact(argv, env, { readFile });

          if (impactResult.kind === 'error') {
            errors.push(impactResult.message);
          } else {
            const expectedVersion = formatSemver(incrementSemver(baseVersion, impactResult.impact));

            if (currentVersionRaw === expectedVersion) {
              notices.push(
                `exact version confirmed: ${baseVersionRaw} -> ${currentVersionRaw} (${impactResult.impact}, ${VERSION_IMPACT_LABELS[impactResult.impact]}).`,
              );
            } else {
              errors.push(
                `package.json version must be exactly ${expectedVersion} (${impactResult.impact} bump from ${context.baseRef} ${baseVersionRaw} via ${VERSION_IMPACT_LABELS[impactResult.impact]}); found ${currentVersionRaw}. See docs/release.md#choosing-patch--minor--major.`,
              );
            }
          }
        } else if (isSyncBackException) {
          notices.push(
            `same version as ${context.baseRef} (${currentVersionRaw}) allowed: release sync-back PR from main via head branch "${context.headBranch}" (docs/release.md#release-sync-back).`,
          );
        } else if (isUnreleasedRepair) {
          notices.push(
            `same version as ${context.baseRef} (${currentVersionRaw}) allowed: tag ${releaseTag} does not exist yet, this is a pre-tag release repair (docs/release.md#pre-tag-release-repair).`,
          );
        } else if (cmp > 0) {
          notices.push(`version bump confirmed: ${baseVersionRaw} -> ${currentVersionRaw}`);
        } else if (cmp === 0 && isMainCompare) {
          errors.push(
            `Version must increase for this PR: package.json is ${currentVersionRaw}, matches ${context.baseRef}, and tag ${releaseTag} already exists, so ${currentVersionRaw} is already published. Bump package.json version (docs/release.md#choosing-patch--minor--major).`,
          );
        } else {
          errors.push(
            `Version must increase for this PR: package.json is ${currentVersionRaw}, ${context.baseRef} is ${baseVersionRaw}. Bump package.json version (docs/release.md#choosing-patch--minor--major).`,
          );
        }
      }
    }
  } else if (context.kind === 'stacked-pr') {
    const baseVersionRaw = readVersionAtRef(context.baseRef, 'package.json', spawn);

    if (baseVersionRaw === null) {
      errors.push(
        `Unable to read package.json version at ${context.baseRef}. Fetch the base branch and rerun (git fetch --no-tags origin <base branch>).`,
      );
    } else {
      const baseVersion = parseSemver(baseVersionRaw);

      if (!baseVersion) {
        errors.push(
          `${context.baseRef} package.json version "${baseVersionRaw}" is not valid SemVer.`,
        );
      } else {
        const cmp = compareSemver(currentVersion, baseVersion);

        if (cmp === 0) {
          notices.push(
            `stacked PR into "${context.targetBranch}": package.json version inherited from ${context.baseRef} (${currentVersionRaw}); no version-impact label required (docs/release.md#pr-level-version-bump-policy).`,
          );
        } else {
          errors.push(
            `Stacked PR into "${context.targetBranch}" must inherit the exact base version: package.json is ${currentVersionRaw}, ${context.baseRef} is ${baseVersionRaw}. Set package.json version to match its base branch exactly; a stacked PR does not bump the version (docs/release.md#pr-level-version-bump-policy).`,
          );
        }
      }
    }
  } else if (context.kind === 'tag') {
    const tagMatch = TAG_PATTERN.exec(context.tag);

    if (!tagMatch) {
      errors.push(`Tag "${context.tag}" does not match the required vX.Y.Z format.`);
    } else if (tagMatch[1] !== currentVersionRaw) {
      errors.push(
        `Tag "${context.tag}" does not match package.json version "${currentVersionRaw}".`,
      );
    } else {
      notices.push(`tag ${context.tag} matches package.json version`);
    }
  } else if (context.kind === 'local') {
    notices.push(
      'skipped: PR base-version and tag-match checks require CI context. Pass --base <ref> or --tag vX.Y.Z to check locally.',
    );
  } else if (context.kind === 'push-main') {
    notices.push(
      'push to main: bump already enforced at PR time; validating format and release notes.',
    );
  }

  if (requiresReleaseNotes(context)) {
    const releaseNotesPath = join('docs', 'releases', `${currentVersionRaw}.md`);

    if (!fileExists(releaseNotesPath)) {
      errors.push(
        `Missing release notes for ${currentVersionRaw}: expected ${releaseNotesPath}. Add release notes before promoting to main (docs/release-checklist.md).`,
      );
    } else {
      notices.push(`release notes found: ${releaseNotesPath}`);
    }
  }

  if (!fileExists('docs/release-checklist.md')) {
    errors.push('Missing docs/release-checklist.md.');
  }

  if (!fileExists('docs/release.md')) {
    errors.push('Missing docs/release.md.');
  }

  return finish({ errors, notices, log, logError });
}

function finish({ errors, notices, log, logError }) {
  for (const notice of notices) {
    log(`[release-version] ${notice}`);
  }

  if (errors.length > 0) {
    for (const message of errors) {
      logError(`[release-version] ERROR: ${message}`);
    }

    process.exitCode = 1;
    return false;
  }

  log('[release-version] passed');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateRelease();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
