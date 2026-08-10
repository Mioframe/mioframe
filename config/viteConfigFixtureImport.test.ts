// @vitest-environment node
// This test only reads and pattern-matches a source file on disk; the
// default happy-dom environment's URL implementation rejects the resulting
// file:// URL.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Normal stable, develop, branch, PR, local, and Storybook builds must never
// carry a static dependency on the frozen legacy PWA test fixture (see
// tests/e2e/release/fixtures/legacyGeneratedWorkboxPwaConfig.ts) — only
// tests/e2e/release/managedUpdatesMigration.spec.ts, through the
// RELEASE_TEST_LEGACY_PWA_FIXTURE-gated dynamic import, may resolve it.
describe('vite.config.ts has no static production dependency on the release-test fixture', () => {
  const source = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

  it('does not statically import the frozen legacy PWA fixture', () => {
    const staticImportPattern =
      /^\s*import[^;]*from\s+['"][^'"]*legacyGeneratedWorkboxPwaConfig['"];?\s*$/m;
    expect(staticImportPattern.test(source)).toBe(false);
  });

  it('only references the fixture through a gated dynamic import', () => {
    const dynamicImportPattern = /await import\(\s*['"][^'"]*legacyGeneratedWorkboxPwaConfig['"]/;
    expect(dynamicImportPattern.test(source)).toBe(true);
    expect(source).toContain("process.env.RELEASE_TEST_LEGACY_PWA_FIXTURE === '1'");
  });
});
