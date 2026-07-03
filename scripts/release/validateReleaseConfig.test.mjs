import { describe, expect, it, vi } from 'vitest';

import { validateReleaseConfig } from './validateReleaseConfig.mjs';

describe('validateReleaseConfig', () => {
  const baseDeps = () => ({
    readFile: vi.fn((filePath) => {
      if (filePath === 'config/tooling.json') {
        return JSON.stringify({ release: { basePath: '/' } });
      }

      throw new Error(`unexpected readFile: ${filePath}`);
    }),
    log: vi.fn(),
    logError: vi.fn(),
  });

  it('passes with the stable base path, PWA enabled, and no env set', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: {}, deps });
    expect(result).toBe(true);
    expect(deps.logError).not.toHaveBeenCalled();
  });

  it('fails when release.basePath is not "/"', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn((filePath) => {
      if (filePath === 'config/tooling.json') {
        return JSON.stringify({ release: { basePath: '/mioframe/' } });
      }
      throw new Error(`unexpected readFile: ${filePath}`);
    });
    const result = validateReleaseConfig({ env: {}, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(expect.stringContaining('must be "/"'));
  });

  it('fails when release.basePath is missing', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn((filePath) => {
      if (filePath === 'config/tooling.json') return JSON.stringify({ release: {} });
      throw new Error(`unexpected readFile: ${filePath}`);
    });
    const result = validateReleaseConfig({ env: {}, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(expect.stringContaining('missing release.basePath'));
  });

  it('fails when VITE_DISABLE_PWA is 1', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { VITE_DISABLE_PWA: '1' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(expect.stringContaining('VITE_DISABLE_PWA=1'));
  });

  it('fails when BASE_URL looks like a branch path', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { BASE_URL: '/branch/develop/' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('branch or PR preview path'),
    );
  });

  it('fails when BASE_URL looks like a PR preview path', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { BASE_URL: '/pr/42/' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('branch or PR preview path'),
    );
  });

  it('fails when BASE_URL does not match the stable base path', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { BASE_URL: '/other/' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('does not match the stable base path'),
    );
  });

  it('passes when BASE_URL matches the stable base path', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { BASE_URL: '/' }, deps });
    expect(result).toBe(true);
  });

  it('fails when an optional env var is set but empty outside GitHub Actions', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { VITE_SENTRY_DSN: '' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('VITE_SENTRY_DSN is set but empty'),
    );
  });

  it('does not fail when an optional env var is set but empty inside GitHub Actions', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({
      env: { GITHUB_ACTIONS: 'true', VITE_SENTRY_DSN: '' },
      deps,
    });
    expect(result).toBe(true);
    expect(deps.logError).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith(
      expect.stringContaining('VITE_SENTRY_DSN: set but empty in GitHub Actions'),
    );
  });

  it('reports optional env vars as unset without failing', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: {}, deps });
    expect(result).toBe(true);
    expect(deps.log).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GOOGLE_CLIENT_ID: not set'),
    );
  });

  it('notices partial Sentry configuration without failing', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { VITE_SENTRY_DSN: 'https://dsn' }, deps });
    expect(result).toBe(true);
    expect(deps.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'runtime error reporting is enabled, but source maps will not be uploaded',
      ),
    );
  });
});
