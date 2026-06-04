import { pathToFileURL } from 'node:url';

import { classifyCommandWeight, resolveEslintConcurrency } from './lib/commandWeight.mjs';
import {
  runGuardedExpensiveLocalCommand,
  runGuardedLocalCommand,
} from './lib/localCommandGuard.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const defaultDeps = {
  applyProcessResult,
  classifyCommandWeight,
  runGuardedExpensiveLocalCommand,
  runGuardedLocalCommand,
  resolveEslintConcurrency,
  runLocalCommand,
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
      ? await deps.runGuardedExpensiveLocalCommand(
          {
            label: 'eslint',
            command,
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
        )
      : await deps.runGuardedLocalCommand(
          {
            label: 'eslint',
            command,
            executable: 'pnpm',
            args,
            env: process.env,
          },
          deps,
        );

  deps.applyProcessResult(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runLintEslint();
}
