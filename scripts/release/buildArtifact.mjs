import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import toolingConfig from '../../config/tooling.json' with { type: 'json' };
import { runGuardedExpensiveLocalCommand } from '../lib/localCommandGuard.mjs';
import { applyProcessResult } from '../lib/processResult.mjs';
import { runLocalCommand } from '../lib/runLocalCommand.mjs';

const defaultDeps = {
  applyProcessResult,
  runGuardedExpensiveLocalCommand,
  runLocalCommand,
};

/**
 * Resolve the GitHub Pages base path for a release artifact build.
 * @param [argv] Raw CLI arguments.
 * @param [env] Process environment.
 * @returns Resolved base path, e.g. `/mioframe/`.
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
 * @param [argv] Raw CLI arguments.
 * @param [deps] Test seams for guarded execution and result handling.
 */
export async function runBuildArtifact(argv = process.argv.slice(2), deps = defaultDeps) {
  const basePath = resolveArtifactBasePath(argv);
  const distDir = resolveArtifactDistDir(argv);
  // Invoke the local vite binary directly (not `pnpm exec`): this also runs
  // inside the Playwright container's webServer command (see
  // playwright.release.config.ts), where `pnpm` is not installed.
  const viteBin = './node_modules/.bin/vite';
  const args = ['build'];

  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      label: 'release-build',
      command: `${viteBin} ${args.join(' ')}`,
      executable: viteBin,
      args,
      env: { ...process.env, BASE_URL: basePath },
      run: (lockEnv) =>
        deps.runLocalCommand({
          command: viteBin,
          args,
          env: { ...process.env, ...lockEnv, BASE_URL: basePath },
        }),
    },
    deps,
  );

  if (result.status !== 0 || result.signal) {
    deps.applyProcessResult(result);
    return;
  }

  const indexPath = join(distDir, 'index.html');

  if (!existsSync(indexPath)) {
    console.error(`Production build did not produce ${indexPath}.`);
    process.exitCode = 1;
    return;
  }

  copyFileSync(indexPath, join(distDir, '404.html'));
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
