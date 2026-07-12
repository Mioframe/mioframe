import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logsDirectory = path.join(root, '.verify', 'logs');

const verifyResult = spawnSync(process.execPath, ['scripts/verify.mjs', '--fix-only'], {
  cwd: root,
  stdio: 'inherit',
});

fs.mkdirSync(logsDirectory, { recursive: true });

for (const [fileName, args] of [
  ['autofix-status.txt', ['status', '--short']],
  ['autofix.patch', ['diff', '--binary']],
]) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  fs.writeFileSync(path.join(logsDirectory, fileName), result.stdout ?? '', 'utf8');
}

process.exit(verifyResult.status ?? 1);
