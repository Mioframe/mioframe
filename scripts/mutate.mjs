import { pathToFileURL } from 'node:url';

import { runGuardedExpensiveLocalCommand } from './lib/localCommandGuard.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const defaultDeps = {
  applyProcessResult,
  runGuardedExpensiveLocalCommand,
  runLocalCommand,
};

/**
 * Run the mutation command under the expensive-command lock and apply its result after cleanup.
 * @param [argv] Raw CLI arguments to forward to Stryker.
 * @param [deps] Test seams for command execution and result application.
 */
export async function runMutation(argv = process.argv.slice(2), deps = defaultDeps) {
  const args = ['exec', 'stryker', 'run', ...argv];
  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      label: 'mutation',
      command: `pnpm ${args.join(' ')}`,
      executable: 'pnpm',
      args,
      env: process.env,
      run: (lockEnv) =>
        deps.runLocalCommand({
          command: 'pnpm',
          args,
          env: { ...process.env, ...lockEnv },
        }),
    },
    deps,
  );

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runMutation();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
