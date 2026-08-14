import { pathToFileURL } from 'node:url';

import { runGuardedLocalCommand } from './lib/localCommandGuard.ts';
import { applyProcessResult } from './lib/processResult.ts';
import { runLocalCommand } from './lib/runLocalCommand.ts';

const defaultDeps = {
  applyProcessResult,
  runGuardedLocalCommand,
  runLocalCommand,
};

/**
 * Run the full repository type-check unless a local top-level verify already owns the machine.
 * @param [deps] Test seams for verify guard and command execution.
 */
export async function runTypeCheck(deps = defaultDeps) {
  const result = await deps.runGuardedLocalCommand(
    {
      command: 'pnpm exec vue-tsc --build',
      executable: 'pnpm',
      args: ['exec', 'vue-tsc', '--build'],
      env: process.env,
      label: 'type-check',
    },
    deps,
  );

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runTypeCheck();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
