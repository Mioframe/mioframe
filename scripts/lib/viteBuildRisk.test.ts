import { describe, expect, it } from 'vitest';

import { isApplicationViteHarnessInputPath, isSharedViteBuildInputPath } from './viteBuildRisk.ts';

describe('isSharedViteBuildInputPath', () => {
  it.each([
    'vite.config.ts',
    'postcss.config.js',
    '.browserslistrc',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.src.json',
    'tsconfig.storybook.json',
    'config/alias.ts',
    'config/plugins/base.ts',
    'config/plugins/pwa.ts',
    'config/vueCustomElements.ts',
    'config/tooling.json',
    'public/favicon.svg',
    'public/manifest.webmanifest',
  ])('classifies %s as a shared Vite build input', (filePath) => {
    expect(isSharedViteBuildInputPath(filePath)).toBe(true);
  });

  it('excludes deterministic test/spec/story/test-helper files under config/**', () => {
    expect(isSharedViteBuildInputPath('config/plugins/base.test.ts')).toBe(false);
    expect(isSharedViteBuildInputPath('config/vueCustomElements.test.ts')).toBe(false);
    expect(isSharedViteBuildInputPath('config/plugins/base.stories.ts')).toBe(false);
    expect(isSharedViteBuildInputPath('config/testHelper.testUtils.ts')).toBe(false);
  });

  it('does not classify a nested tsconfig*.json path as a root tsconfig', () => {
    expect(isSharedViteBuildInputPath('some/nested/tsconfig.json')).toBe(false);
  });

  it('does not classify the application-harness-only inputs', () => {
    expect(isSharedViteBuildInputPath('index.html')).toBe(false);
    expect(isSharedViteBuildInputPath('pwa-assets.config.ts')).toBe(false);
  });

  it('does not classify ordinary production src/** as a shared Vite build input', () => {
    expect(isSharedViteBuildInputPath('src/features/documentCreate/index.ts')).toBe(false);
  });

  it('does not classify an unrelated path', () => {
    expect(isSharedViteBuildInputPath('docs/testing/architecture.md')).toBe(false);
  });
});

describe('isApplicationViteHarnessInputPath', () => {
  it('includes every shared Vite build input', () => {
    expect(isApplicationViteHarnessInputPath('vite.config.ts')).toBe(true);
    expect(isApplicationViteHarnessInputPath('postcss.config.js')).toBe(true);
    expect(isApplicationViteHarnessInputPath('.browserslistrc')).toBe(true);
    expect(isApplicationViteHarnessInputPath('tsconfig.json')).toBe(true);
    expect(isApplicationViteHarnessInputPath('config/alias.ts')).toBe(true);
    expect(isApplicationViteHarnessInputPath('public/favicon.svg')).toBe(true);
  });

  it.each(['index.html', 'pwa-assets.config.ts'])(
    'classifies %s as an application Vite harness input',
    (filePath) => {
      expect(isApplicationViteHarnessInputPath(filePath)).toBe(true);
    },
  );

  it('excludes deterministic test/spec/story/test-helper files under config/**', () => {
    expect(isApplicationViteHarnessInputPath('config/plugins/base.test.ts')).toBe(false);
  });

  it('does not classify ordinary production src/** as an application Vite harness input', () => {
    expect(isApplicationViteHarnessInputPath('src/features/documentCreate/index.ts')).toBe(false);
  });

  it('does not classify an unrelated path', () => {
    expect(isApplicationViteHarnessInputPath('docs/testing/architecture.md')).toBe(false);
  });
});
