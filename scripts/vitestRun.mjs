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
 * Run Vitest under the unified local safety guard.
 * @param [argv] Raw CLI arguments to forward to `vitest run`.
 * @param [deps] Test seams for guarded execution and result handling.
 */
export async function runVitest(argv = process.argv.slice(2), deps = defaultDeps) {
  const args = ['exec', 'vitest', 'run', ...argv];
  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      command: `pnpm ${args.join(' ')}`,
      executable: 'pnpm',
      args,
      env: process.env,
      label: argv.includes('--coverage') ? 'test:coverage' : 'test:run',
    },
    deps,
  );

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runVitest();
}
