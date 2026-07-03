import { createHash } from 'node:crypto';

const MAX_SLUG_LENGTH = 63;
const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set(['branch', 'pr']);
const HASH_LENGTH = 8;
const DEVELOP_BRANCH_NAME = 'develop';

/**
 * Derive a deterministic hash suffix from the raw (pre-normalization) branch
 * name, so branch names that normalize to the same prefix (e.g.
 * `feature/a`, `feature-a`, `feature_a` all normalize to `feature-a`) never
 * collide on the same `/branch/<slug>/` deployment path.
 * @param branchName Raw branch name.
 * @returns An 8-character lowercase hex hash, e.g. `a1b2c3d4`.
 */
function hashBranchName(branchName) {
  return createHash('sha256').update(branchName, 'utf8').digest('hex').slice(0, HASH_LENGTH);
}

/**
 * Derive a safe, URL-path-safe, collision-resistant branch slug from a
 * branch name.
 *
 * The literal `develop` branch name maps to the bare slug `develop`, so a
 * manual dispatch against `develop` resolves to the same `branch/develop/`
 * slot the automatic develop-push deployment uses (see `deploy-develop` in
 * `.github/workflows/verify.yml`, which publishes with a fixed `--slug
 * develop` and does not call this function). Every other branch name always
 * gets a hash suffix below, so nothing else can ever collide with that bare
 * slug.
 *
 * For every other branch name: lower-cases, replaces any run of non
 * `[a-z0-9]` characters (including `/` from `feature/x` branch names) with a
 * single `-`, trims leading/trailing `-`, truncates to leave room for an
 * 8-character hex suffix derived from the raw branch name, and appends that
 * suffix. Two branch names that normalize to the same prefix (`feature/a`,
 * `feature-a`, `feature_a`) therefore always produce different slugs, since
 * the hash is derived from the distinct raw names, not the normalized
 * prefix.
 * @param branchName Raw branch name, e.g. `feature/My Branch`.
 * @returns The derived slug, e.g. `feature-my-branch-a1b2c3d4`.
 */
export function slugifyBranch(branchName) {
  if (typeof branchName !== 'string' || branchName.trim() === '') {
    throw new Error(`Invalid branch name: ${JSON.stringify(branchName)}`);
  }

  const trimmed = branchName.trim();

  if (trimmed === DEVELOP_BRANCH_NAME) {
    return validateBranchSlug(DEVELOP_BRANCH_NAME);
  }

  const suffix = `-${hashBranchName(trimmed)}`;

  const prefix = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH - suffix.length)
    .replace(/-+$/g, '');

  if (prefix === '') {
    throw new Error(`Branch name ${JSON.stringify(branchName)} produces an empty slug.`);
  }

  return validateBranchSlug(`${prefix}${suffix}`);
}

/**
 * Validate a branch slug is safe to use as a `/branch/<slug>/` path segment.
 *
 * Rejects reserved top-level namespace names (`branch`, `pr`) so a branch
 * can never publish over the shared `/branch/` or `/pr/` roots.
 * @param slug Candidate slug.
 * @returns The validated slug.
 */
export function validateBranchSlug(slug) {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid branch slug: ${JSON.stringify(slug)}`);
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`Branch slug ${JSON.stringify(slug)} is reserved.`);
  }
  return slug;
}

/**
 * Validate a PR number string and return it.
 * @param prNumber PR number as a string from CLI or event context.
 * @returns The validated PR number string.
 */
export function validatePrNumber(prNumber) {
  if (!/^\d+$/.test(prNumber) || prNumber === '0') {
    throw new Error(`Invalid PR number: ${prNumber}`);
  }
  return prNumber;
}
