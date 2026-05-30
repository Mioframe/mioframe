import { spawn } from 'node:child_process';

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

    let terminatedBySignal = null;
    let childClosed = false;

    const onParentSignal = (signal) => {
      if (terminatedBySignal) {
        return;
      }

      terminatedBySignal = signal;
      child.kill(signal);

      if (childClosed) {
        setImmediate(() => {
          process.kill(process.pid, signal);
        });
      }
    };

    process.once('SIGINT', onParentSignal);
    process.once('SIGTERM', onParentSignal);

    child.once('error', (error) => {
      process.removeListener('SIGINT', onParentSignal);
      process.removeListener('SIGTERM', onParentSignal);
      reject(error);
    });

    child.once('close', (code, signal) => {
      childClosed = true;
      process.removeListener('SIGINT', onParentSignal);
      process.removeListener('SIGTERM', onParentSignal);

      if (terminatedBySignal) {
        setImmediate(() => {
          process.kill(process.pid, terminatedBySignal);
        });
      }

      resolve({
        signal: signal ?? null,
        status: signal ? null : (code ?? 1),
      });
    });
  });
}
