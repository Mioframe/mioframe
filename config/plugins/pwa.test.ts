import { describe, expect, it } from 'vitest';

import { buildPrPreviewDenylistPattern, getPwaPlugins, isPrPreviewPath } from './pwa.ts';

describe('isPrPreviewPath', () => {
  describe('PR preview paths return true', () => {
    it('matches root PR preview path without trailing slash', () => {
      expect(isPrPreviewPath('/mioframe/pr-86', '/mioframe/')).toBe(true);
    });

    it('matches root PR preview path with trailing slash', () => {
      expect(isPrPreviewPath('/mioframe/pr-86/', '/mioframe/')).toBe(true);
    });

    it('matches nested assets under a PR preview', () => {
      expect(isPrPreviewPath('/mioframe/pr-86/assets/app.js', '/mioframe/')).toBe(true);
    });

    it('matches arbitrary PR numbers', () => {
      expect(isPrPreviewPath('/mioframe/pr-1/', '/mioframe/')).toBe(true);
      expect(isPrPreviewPath('/mioframe/pr-999/', '/mioframe/')).toBe(true);
    });

    it('matches under a different base path', () => {
      expect(isPrPreviewPath('/other-repo/pr-42/', '/other-repo/')).toBe(true);
      expect(isPrPreviewPath('/other-repo/pr-42/assets/main.css', '/other-repo/')).toBe(true);
    });
  });

  describe('stable paths return false', () => {
    it('does not match the stable root path', () => {
      expect(isPrPreviewPath('/mioframe/', '/mioframe/')).toBe(false);
    });

    it('does not match stable asset paths', () => {
      expect(isPrPreviewPath('/mioframe/assets/app.js', '/mioframe/')).toBe(false);
    });

    it('does not match a path that starts with pr- but has no digits', () => {
      expect(isPrPreviewPath('/mioframe/pr-preview/', '/mioframe/')).toBe(false);
    });

    it('does not match paths outside the configured base', () => {
      expect(isPrPreviewPath('/other/pr-86/', '/mioframe/')).toBe(false);
    });

    it('does not match the stable index.html', () => {
      expect(isPrPreviewPath('/mioframe/index.html', '/mioframe/')).toBe(false);
    });
  });

  describe('full URL scenario via url.pathname', () => {
    it('correctly excludes PR preview when called with url.pathname from a full URL', () => {
      const url = new URL('https://vyachean.github.io/mioframe/pr-86/assets/app.js');
      expect(isPrPreviewPath(url.pathname, '/mioframe/')).toBe(true);
    });

    it('does not exclude stable paths when called with url.pathname from a full URL', () => {
      const url = new URL('https://vyachean.github.io/mioframe/assets/app.js');
      expect(isPrPreviewPath(url.pathname, '/mioframe/')).toBe(false);
    });
  });
});

describe('buildPrPreviewDenylistPattern', () => {
  describe('PR preview paths are matched (should be denied)', () => {
    it('matches a root PR preview path without trailing slash', () => {
      const pattern = buildPrPreviewDenylistPattern('/mioframe/');
      expect(pattern.test('/mioframe/pr-86')).toBe(true);
    });

    it('matches a root PR preview path with trailing slash', () => {
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
