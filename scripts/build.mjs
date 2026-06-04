import { pathToFileURL } from 'node:url';

import {
  runGuardedExpensiveLocalCommand,
  runGuardedLocalCommand,
} from './lib/localCommandGuard.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const defaultDeps = {
  applyProcessResult,
  runGuardedExpensiveLocalCommand,
  runGuardedLocalCommand,
  runLocalCommand,
};

/**
 * Run the repository build sequentially so Vite never starts before the guard allows it.
 * @param [deps] Test seams for guarded execution and result handling.
 */
export async function runBuild(deps = defaultDeps) {
  const typeCheckResult = await deps.runGuardedLocalCommand(
    {
      command: 'pnpm exec vue-tsc --build',
      executable: 'pnpm',
      args: ['exec', 'vue-tsc', '--build'],
      env: process.env,
      label: 'type-check',
    },
    deps,
  );

  if (typeCheckResult.signal || typeCheckResult.status !== 0) {
    deps.applyProcessResult(typeCheckResult);
    return;
  }

  const buildResult = await deps.runGuardedExpensiveLocalCommand(
    {
      command: 'pnpm exec vite build',
      executable: 'pnpm',
      args: ['exec', 'vite', 'build'],
      env: process.env,
      label: 'build-only',
    },
    deps,
  );

  deps.applyProcessResult(buildResult);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runBuild();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
