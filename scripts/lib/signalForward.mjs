import process from 'node:process';

/**
 * Create a signal forwarder that listens for parent `SIGINT` and `SIGTERM` and
 * forwards them to the given child process. When the child has already closed
 * by the time the parent signal arrives, the signal is re-emitted to the parent
 * process itself so the default signal behavior (termination) takes effect after
 * cleanup.
 *
 * Use {@link cleanup} to remove the listeners when the child errors or closes.
 * Call {@link propagateIfTerminated} after the child's `close` event to
 * re-emit the termination signal to the current process.
 * @param child ChildProcess whose `kill` method is called on parent signal.
 * @returns A forwarder handle with state accessors and lifecycle methods.
 */
export function createChildSignalForwarder(child) {
  const state = { terminatedBySignal: null, childClosed: false };

  const onParentSignal = (signal) => {
    if (state.terminatedBySignal !== null) {
      return;
    }

    state.terminatedBySignal = signal;
    child.kill(signal);

    if (state.childClosed) {
      setImmediate(() => {
        process.kill(process.pid, signal);
      });
    }
  };

  process.once('SIGINT', onParentSignal);
  process.once('SIGTERM', onParentSignal);

  return {
    /**
     * The signal that caused the child to terminate, or `null`.
     * @returns {string|null}
     */
    get terminatedBySignal() {
      return state.terminatedBySignal;
    },

    set childClosed(value) {
      state.childClosed = value;
    },

    /** The parent-signal handler (exposed for testing). */
    onParentSignal,

    /** Remove the parent-signal listeners. Safe to call multiple times. */
    cleanup() {
      process.removeListener('SIGINT', onParentSignal);
      process.removeListener('SIGTERM', onParentSignal);
    },

    /**
     * If the child was terminated by a parent signal, re-emit that signal to
     * the current process after a safe delay so the default behavior applies.
     * Call this after cleanup is complete.
     */
    propagateIfTerminated() {
      if (state.terminatedBySignal !== null) {
        setImmediate(() => {
          process.kill(process.pid, state.terminatedBySignal);
        });
      }
    },
  };
}
