import { pathToFileURL } from 'node:url';

import { assertNoActiveVerifyLock } from './lib/commandLock.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const defaultDeps = {
  applyProcessResult,
  assertNoActiveVerifyLock,
  runLocalCommand,
};

/**
 * Run the full repository type-check unless a local top-level verify already owns the machine.
 * @param [deps] Test seams for verify guard and command execution.
 */
export async function runTypeCheck(deps = defaultDeps) {
  deps.assertNoActiveVerifyLock();

  const result = await deps.runLocalCommand({
    command: 'pnpm',
    args: ['exec', 'vue-tsc', '--build'],
  });

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runTypeCheck();
}
