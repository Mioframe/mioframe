import { pathToFileURL } from 'node:url';

import { classifyCommandWeight, resolveEslintConcurrency } from './lib/commandWeight.mjs';
import { withExpensiveCommandLock } from './lib/commandLock.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const defaultDeps = {
  applyProcessResult,
  classifyCommandWeight,
  resolveEslintConcurrency,
  runLocalCommand,
  withExpensiveCommandLock,
};

/**
 * Run full-repo ESLint with the expensive lock only when the command is classified as expensive.
 * @param [deps] Test seams for command execution and result application.
 */
export async function runLintEslint(deps = defaultDeps) {
  const args = [
    'exec',
    'eslint',
    '.',
    '--cache',
    '--fix',
    `--concurrency=${deps.resolveEslintConcurrency()}`,
  ];
  const weight = deps.classifyCommandWeight({ label: 'eslint', isFullRepo: true });
  const command = `pnpm ${args.join(' ')}`;

  const result =
    weight === 'expensive'
      ? await deps.withExpensiveCommandLock(
          {
            label: 'eslint',
            command,
          },
          (lockEnv) =>
            deps.runLocalCommand({
              command: 'pnpm',
              args,
              env: { ...process.env, ...lockEnv },
            }),
        )
      : await deps.runLocalCommand({ command: 'pnpm', args });

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runLintEslint();
}
