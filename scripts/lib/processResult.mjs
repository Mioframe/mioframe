/**
 * Apply a completed child process result after wrapper cleanup has finished.
 * @param result Normalized child process result.
 * @param result.status Exit status when the child exited normally.
 * @param result.signal Signal name when the child exited by signal.
 * @param [processObject] Process-like object used for exit propagation.
 */
export function applyProcessResult(result, processObject = process) {
  if (result.signal) {
    processObject.kill(processObject.pid, result.signal);
    return;
  }

  processObject.exitCode = result.status ?? 1;
}
