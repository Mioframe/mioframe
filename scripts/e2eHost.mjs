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
 * Run host Playwright for explicit local development modes while respecting verify coordination.
 * @param [argv] Raw Playwright args to forward.
 * @param [deps] Test seams for locking and command execution.
 */
export async function runE2eHost(argv = process.argv.slice(2), deps = defaultDeps) {
  const args = ['exec', 'playwright', 'test', ...argv];
  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      label: getE2eHostLabel(argv),
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

function getE2eHostLabel(argv) {
  if (argv.includes('--ui')) {
    return 'e2e:ui';
  }

  if (argv.includes('--headed')) {
    return 'e2e:headed';
  }

  return 'e2e:host';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runE2eHost();
}
