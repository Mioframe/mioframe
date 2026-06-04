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
 * Run full-repo oxlint only when no local top-level verify is already active.
 * @param [deps] Test seams for verify guard and command execution.
 */
export async function runLintOxlint(deps = defaultDeps) {
  const result = await deps.runGuardedLocalCommand(
    {
      command: 'pnpm exec oxlint . --fix',
      executable: 'pnpm',
      args: ['exec', 'oxlint', '.', '--fix'],
      env: process.env,
      label: 'lint:oxlint',
    },
    deps,
  );

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runLintOxlint();
}
