import { spawn } from 'node:child_process';

/**
 * @param input Spawn configuration for the local child process.
 * @param input.command Executable to run.
 * @param input.args CLI arguments for the executable.
 * @param [input.env] Environment for the child process.
 * @returns Resolves after the child process exits.
 */
export async function runLocalCommand({ command, args, env = process.env }) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
    });

    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }

      process.exitCode = code ?? 1;
      resolve();
    });
  });
}
