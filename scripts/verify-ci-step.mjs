import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['scripts/verify.mjs', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
