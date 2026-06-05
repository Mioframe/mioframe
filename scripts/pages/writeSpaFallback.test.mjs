import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSpaFallbackHtml, classifySpaPath, writeSpaFallback } from './writeSpaFallback.mjs';

describe('classifySpaPath', () => {
  it('redirects a stable deep link to the base root', () => {
    expect(classifySpaPath('/mioframe/home', '/mioframe/')).toBe('/mioframe/');
  });

  it('redirects a stable nested path to the base root', () => {
    expect(classifySpaPath('/mioframe/settings/documents', '/mioframe/')).toBe('/mioframe/');
  });

  it('redirects a PR preview path to its own root', () => {
    expect(classifySpaPath('/mioframe/pr-86/home', '/mioframe/')).toBe('/mioframe/pr-86/');
  });

  it('redirects a deeply nested PR preview path to its own root', () => {
    expect(classifySpaPath('/mioframe/pr-86/settings/documents', '/mioframe/')).toBe(
      '/mioframe/pr-86/',
    );
  });

  it('handles different PR numbers without hard-coding', () => {
    expect(classifySpaPath('/mioframe/pr-1/page', '/mioframe/')).toBe('/mioframe/pr-1/');
    expect(classifySpaPath('/mioframe/pr-999/page', '/mioframe/')).toBe('/mioframe/pr-999/');
    expect(classifySpaPath('/mioframe/pr-123/a/b/c', '/mioframe/')).toBe('/mioframe/pr-123/');
  });

  it('returns null for paths outside the repository base (genuine 404)', () => {
    expect(classifySpaPath('/other/path', '/mioframe/')).toBeNull();
    expect(classifySpaPath('/', '/mioframe/')).toBeNull();
    expect(classifySpaPath('/different-repo/home', '/mioframe/')).toBeNull();
  });

  it('handles a different base path', () => {
    expect(classifySpaPath('/other-repo/home', '/other-repo/')).toBe('/other-repo/');
    expect(classifySpaPath('/other-repo/pr-42/page', '/other-repo/')).toBe('/other-repo/pr-42/');
  });

  it('redirects the base root itself to base (no infinite loop risk)', () => {
    expect(classifySpaPath('/mioframe/', '/mioframe/')).toBe('/mioframe/');
  });
});

describe('buildSpaFallbackHtml', () => {
  it('contains the base path as a literal string', () => {
    const html = buildSpaFallbackHtml('/mioframe/');
    expect(html).toContain('"/mioframe/"');
  });

  it('does not hard-code a specific PR number', () => {
    const html = buildSpaFallbackHtml('/mioframe/');
    expect(html).not.toMatch(/pr-\d+/);
  });

  it('uses a different base when one is provided', () => {
    const html = buildSpaFallbackHtml('/other-repo/');
    expect(html).toContain('"/other-repo/"');
    expect(html).not.toContain('"/mioframe/"');
  });

  it('stores the original path in sessionStorage for restoration', () => {
    const html = buildSpaFallbackHtml('/mioframe/');
    expect(html).toContain("sessionStorage.setItem('ghPagesSpaFallback'");
  });

  it('redirects to PR preview root when path matches pr-N pattern', () => {
    const html = buildSpaFallbackHtml('/mioframe/');
    expect(html).toContain("base + prMatch[1] + '/'");
  });

  it('falls back to base root for stable paths', () => {
    const html = buildSpaFallbackHtml('/mioframe/');
    expect(html).toContain('var targetRoot = prMatch ? base + prMatch[1] +');
  });

  it('exits without redirecting when path is outside the base', () => {
    const html = buildSpaFallbackHtml('/mioframe/');
    expect(html).toContain('if (!path.startsWith(base))');
    expect(html).toContain('return;');
  });

  it('produces valid HTML', () => {
    const html = buildSpaFallbackHtml('/mioframe/');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('</html>');
  });
});

describe('writeSpaFallback', () => {
  let outputDir = '';

  beforeEach(() => {
    outputDir = mkdtempSync(join(tmpdir(), 'spa-fallback-'));
  });

  afterEach(() => {
    rmSync(outputDir, { recursive: true, force: true });
  });

  it('writes a 404.html to the output directory', () => {
    writeSpaFallback(['--base', '/mioframe/', '--output-dir', outputDir]);
    const content = readFileSync(join(outputDir, '404.html'), 'utf8');
    expect(content).toContain('<!doctype html>');
    expect(content).toContain('"/mioframe/"');
  });

  it('bakes the provided base path into the file', () => {
    writeSpaFallback(['--base', '/custom-repo/', '--output-dir', outputDir]);
    const content = readFileSync(join(outputDir, '404.html'), 'utf8');
    expect(content).toContain('"/custom-repo/"');
  });

  it('throws when --base is missing', () => {
    expect(() => writeSpaFallback(['--output-dir', outputDir])).toThrow('Usage:');
  });

  it('throws when --output-dir is missing', () => {
    expect(() => writeSpaFallback(['--base', '/mioframe/'])).toThrow('Usage:');
  });
});
