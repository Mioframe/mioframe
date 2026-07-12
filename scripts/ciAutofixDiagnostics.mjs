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
fs.writeFileSync(
  path.join(logsDirectory, 'autofix-status.txt'),
  spawnSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).stdout ?? '',
  'utf8',
);
fs.writeFileSync(
  path.join(logsDirectory, 'autofix.patch'),
  spawnSync('git', ['diff', '--binary'], { cwd: root, encoding: 'utf8' }).stdout ?? '',
  'utf8',
);

process.exit(verifyResult.status ?? 1);
