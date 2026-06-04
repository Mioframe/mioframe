import { pathToFileURL } from 'node:url';

import { runGuardedLocalCommand } from './lib/localCommandGuard.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

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
  await runTypeCheck();
}
