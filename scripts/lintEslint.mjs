import { classifyCommandWeight, resolveEslintConcurrency } from './lib/commandWeight.mjs';
import { withExpensiveCommandLock } from './lib/commandLock.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const args = [
  'exec',
  'eslint',
  '.',
  '--cache',
  '--fix',
  `--concurrency=${resolveEslintConcurrency()}`,
];
const weight = classifyCommandWeight({ label: 'eslint', isFullRepo: true });

if (weight === 'expensive') {
  await withExpensiveCommandLock(
    {
      label: 'eslint',
      command: `pnpm ${args.join(' ')}`,
    },
    async (lockEnv) => {
      await runLocalCommand({ command: 'pnpm', args, env: { ...process.env, ...lockEnv } });
    },
  );
} else {
  await runLocalCommand({ command: 'pnpm', args });
}
