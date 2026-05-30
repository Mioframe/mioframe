import { spawn } from 'node:child_process';

import { createChildSignalForwarder } from './signalForward.mjs';

/**
 * @param input Spawn configuration for the local child process.
 * @param input.command Executable to run.
 * @param input.args CLI arguments for the executable.
 * @param [input.env] Environment for the child process.
 * @param [input.spawnProcess] Spawn implementation used for tests.
 * @returns Resolves with the normalized child process result after exit.
 */
export async function runLocalCommand({ command, args, env = process.env, spawnProcess = spawn }) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, {
      stdio: 'inherit',
      env,
    });

    const forwarder = createChildSignalForwarder(child);

    child.once('error', (error) => {
      forwarder.cleanup();
      reject(error);
    });

    child.once('close', (code, signal) => {
      forwarder.childClosed = true;
      forwarder.cleanup();
      forwarder.propagateIfTerminated();

      resolve({
        signal: signal ?? null,
        status: signal ? null : (code ?? 1),
      });
    });
  });
}
