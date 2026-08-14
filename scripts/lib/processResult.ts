/**
 * Normalized outcome of a completed child process: either a numeric exit
 * status, or the signal that terminated it. Shared by every verifier module
 * that runs, guards, or reports on a local child command.
 */
export interface ProcessResult {
  status: number | null;
  signal: NodeJS.Signals | null;
}

/**
 * Minimal process-like target `applyProcessResult` propagates a result onto.
 * Narrower than `NodeJS.Process` so tests can pass a plain mock.
 */
export interface ProcessResultTarget {
  readonly pid: number;
  kill(pid: number, signal: NodeJS.Signals): void;
  exitCode: string | number | null | undefined;
}

/**
 * Apply a completed child process result after wrapper cleanup has finished.
 * @param result Normalized child process result.
 * @param [processObject] Process-like object used for exit propagation.
 */
export function applyProcessResult(
  result: ProcessResult,
  processObject: ProcessResultTarget = process,
): void {
  if (result.signal) {
    processObject.kill(processObject.pid, result.signal);
    return;
  }

  processObject.exitCode = result.status ?? 1;
}
