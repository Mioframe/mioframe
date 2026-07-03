const MAX_SLUG_LENGTH = 63;
const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set(['branch', 'pr']);

/**
 * Derive a safe, URL-path-safe branch slug from a branch name.
 *
 * Lower-cases, replaces any run of non `[a-z0-9]` characters (including `/`
 * from `feature/x` branch names) with a single `-`, trims leading/trailing
 * `-`, and truncates to a DNS-label-safe length. Used to build the
 * `/branch/<slug>/` publish path so arbitrary branch names never introduce
 * unsafe path segments.
 * @param branchName Raw branch name, e.g. `feature/My Branch`.
 * @returns The derived slug, e.g. `feature-my-branch`.
 */
export function slugifyBranch(branchName) {
  if (typeof branchName !== 'string' || branchName.trim() === '') {
    throw new Error(`Invalid branch name: ${JSON.stringify(branchName)}`);
  }

  const slug = branchName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');

  if (slug === '') {
    throw new Error(`Branch name ${JSON.stringify(branchName)} produces an empty slug.`);
  }

  return validateBranchSlug(slug);
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
