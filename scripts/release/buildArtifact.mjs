import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import toolingConfig from '../../config/tooling.json' with { type: 'json' };
import { runGuardedExpensiveLocalCommand } from '../lib/localCommandGuard.mjs';
import { applyProcessResult } from '../lib/processResult.mjs';
import { runLocalCommand } from '../lib/runLocalCommand.mjs';
import {
  buildDeploymentMetadata,
  writeDeploymentMetadataFile,
} from '../pages/lib/deploymentMetadata.mjs';
import { writeStableReleaseArtifact } from '../pages/lib/stableRelease.mjs';
import packageJson from '../../package.json' with { type: 'json' };

const defaultDeps = {
  applyProcessResult,
  runGuardedExpensiveLocalCommand,
  runLocalCommand,
};

/**
 * Resolve the GitHub Pages base path for a release artifact build.
 * @param [argv] Raw CLI arguments.
 * @param [env] Process environment.
 * @returns Resolved base path, e.g. `/`.
 */
export function resolveArtifactBasePath(argv = process.argv.slice(2), env = process.env) {
  const baseIndex = argv.indexOf('--base');

  if (baseIndex !== -1 && argv[baseIndex + 1]) {
    return argv[baseIndex + 1];
  }

  if (env.BASE_URL) {
    return env.BASE_URL;
  }

  return toolingConfig.release.basePath;
}

/**
 * Resolve the `vite build` output directory for a release artifact build.
 * @param [argv] Raw CLI arguments.
 * @returns Resolved dist directory, defaults to `dist`.
 */
export function resolveArtifactDistDir(argv = process.argv.slice(2)) {
  const distIndex = argv.indexOf('--dist');

  if (distIndex !== -1 && argv[distIndex + 1]) {
    return argv[distIndex + 1];
  }

  return 'dist';
}

/**
 * Build the production artifact used by release artifact/smoke verification:
 * a real `vite build` under the GitHub Pages base path, followed by the same
 * `dist/index.html` -> `dist/404.html` copy the stable deploy job performs.
 *
 * When `RELEASE_ARTIFACT_SKIP_BUILD=1` is set, this reuses an existing
 * `dist/index.html` instead of rebuilding. `scripts/verify.mjs` sets this for
 * the `artifact`/`release-smoke` release-only checks only when the earlier
 * `build` check already produced a fresh artifact in the same run, so a
 * single `pnpm verify:release` run does not build the production artifact
 * three times (once per check that needs it). Standalone invocations (e.g.
 * `pnpm e2e:release`, `pnpm verify --full --only artifact`) never set this
 * flag and always build their own artifact.
 * @param [argv] Raw CLI arguments.
 * @param [deps] Test seams for guarded execution and result handling.
 * @param [env] Process environment, for the reuse-if-prebuilt test seam.
 */
export async function runBuildArtifact(
  argv = process.argv.slice(2),
  deps = defaultDeps,
  env = process.env,
) {
  const basePath = resolveArtifactBasePath(argv, env);
  const distDir = resolveArtifactDistDir(argv);
  const indexPath = join(distDir, 'index.html');

  if (env.RELEASE_ARTIFACT_SKIP_BUILD === '1') {
    if (!existsSync(indexPath)) {
      console.error(
        `RELEASE_ARTIFACT_SKIP_BUILD=1 was set, but no existing production build was found at ${indexPath}. ` +
          'Rerun without RELEASE_ARTIFACT_SKIP_BUILD so this step builds the artifact itself.',
      );
      process.exitCode = 1;
      return;
    }

    copyFileSync(indexPath, join(distDir, '404.html'));
    console.log(`Reusing existing production artifact at ${distDir} (base ${basePath}).`);
    return;
  }

  // Invoke the local vite binary directly (not `pnpm exec`): this also runs
  // inside the Playwright container's webServer command (see
  // playwright.release.config.ts), where `pnpm` is not installed.
  const viteBin = './node_modules/.bin/vite';
  const args = ['build', '--outDir', distDir];
  const releaseId = env.GITHUB_SHA || '0'.repeat(40);
  const buildDate = new Date().toISOString();

  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      label: 'release-build',
      command: `${viteBin} ${args.join(' ')}`,
      executable: viteBin,
      args,
      env: {
        ...process.env,
        BASE_URL: basePath,
        VITE_RELEASE_ID: releaseId,
        VITE_BUILD_DATE: buildDate,
      },
      run: (lockEnv) =>
        deps.runLocalCommand({
          command: viteBin,
          args,
          env: {
            ...process.env,
            ...lockEnv,
            BASE_URL: basePath,
            VITE_RELEASE_ID: releaseId,
            VITE_BUILD_DATE: buildDate,
          },
        }),
    },
    deps,
  );

  if (result.status !== 0 || result.signal) {
    deps.applyProcessResult(result);
    return;
  }

  if (!existsSync(indexPath)) {
    console.error(`Production build did not produce ${indexPath}.`);
    process.exitCode = 1;
    return;
  }

  copyFileSync(indexPath, join(distDir, '404.html'));
  writeDeploymentMetadataFile(
    distDir,
    buildDeploymentMetadata({
      channel: 'stable',
      channelId: 'main',
      baseUrl: basePath,
      sha: releaseId,
      appVersion: packageJson.version,
      buildDate,
    }),
  );
  // Only the release-only fixture build (never the real production/local artifact pipeline) needs
  // a specific non-default sequence rendered directly into the worker.
  const releaseSequence = env.RELEASE_ARTIFACT_SEQUENCE ? Number(env.RELEASE_ARTIFACT_SEQUENCE) : 1;
  writeStableReleaseArtifact(distDir, releaseSequence);
  console.log(`Production artifact built at ${distDir} (base ${basePath}).`);
  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runBuildArtifact();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
