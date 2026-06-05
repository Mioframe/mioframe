import { describe, expect, it } from 'vitest';

import { buildPrPreviewDenylistPattern, getPwaPlugins } from './pwa.ts';

describe('buildPrPreviewDenylistPattern', () => {
  describe('PR preview paths are matched (should be denied)', () => {
    it('matches a root PR preview path', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/pr-86/')).toBe(true);
    });

    it('matches nested assets under a PR preview', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/pr-86/assets/app.js')).toBe(true);
    });

    it('matches index.html under a PR preview', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/pr-86/index.html')).toBe(true);
    });

    it('matches arbitrary PR numbers', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/pr-1/')).toBe(true);
      expect(pattern.test('/mioframe/pr-999/')).toBe(true);
    });

    it('matches under a different base path', () => {
      const pattern = buildPrPreviewDenylistPattern('/other-repo/');
      expect(pattern.test('/other-repo/pr-42/')).toBe(true);
      expect(pattern.test('/other-repo/pr-42/assets/main.css')).toBe(true);
    });
  });

  describe('stable paths are not matched (should not be denied)', () => {
    it('does not match the stable root path', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/')).toBe(false);
    });

    it('does not match a normal stable page path', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/index.html')).toBe(false);
    });

    it('does not match stable asset paths', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/assets/app.js')).toBe(false);
    });

    it('does not match a path that starts with pr- but has no digits', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/pr-preview/')).toBe(false);
    });

    it('does not match paths outside the base', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/other/pr-86/')).toBe(false);
    });
  });
});

describe('getPwaPlugins', () => {
  it('returns empty array when disablePwa is true (PR preview builds)', () => {
    const plugins = getPwaPlugins({
      base: '/mioframe/',
      isPreview: false,
      mode: 'production',
      disablePwa: true,
    });
    expect(plugins).toHaveLength(0);
  });

  it('returns empty array when disablePwa is true even in production mode', () => {
    const plugins = getPwaPlugins({
      base: '/mioframe/',
      isPreview: false,
      mode: 'production',
      disablePwa: true,
    });
    expect(plugins).toHaveLength(0);
  });

  it('returns plugins in production mode without disablePwa', () => {
    const plugins = getPwaPlugins({
      base: '/mioframe/',
      isPreview: false,
      mode: 'production',
    });
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('returns empty array in development mode without isPreview', () => {
    const plugins = getPwaPlugins({
      base: '/mioframe/',
      isPreview: false,
      mode: 'development',
    });
    expect(plugins).toHaveLength(0);
  });
});
