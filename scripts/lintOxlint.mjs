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
 * Run full-repo oxlint only when no local top-level verify is already active.
 * @param [deps] Test seams for verify guard and command execution.
 */
export async function runLintOxlint(deps = defaultDeps) {
  deps.assertNoActiveVerifyLock();

  const result = await deps.runLocalCommand({
    command: 'pnpm',
    args: ['exec', 'oxlint', '.', '--fix'],
  });

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runLintOxlint();
}
