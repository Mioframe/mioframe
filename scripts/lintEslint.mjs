import { pathToFileURL } from 'node:url';

import { classifyCommandWeight, resolveEslintConcurrency } from './lib/commandWeight.ts';
import {
  runGuardedExpensiveLocalCommand,
  runGuardedLocalCommand,
} from './lib/localCommandGuard.ts';
import { applyProcessResult } from './lib/processResult.ts';
import { runLocalCommand } from './lib/runLocalCommand.ts';

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
  try {
    await runLintEslint();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
