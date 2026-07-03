import { describe, expect, it } from 'vitest';

import { slugifyBranch, validateBranchSlug, validatePrNumber } from './slug.mjs';

describe('slugifyBranch', () => {
  it('lower-cases a simple branch name', () => {
    expect(slugifyBranch('Develop')).toBe('develop');
  });

  it('replaces slashes with dashes', () => {
    expect(slugifyBranch('feature/my-thing')).toBe('feature-my-thing');
  });

  it('replaces spaces and other unsafe characters with dashes', () => {
    expect(slugifyBranch('fix/Weird Branch@Name!')).toBe('fix-weird-branch-name');
  });

  it('collapses consecutive unsafe characters into a single dash', () => {
    expect(slugifyBranch('a///b')).toBe('a-b');
  });

  it('trims leading and trailing dashes', () => {
    expect(slugifyBranch('-leading-and-trailing-')).toBe('leading-and-trailing');
  });

  it('truncates very long branch names to a DNS-label-safe length', () => {
    const longName = 'feature/' + 'x'.repeat(100);
    const slug = slugifyBranch(longName);
    expect(slug.length).toBeLessThanOrEqual(63);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('throws for an empty branch name', () => {
    expect(() => slugifyBranch('')).toThrow('Invalid branch name');
  });

  it('throws for a branch name that produces an empty slug', () => {
    expect(() => slugifyBranch('///')).toThrow('produces an empty slug');
  });

  it('throws for a branch name that slugifies to a reserved namespace', () => {
    expect(() => slugifyBranch('branch')).toThrow('is reserved');
    expect(() => slugifyBranch('pr')).toThrow('is reserved');
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
