import { describe, expect, it } from 'vitest';

import { slugifyBranch, validateBranchSlug, validatePrNumber } from './slug.mjs';

const HASH_SUFFIX_PATTERN = /-[0-9a-f]{8}$/;

describe('slugifyBranch', () => {
  it('maps the literal "develop" branch to the bare "develop" slug', () => {
    expect(slugifyBranch('develop')).toBe('develop');
  });

  it('does not bare-map a differently-cased "develop" variant, to avoid colliding with the real develop branch', () => {
    const slug = slugifyBranch('Develop');
    expect(slug).not.toBe('develop');
    expect(slug).toMatch(/^develop-[0-9a-f]{8}$/);
  });

  it('replaces slashes with dashes and appends a hash suffix', () => {
    expect(slugifyBranch('feature/my-thing')).toMatch(/^feature-my-thing-[0-9a-f]{8}$/);
  });

  it('replaces spaces and other unsafe characters with dashes', () => {
    expect(slugifyBranch('fix/Weird Branch@Name!')).toMatch(/^fix-weird-branch-name-[0-9a-f]{8}$/);
  });

  it('collapses consecutive unsafe characters into a single dash', () => {
    expect(slugifyBranch('a///b')).toMatch(/^a-b-[0-9a-f]{8}$/);
  });

  it('trims leading and trailing dashes from the normalized prefix', () => {
    expect(slugifyBranch('-leading-and-trailing-')).toMatch(/^leading-and-trailing-[0-9a-f]{8}$/);
  });

  it('is deterministic for the same branch name', () => {
    expect(slugifyBranch('feature/my-thing')).toBe(slugifyBranch('feature/my-thing'));
  });

  it('truncates very long branch names to a DNS-label-safe length while keeping the hash suffix', () => {
    const longName = 'feature/' + 'x'.repeat(100);
    const slug = slugifyBranch(longName);
    expect(slug.length).toBeLessThanOrEqual(63);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug).toMatch(HASH_SUFFIX_PATTERN);
  });

  it('throws for an empty branch name', () => {
    expect(() => slugifyBranch('')).toThrow('Invalid branch name');
  });

  it('throws for a branch name that produces an empty normalized prefix', () => {
    expect(() => slugifyBranch('///')).toThrow('produces an empty slug');
  });

  it('produces a non-reserved hashed slug for a branch literally named "branch" or "pr"', () => {
    // Unlike the reserved bare `branch`/`pr` namespace roots, a branch
    // literally named this way always gets a hash suffix, so it can never
    // collide with the reserved namespace.
    expect(slugifyBranch('branch')).toMatch(/^branch-[0-9a-f]{8}$/);
    expect(slugifyBranch('pr')).toMatch(/^pr-[0-9a-f]{8}$/);
  });

  describe('collision safety', () => {
    it('produces distinct slugs for branch names that normalize to the same prefix', () => {
      const slugSlash = slugifyBranch('feature/a');
      const slugDash = slugifyBranch('feature-a');
      const slugUnderscore = slugifyBranch('feature_a');

      expect(slugSlash).toMatch(/^feature-a-[0-9a-f]{8}$/);
      expect(slugDash).toMatch(/^feature-a-[0-9a-f]{8}$/);
      expect(slugUnderscore).toMatch(/^feature-a-[0-9a-f]{8}$/);

      const slugs = new Set([slugSlash, slugDash, slugUnderscore]);
      expect(slugs.size).toBe(3);
    });

    it('produces distinct slugs for long branch names that collide after truncation', () => {
      const longNameA = 'feature/' + 'x'.repeat(100) + '-a';
      const longNameB = 'feature/' + 'x'.repeat(100) + '-b';

      expect(slugifyBranch(longNameA)).not.toBe(slugifyBranch(longNameB));
    });
  });
});

describe('validateBranchSlug', () => {
  it('accepts a valid slug', () => {
    expect(validateBranchSlug('develop')).toBe('develop');
    expect(validateBranchSlug('feature-123')).toBe('feature-123');
  });

  it('rejects uppercase characters', () => {
    expect(() => validateBranchSlug('Develop')).toThrow('Invalid branch slug');
  });

  it('rejects a slug with a path separator', () => {
    expect(() => validateBranchSlug('../etc')).toThrow('Invalid branch slug');
    expect(() => validateBranchSlug('a/b')).toThrow('Invalid branch slug');
  });

  it('rejects a slug starting or ending with a dash', () => {
    expect(() => validateBranchSlug('-foo')).toThrow('Invalid branch slug');
    expect(() => validateBranchSlug('foo-')).toThrow('Invalid branch slug');
  });

  it('rejects an empty slug', () => {
    expect(() => validateBranchSlug('')).toThrow('Invalid branch slug');
  });

  it('rejects the reserved "branch" and "pr" namespaces', () => {
    expect(() => validateBranchSlug('branch')).toThrow('is reserved');
    expect(() => validateBranchSlug('pr')).toThrow('is reserved');
  });
});

describe('validatePrNumber', () => {
  it('accepts valid PR numbers', () => {
    expect(validatePrNumber('1')).toBe('1');
    expect(validatePrNumber('42')).toBe('42');
    expect(validatePrNumber('9999')).toBe('9999');
  });

  it('rejects zero', () => {
    expect(() => validatePrNumber('0')).toThrow('Invalid PR number: 0');
  });

  it('rejects non-numeric strings', () => {
    expect(() => validatePrNumber('abc')).toThrow('Invalid PR number: abc');
    expect(() => validatePrNumber('1a')).toThrow('Invalid PR number: 1a');
  });

  it('rejects strings with path separators', () => {
    expect(() => validatePrNumber('../42')).toThrow();
    expect(() => validatePrNumber('1/2')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validatePrNumber('')).toThrow();
  });
});
