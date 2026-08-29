import { describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import { resolveReleaseStaticPlan } from './releaseStaticRisk.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

describe('resolveReleaseStaticPlan', () => {
  it('skips every leaf for an unrelated change', () => {
    const plan = resolveReleaseStaticPlan(['docs/testing/architecture.md']);

    expect(plan).toEqual({
      mode: 'skip',
      releaseConfig: false,
      build: false,
      publisherNodeImport: false,
      artifactStatic: false,
      managedUpdatesStatic: false,
      reasons: ['no release-sensitive static changes'],
    });
  });

  it('selects build and artifact-static for an ordinary production src/** change', () => {
    const plan = resolveReleaseStaticPlan(['src/features/documentCreate/index.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(false);
  });

  it('selects build and artifact-static for a non-TypeScript Vite-consumed production asset', () => {
    const plan = resolveReleaseStaticPlan(['src/features/documentCreate/icon.svg']);

    expect(plan.mode).toBe('focused');
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
  });

  it('does not select build/artifact-static for a colocated unit test, story, or behavior/visual/browser-integration spec', () => {
    expect(resolveReleaseStaticPlan(['src/features/documentCreate/index.test.ts']).mode).toBe(
      'skip',
    );
    expect(resolveReleaseStaticPlan(['src/features/documentCreate/index.stories.ts']).mode).toBe(
      'skip',
    );
    expect(
      resolveReleaseStaticPlan(['src/features/documentCreate/index.behavior.spec.ts']).mode,
    ).toBe('skip');
    expect(
      resolveReleaseStaticPlan(['src/features/documentCreate/index.visual.spec.ts']).mode,
    ).toBe('skip');
    expect(
      resolveReleaseStaticPlan(['src/features/documentCreate/index.browser-integration.spec.ts'])
        .mode,
    ).toBe('skip');
    expect(resolveReleaseStaticPlan(['src/features/documentCreate/index.testUtils.ts']).mode).toBe(
      'skip',
    );
  });

  it('skips for an empty changed-file list', () => {
    const plan = resolveReleaseStaticPlan([]);

    expect(plan.mode).toBe('skip');
  });

  it('selects no release-sensitive static leaf for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveReleaseStaticPlan(['package.json']);

    expect(plan.mode).toBe('skip');
    expect(plan.releaseConfig).toBe(false);
    expect(plan.build).toBe(false);
    expect(plan.publisherNodeImport).toBe(false);
    expect(plan.artifactStatic).toBe(false);
    expect(plan.managedUpdatesStatic).toBe(false);
  });

  it('widens build/artifact-static/managed-updates-static for a runtime-relevant package.json change, without requiring release-version selection', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveReleaseStaticPlan(['package.json']);

    expect(plan.mode).toBe('focused');
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(true);
  });

  it.each([
    'scripts/release/validateVersion.mjs',
    'scripts/release/versionPolicy.mjs',
    'docs/release.md',
    'docs/release-checklist.md',
    'docs/releases/2026-08-27.md',
  ])('selects no release-sensitive static leaf for a version-policy input: %s', (filePath) => {
    const plan = resolveReleaseStaticPlan([filePath]);

    expect(plan.mode).toBe('skip');
    expect(plan.releaseConfig).toBe(false);
    expect(plan.build).toBe(false);
    expect(plan.publisherNodeImport).toBe(false);
    expect(plan.artifactStatic).toBe(false);
    expect(plan.managedUpdatesStatic).toBe(false);
  });

  it('widens build/artifact-static/managed-updates-static for a pnpm-lock.yaml change', () => {
    const plan = resolveReleaseStaticPlan(['pnpm-lock.yaml']);

    expect(plan.mode).toBe('focused');
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(true);
  });

  it('selects release-config plus build/artifact-static for a config/tooling.json change', () => {
    const plan = resolveReleaseStaticPlan(['config/tooling.json']);

    expect(plan.mode).toBe('focused');
    expect(plan.releaseConfig).toBe(true);
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(false);
  });

  it('selects build and artifact-static for a vite.config.ts change', () => {
    const plan = resolveReleaseStaticPlan(['vite.config.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.releaseConfig).toBe(false);
    expect(plan.managedUpdatesStatic).toBe(false);
  });

  it('selects build and artifact-static for the current real Vite config dependency classes', () => {
    for (const filePath of [
      'config/alias.ts',
      'config/plugins/base.ts',
      'config/plugins/pwa.ts',
      'config/plugins/sentry.ts',
      'config/vueCustomElements.ts',
      '.browserslistrc',
      'index.html',
      'public/favicon.svg',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.src.json',
      'postcss.config.js',
      'pwa-assets.config.ts',
    ]) {
      const plan = resolveReleaseStaticPlan([filePath]);

      expect(plan.mode, `${filePath} -> focused`).toBe('focused');
      expect(plan.build, `${filePath} -> build`).toBe(true);
      expect(plan.artifactStatic, `${filePath} -> artifact-static`).toBe(true);
    }
  });

  it('does not select build/artifact-static for a proof-only file under config/**', () => {
    expect(resolveReleaseStaticPlan(['config/plugins/base.test.ts']).mode).toBe('skip');
    expect(resolveReleaseStaticPlan(['config/vueCustomElements.test.ts']).mode).toBe('skip');
    expect(resolveReleaseStaticPlan(['config/postcss.config.test.ts']).mode).toBe('skip');
  });

  it('does not select build/artifact-static for a nested tsconfig*.json path', () => {
    const plan = resolveReleaseStaticPlan(['some/nested/tsconfig.json']);

    expect(plan.mode).toBe('skip');
  });

  it('selects only publisher-node-import for a publisher implementation change', () => {
    const plan = resolveReleaseStaticPlan(['scripts/pages/lib/releasePublish.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.publisherNodeImport).toBe(true);
    expect(plan.build).toBe(false);
  });

  it('selects publisher-node-import for the release wire contract change', () => {
    const plan = resolveReleaseStaticPlan(['src/shared/service/appUpdate/releaseWireContract.ts']);

    expect(plan.publisherNodeImport).toBe(true);
    // The wire contract also lives under the appUpdate production directory,
    // so it is capable of changing worker byte identity too.
    expect(plan.managedUpdatesStatic).toBe(true);
    expect(plan.build).toBe(true);
  });

  it('selects build and artifact-static for src/sw.ts', () => {
    const plan = resolveReleaseStaticPlan(['src/sw.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(true);
  });

  it('selects build, artifact-static, and managed-updates-static for an appUpdate production source change', () => {
    const plan = resolveReleaseStaticPlan(['src/shared/service/appUpdate/workerInstall.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.build).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(true);
    expect(plan.artifactStatic).toBe(true);
  });

  it('does not select managed-updates-static for an appUpdate test/spec file', () => {
    const plan = resolveReleaseStaticPlan(['src/shared/service/appUpdate/workerInstall.test.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('selects every remaining leaf for a broad infrastructure-style combination', () => {
    const plan = resolveReleaseStaticPlan([
      'package.json',
      'config/tooling.json',
      'scripts/pages/lib/releasePublish.mjs',
      'src/sw.ts',
    ]);
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    expect(plan.releaseConfig).toBe(true);
    expect(plan.publisherNodeImport).toBe(true);
    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(true);
  });

  it('fails closed to runtime-relevant when packageJsonOldRef is unresolved', () => {
    isPackageJsonRuntimeRelevantChange.mockImplementation(({ oldRef } = {}) => oldRef === null);

    const plan = resolveReleaseStaticPlan(['package.json'], { packageJsonOldRef: null });

    expect(plan.build).toBe(true);
    expect(plan.artifactStatic).toBe(true);
    expect(plan.managedUpdatesStatic).toBe(true);
  });

  it.each([
    'scripts/lib/localCommandGuard.ts',
    'scripts/lib/commandLock.ts',
    'scripts/lib/runLocalCommand.ts',
    'scripts/lib/processResult.ts',
    'scripts/lib/signalForward.ts',
  ])(
    'widens build/artifact-static/managed-updates-static for a shared local-command execution change: %s',
    (filePath) => {
      const plan = resolveReleaseStaticPlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.build).toBe(true);
      expect(plan.artifactStatic).toBe(true);
      expect(plan.managedUpdatesStatic).toBe(true);
    },
  );
});
