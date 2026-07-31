import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// vite.config.ts __BUILD_DATE__ resolution is proven in
// scripts/release/viteBuildDate.test.mjs (a plain script, not a
// config/**/*.ts file): importing vite.config.ts from a file under this
// directory pulls it into tsconfig.storybook.json's separate TypeScript
// project, which does not list vite.config.ts in its file set (TS6307).
describe('vite.config.ts build-date proof location', () => {
  it('is proven in scripts/release/viteBuildDate.test.mjs, not here', () => {
    expect(existsSync('scripts/release/viteBuildDate.test.mjs')).toBe(true);
  });
});
