import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const SYNC_BACK_BRANCH_PATTERN = /^sync\/main-(\d+\.\d+\.\d+)-back-to-develop$/;

/** The three canonical PR release-intent labels, keyed by the SemVer field they bump. */
export const VERSION_IMPACT_LABELS = Object.freeze({
  patch: 'version:patch',
  minor: 'version:minor',
  major: 'version:major',
});

const LABEL_TO_IMPACT = Object.freeze(
  Object.fromEntries(
    Object.entries(VERSION_IMPACT_LABELS).map(([impact, label]) => [label, impact]),
  ),
);

/**
 * Parse a strict `X.Y.Z` SemVer version (no pre-release/build metadata).
 * @param version Raw version string.
 * @returns Parsed `{ major, minor, patch }`, or `null` when invalid.
 */
export function parseSemver(version) {
  const match = SEMVER_PATTERN.exec(version.trim());

  if (!match) {
    return null;
  }

  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

/**
 * Format a parsed SemVer version back to its `X.Y.Z` string form.
 * @param version Parsed `{ major, minor, patch }`.
 * @returns The `X.Y.Z` string.
 */
export function formatSemver(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Compare two parsed SemVer versions.
 * @param left First version.
 * @param right Second version.
 * @returns Negative when `left` < `right`, positive when `left` > `right`, `0` when equal.
 */
export function compareSemver(left, right) {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

/**
 * Apply a PATCH / MINOR / MAJOR bump to a parsed SemVer version.
 * @param version Parsed base `{ major, minor, patch }`.
 * @param impact One of `'patch' | 'minor' | 'major'`.
 * @returns The incremented `{ major, minor, patch }`.
 */
export function incrementSemver(version, impact) {
  switch (impact) {
    case 'patch':
      return { major: version.major, minor: version.minor, patch: version.patch + 1 };
    case 'minor':
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case 'major':
      return { major: version.major + 1, minor: 0, patch: 0 };
    default:
      throw new Error(`Unknown version impact "${impact}".`);
  }
}

/**
 * Calculate the exact expected `X.Y.Z` version string for a base version and impact.
 * @param baseVersionRaw Raw base version string, e.g. from `develop`.
 * @param impact One of `'patch' | 'minor' | 'major'`.
 * @returns The expected version string, or `null` when `baseVersionRaw` is not valid SemVer.
 */
export function calculateExpectedVersion(baseVersionRaw, impact) {
  const base = parseSemver(baseVersionRaw);

  if (!base) {
    return null;
  }

  return formatSemver(incrementSemver(base, impact));
}

/**
 * Resolve exactly one version impact from a PR's label names. Unrelated labels
 * are ignored; the three canonical `version:*` labels are mutually exclusive.
 * @param labelNames PR label names.
 * @returns `{ ok: true, impact }` for exactly one match, or `{ ok: false, reason: 'missing' | 'multiple', impacts? }`.
 */
export function resolveVersionImpactFromLabels(labelNames) {
  const matched = [
    ...new Set(
      labelNames.filter((name) => name in LABEL_TO_IMPACT).map((name) => LABEL_TO_IMPACT[name]),
    ),
  ];

  if (matched.length === 0) {
    return { ok: false, reason: 'missing' };
  }

  if (matched.length > 1) {
    return { ok: false, reason: 'multiple', impacts: matched };
  }

  return { ok: true, impact: matched[0] };
}

/**
 * Read PR label names out of a GitHub Actions `pull_request` event payload.
 * @param eventPath Path to the event JSON file (`GITHUB_EVENT_PATH`).
 * @param readFile Injectable file reader, for tests.
 * @returns The PR's label names.
 */
export function readPrLabelNames(eventPath, readFile = readFileSync) {
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is not set.');
  }

  const raw = readFile(eventPath, 'utf8');
  const parsed = JSON.parse(raw);
  const labels = parsed?.pull_request?.labels;

  if (!Array.isArray(labels)) {
    throw new Error(`${eventPath} does not contain a pull_request.labels array.`);
  }

  return labels.map((label) => label?.name).filter((name) => typeof name === 'string');
}

/**
 * Read the `version` field out of a `package.json` file.
 * @param packageJsonPath Path to the `package.json` file.
 * @param readFile Injectable file reader, for tests.
 * @returns The raw version string.
 */
export function readPackageVersion(packageJsonPath = 'package.json', readFile = readFileSync) {
  const raw = readFile(packageJsonPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (typeof parsed.version !== 'string' || parsed.version.trim() === '') {
    throw new Error(`${packageJsonPath} is missing a string "version" field.`);
  }

  return parsed.version;
}

/**
 * Read the `version` field of `package.json` as it existed at a given git ref.
 * @param ref Git ref, e.g. `origin/develop`.
 * @param packageJsonPath Path to `package.json` relative to the repo root.
 * @param spawn Injectable `spawnSync`, for tests.
 * @returns The raw version string, or `null` when the ref/file is unavailable.
 */
export function readVersionAtRef(ref, packageJsonPath = 'package.json', spawn = spawnSync) {
  const result = spawn('git', ['show', `${ref}:${packageJsonPath}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return typeof parsed.version === 'string' ? parsed.version : null;
  } catch {
    return null;
  }
}

/**
 * Check whether `branchName` is a release sync-back branch (e.g.
 * `sync/main-0.1.0-back-to-develop`) whose embedded version matches
 * `expectedVersion`. See `docs/release.md#release-sync-back`.
 * @param branchName PR head branch name, or `undefined` outside PR context.
 * @param expectedVersion The current `package.json` version.
 * @returns `true` when `branchName` names a sync-back of `expectedVersion`.
 */
export function isReleaseSyncBackBranch(branchName, expectedVersion) {
  if (typeof branchName !== 'string') {
    return false;
  }

  const match = SYNC_BACK_BRANCH_PATTERN.exec(branchName);
  return match !== null && match[1] === expectedVersion;
}

/**
 * Read the value passed to a CLI flag, e.g. `--base origin/develop`.
 * @param argv Raw CLI arguments.
 * @param flag The flag name, including leading dashes.
 * @returns The flag's value, or `undefined` when absent.
 */
export function getFlagValue(argv, flag) {
  const index = argv.indexOf(flag);
  return index !== -1 ? argv[index + 1] : undefined;
}
