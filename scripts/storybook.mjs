import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { runGuardedExpensiveLocalCommand } from './lib/localCommandGuard.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const defaultDeps = {
  applyProcessResult,
  runGuardedExpensiveLocalCommand,
  runLocalCommand,
  spawnStorybook: runLocalCommand,
};

/**
 * Run Storybook in explicit dev or build mode.
 * `dev` stays an unguarded manual server; `build` goes through the local safety policy.
 * @param [mode] Storybook mode.
 * @param [deps] Test seams for guarded execution and result handling.
 */
export async function runStorybook(mode = process.argv[2], deps = defaultDeps) {
  if (mode !== 'dev' && mode !== 'build') {
    console.error('Expected Storybook mode: dev or build.');
    process.exit(1);
  }

  const { args, command, env } = getStorybookCommand(mode);

  if (mode === 'dev') {
    const result = await deps.spawnStorybook({
      args,
      command,
      env,
    });
    deps.applyProcessResult(result);
    return;
  }

  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      args,
      command: `${command} ${args.join(' ')}`,
      executable: command,
      env,
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
  await runStorybook();
}
