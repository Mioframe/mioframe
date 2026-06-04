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
 * Run the production Vite build under the unified local safety guard.
 * @param [deps] Test seams for guarded execution and result handling.
 */
export async function runBuildOnly(deps = defaultDeps) {
  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      command: 'pnpm exec vite build',
      executable: 'pnpm',
      args: ['exec', 'vite', 'build'],
      env: process.env,
      label: 'build-only',
    },
    deps,
  );

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runBuildOnly();
}
