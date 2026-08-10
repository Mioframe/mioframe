// @vitest-environment node
// This test reads config/tooling.json via a file:// URL derived from
// import.meta.url; the default happy-dom environment's URL implementation
// rejects it (see config/viteConfigFixtureImport.test.ts).
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import viteConfig from '../../vite.config.ts';

const toolingConfig = JSON.parse(
  readFileSync(new URL('../../config/tooling.json', import.meta.url), 'utf8'),
);

// Managed stable/develop publication passes one canonical committer
// timestamp to Vite as VITE_BUILD_DATE (see docs/managed-pinned-updates.md,
// "Deterministic build inputs"); every other build keeps wall-clock
// __BUILD_DATE__, and Storybook keeps its own frozen deterministic date.
// `mode: 'test'` with `isPreview: false` keeps every plugin getter
// (PWA/Sentry/SSL) on its already-empty-array branch, so this resolves the
// real config function without any plugin side effects (cert generation,
// manifest builds, Sentry uploads). Kept as a plain script (not under
// config/**/*.ts) so importing vite.config.ts here does not pull it into
// tsconfig.storybook.json's separate project, which does not list it.
describe('vite.config.ts __BUILD_DATE__ resolution', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    delete process.env.VITE_BUILD_DATE;
    delete process.env.APP_STORYBOOK;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.useRealTimers();
  });

  function resolveBuildDateDefine() {
    const config = viteConfig({
      mode: 'test',
      command: 'build',
      isPreview: false,
      isSsrBuild: false,
    });
    const value = config.define?.__BUILD_DATE__;
    if (typeof value !== 'string') {
      throw new Error('vite.config.ts did not resolve a __BUILD_DATE__ define string');
    }
    return value;
  }

  it('uses the explicit VITE_BUILD_DATE value when provided', () => {
    process.env.VITE_BUILD_DATE = '2026-07-24T00:00:00.000Z';

    expect(resolveBuildDateDefine()).toBe(JSON.stringify('2026-07-24T00:00:00.000Z'));
  });

  it('falls back to build-time wall-clock date for a normal non-managed build without VITE_BUILD_DATE', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'));

    expect(resolveBuildDateDefine()).toBe(JSON.stringify('2026-01-02T03:04:05.000Z'));
  });

  it('uses the frozen deterministic Storybook build date regardless of VITE_BUILD_DATE', () => {
    process.env.APP_STORYBOOK = '1';
    process.env.VITE_BUILD_DATE = '2026-07-24T00:00:00.000Z';

    expect(resolveBuildDateDefine()).toBe(
      JSON.stringify(toolingConfig.storybook.deterministicBuildDate),
    );
  });
});
