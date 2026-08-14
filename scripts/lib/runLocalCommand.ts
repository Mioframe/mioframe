import { spawn } from 'node:child_process';

import { createChildSignalForwarder, type KillableChild } from './signalForward.ts';
import type { ProcessResult } from './processResult.ts';

/** Minimal spawned-child shape `runLocalCommand` depends on. */
export interface SpawnedChild extends KillableChild {
  once(event: 'error', listener: (error: Error) => void): unknown;
  once(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void,
  ): unknown;
}

/** Spawn implementation shape used by `runLocalCommand`, matching `node:child_process#spawn`. */
export type SpawnLocalCommand = (
  command: string,
  args: readonly string[],
  options: { stdio: 'inherit'; env: NodeJS.ProcessEnv },
) => SpawnedChild;

/** Spawn configuration for a local child process. */
export interface RunLocalCommandInput {
  /** Executable to run. */
  command: string;
  /** CLI arguments for the executable. */
  args: readonly string[];
  /** Environment for the child process. */
  env?: NodeJS.ProcessEnv;
  /** Spawn implementation used for tests. */
  spawnProcess?: SpawnLocalCommand;
}

/**
 * @param input Spawn configuration for the local child process.
 * @returns Resolves with the normalized child process result after exit.
 */
export async function runLocalCommand({
  command,
  args,
  env = process.env,
  spawnProcess = spawn,
}: RunLocalCommandInput): Promise<ProcessResult> {
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

      resolve({
        signal: signal ?? null,
        status: signal ? null : (code ?? 1),
      });
    });
  });
}
