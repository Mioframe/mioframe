import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { runGuardedExpensiveLocalCommand } from './lib/localCommandGuard.ts';
import { applyProcessResult } from './lib/processResult.ts';
import { runLocalCommand } from './lib/runLocalCommand.ts';

const defaultDeps = {
  applyProcessResult,
  fileExists: existsSync,
  runGuardedExpensiveLocalCommand,
  runLocalCommand,
  spawnStorybook: runLocalCommand,
};

/**
 * Run Storybook in explicit dev or build mode.
 * `dev` stays an unguarded manual server; `build` goes through the local safety policy.
 *
 * When `STORYBOOK_STATIC_SKIP_BUILD=1` is set for `build` mode, this reuses an existing
 * Storybook static build instead of recompiling. Verification orchestration sets this only
 * after the same verification scope already has a complete static artifact: automatic
 * local `pnpm verify` uses its prior successful `storybook-build` result, while GitHub CI
 * downloads the run-scoped producer artifact before enabling reuse for a Storybook browser
 * lane. Standalone invocations do not opt into reuse and build Storybook themselves.
 * @param [mode] Storybook mode.
 * @param [deps] Test seams for guarded execution and result handling.
 * @param [env] Process environment, for the reuse-if-prebuilt test seam.
 */
export async function runStorybook(mode = process.argv[2], deps = defaultDeps, env = process.env) {
  if (mode !== 'dev' && mode !== 'build') {
    console.error('Expected Storybook mode: dev or build.');
    process.exit(1);
  }

  if (mode === 'build' && env.STORYBOOK_STATIC_SKIP_BUILD === '1') {
    const fileExists = deps.fileExists ?? existsSync;
    const staticDir = toolingConfig.storybook.staticDir;
    const indexPath = join(staticDir, 'index.html');
    const iframePath = join(staticDir, 'iframe.html');

    if (!fileExists(indexPath) || !fileExists(iframePath)) {
      console.error(
        `STORYBOOK_STATIC_SKIP_BUILD=1 was set, but no existing Storybook static build was found at ${staticDir} ` +
          `(expected both ${indexPath} and ${iframePath}). ` +
          'Rerun without STORYBOOK_STATIC_SKIP_BUILD so this step builds Storybook itself.',
      );
      process.exitCode = 1;
      return;
    }

    console.log(`Reusing existing Storybook static build at ${staticDir}.`);
    return;
  }

  const { args, command, env: commandEnv } = getStorybookCommand(mode);

  if (mode === 'dev') {
    const result = await deps.spawnStorybook({
      args,
      command,
      env: commandEnv,
    });
    deps.applyProcessResult(result);
    return;
  }

  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      args,
      command: `${command} ${args.join(' ')}`,
      executable: command,
      env: commandEnv,
      label: 'storybook:build',
    },
    deps,
  );

  deps.applyProcessResult(result);
}

function getStorybookCommand(mode) {
  const command = join(process.cwd(), 'node_modules', '.bin', 'storybook');
  const args =
    mode === 'dev'
      ? [
          'dev',
          '-p',
          String(toolingConfig.storybook.devServer.port),
          '--host',
          toolingConfig.localServer.host,
        ]
      : ['build', '--output-dir', toolingConfig.storybook.staticDir];

  return {
    args,
    command,
    env: {
      ...process.env,
      APP_STORYBOOK: '1',
      STORYBOOK_DISABLE_TELEMETRY: '1',
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runStorybook();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
