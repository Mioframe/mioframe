import { describe, expect, it, vi } from 'vitest';

import { validateReleaseConfig } from './validateReleaseConfig.mjs';

describe('validateReleaseConfig', () => {
  const baseDeps = () => ({
    readFile: vi.fn((filePath) => {
      if (filePath === 'package.json') {
        return JSON.stringify({ name: 'mioframe' });
      }

      if (filePath === 'config/tooling.json') {
        return JSON.stringify({ release: { basePath: '/mioframe/' } });
      }

      throw new Error(`unexpected readFile: ${filePath}`);
    }),
    log: vi.fn(),
    logError: vi.fn(),
  });

  it('passes with a matching base path, PWA enabled, and no env set', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: {}, deps });
    expect(result).toBe(true);
    expect(deps.logError).not.toHaveBeenCalled();
  });

  it('fails when release.basePath does not match package.json name', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn((filePath) => {
      if (filePath === 'package.json') return JSON.stringify({ name: 'mioframe' });
      if (filePath === 'config/tooling.json') {
        return JSON.stringify({ release: { basePath: '/wrong/' } });
      }
      throw new Error(`unexpected readFile: ${filePath}`);
    });
    const result = validateReleaseConfig({ env: {}, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('does not match "/mioframe/"'),
    );
  });

  it('fails when release.basePath is missing', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn((filePath) => {
      if (filePath === 'package.json') return JSON.stringify({ name: 'mioframe' });
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

  it('fails when BASE_URL looks like a PR preview path', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { BASE_URL: '/mioframe/pr-42/' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(expect.stringContaining('PR preview path'));
  });

  it('fails when BASE_URL does not match the configured release base path', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { BASE_URL: '/other/' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('does not match config/tooling.json release.basePath'),
    );
  });

  it('passes when BASE_URL matches the configured release base path', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { BASE_URL: '/mioframe/' }, deps });
    expect(result).toBe(true);
  });

  it('fails when an optional env var is set but empty', () => {
    const deps = baseDeps();
    const result = validateReleaseConfig({ env: { VITE_SENTRY_DSN: '' }, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('VITE_SENTRY_DSN is set but empty'),
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
