import { withExpensiveCommandLock } from './lib/commandLock.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

const args = ['exec', 'stryker', 'run', ...process.argv.slice(2)];

await withExpensiveCommandLock(
  {
    label: 'mutation',
    command: `pnpm ${args.join(' ')}`,
  },
  async (lockEnv) => {
    await runLocalCommand({ command: 'pnpm', args, env: { ...process.env, ...lockEnv } });
  },
);
