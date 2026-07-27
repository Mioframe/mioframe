import fs from 'node:fs';
import { spawn } from 'node:child_process';

const chunks = [];
const child = spawn(process.execPath, ['scripts/verify.mjs', '--full', '--verbose'], {
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

for (const [stream, destination] of [
  [child.stdout, process.stdout],
  [child.stderr, process.stderr],
]) {
  stream.on('data', (chunk) => {
    chunks.push(Buffer.from(chunk));
    destination.write(chunk);
  });
}

child.once('error', (error) => {
  chunks.push(Buffer.from(`\n[capture-release-verify] spawn error: ${error.message}\n`));
});

child.once('close', (code, signal) => {
  fs.mkdirSync('.verify/logs', { recursive: true });
  fs.writeFileSync('.verify/logs/release-console.log', Buffer.concat(chunks));

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
