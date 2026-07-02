import { describe, expect, it } from 'vitest';

import { resolveArtifactBasePath, resolveArtifactDistDir } from './buildArtifact.mjs';

describe('resolveArtifactBasePath', () => {
  it('uses the tooling.json release base path by default', () => {
    expect(resolveArtifactBasePath([], {})).toBe('/mioframe/');
  });

  it('prefers an explicit --base flag', () => {
    expect(resolveArtifactBasePath(['--base', '/custom/'], { BASE_URL: '/env/' })).toBe('/custom/');
  });

  it('falls back to the BASE_URL environment variable', () => {
    expect(resolveArtifactBasePath([], { BASE_URL: '/env/' })).toBe('/env/');
  });
});

describe('resolveArtifactDistDir', () => {
  it('defaults to dist', () => {
    expect(resolveArtifactDistDir([])).toBe('dist');
  });

  it('uses an explicit --dist flag', () => {
    expect(resolveArtifactDistDir(['--dist', 'custom-dist'])).toBe('custom-dist');
  });
});
