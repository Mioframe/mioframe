import { describe, expect, it } from 'vitest';

import { buildSpaFallbackHtml, classifySpaPath } from './spaFallback.mjs';

describe('classifySpaPath', () => {
  it('redirects a stable deep link to the site root', () => {
    expect(classifySpaPath('/home')).toBe('/');
    expect(classifySpaPath('/settings/documents')).toBe('/');
  });

  it('redirects the root itself to the root (no infinite loop risk)', () => {
    expect(classifySpaPath('/')).toBe('/');
  });

  it('redirects a branch deep link to its own branch root', () => {
    expect(classifySpaPath('/branch/develop/home')).toBe('/branch/develop/');
    expect(classifySpaPath('/branch/develop/settings/documents')).toBe('/branch/develop/');
  });

  it('redirects a manual branch slug deep link to its own root', () => {
    expect(classifySpaPath('/branch/feature-x/a/b/c')).toBe('/branch/feature-x/');
  });

  it('redirects a PR preview deep link to its own root', () => {
    expect(classifySpaPath('/pr/86/home')).toBe('/pr/86/');
    expect(classifySpaPath('/pr/1/page')).toBe('/pr/1/');
    expect(classifySpaPath('/pr/999/a/b/c')).toBe('/pr/999/');
  });

  it('treats a non-numeric segment after /pr/ as a stable path (genuine unmatched route)', () => {
    expect(classifySpaPath('/pr/preview/page')).toBe('/');
  });

  it('redirects the branch/pr namespace roots themselves without a trailing segment', () => {
    expect(classifySpaPath('/branch/develop')).toBe('/branch/develop/');
    expect(classifySpaPath('/pr/42')).toBe('/pr/42/');
  });
});

describe('buildSpaFallbackHtml', () => {
  it('does not hard-code a specific branch slug or PR number', () => {
    const html = buildSpaFallbackHtml();
    expect(html).not.toMatch(/\/branch\/[a-z0-9-]+\//);
    expect(html).not.toMatch(/\/pr\/\d+\//);
  });

  it('dispatches on /branch/ and /pr/ path prefixes', () => {
    const html = buildSpaFallbackHtml();
    expect(html).toContain('/^\\/branch\\/([^/]+)(?:\\/|$)/');
    expect(html).toContain('/^\\/pr\\/(\\d+)(?:\\/|$)/');
  });

  it('falls back to the root for unmatched paths', () => {
    const html = buildSpaFallbackHtml();
    expect(html).toContain(": '/';");
  });

  it('stores the original path in sessionStorage for restoration', () => {
    const html = buildSpaFallbackHtml();
    expect(html).toContain("sessionStorage.setItem('ghPagesSpaFallback'");
  });

  it('wraps path restoration storage in try/catch as a best-effort step', () => {
    const html = buildSpaFallbackHtml();
    expect(html).toContain('try {');
    expect(html).toContain("sessionStorage.setItem('ghPagesSpaFallback'");
    expect(html).toContain('} catch {');
    expect(html).toContain('// Best-effort path restoration only.');
  });

  it('still redirects after the storage attempt', () => {
    const html = buildSpaFallbackHtml();
    expect(html).toMatch(
      /sessionStorage\.setItem\('ghPagesSpaFallback'[\s\S]*window\.location\.replace\(targetRoot\);/,
    );
  });

  it('stores the hash with the original path when one is present', () => {
    const html = buildSpaFallbackHtml();
    expect(html).toContain('window.location.hash');
  });

  it('produces valid HTML', () => {
    const html = buildSpaFallbackHtml();
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('</html>');
  });

  it('produces identical output regardless of caller (channel-independent)', () => {
    expect(buildSpaFallbackHtml()).toBe(buildSpaFallbackHtml());
  });
});
