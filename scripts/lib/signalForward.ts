import process from 'node:process';

/** Child process target a signal forwarder can terminate. */
export interface KillableChild {
  kill(signal: NodeJS.Signals): void;
}

/** Forwarder handle with state accessors and lifecycle methods. */
export interface ChildSignalForwarder {
  /** The signal that caused the child to terminate, or `null`. */
  get terminatedBySignal(): NodeJS.Signals | null;
  set childClosed(value: boolean);
  /** The parent-signal handler (exposed for testing). */
  onParentSignal: (signal: NodeJS.Signals) => void;
  /** Remove the parent-signal listeners. Safe to call multiple times. */
  cleanup: () => void;
}

/**
 * Create a signal forwarder that listens for parent `SIGINT` and `SIGTERM` and
 * forwards them to the given child process. When the child has already closed
 * by the time the parent signal arrives, the signal is re-emitted to the parent
 * process itself so the default signal behavior (termination) takes effect after
 * cleanup.
 *
 * Use {@link ChildSignalForwarder.cleanup} to remove the listeners when the
 * child errors or closes.
 * @param child ChildProcess whose `kill` method is called on parent signal.
 * @returns A forwarder handle with state accessors and lifecycle methods.
 */
export function createChildSignalForwarder(child: KillableChild): ChildSignalForwarder {
  const state: { terminatedBySignal: NodeJS.Signals | null; childClosed: boolean } = {
    terminatedBySignal: null,
    childClosed: false,
  };

  const onParentSignal = (signal: NodeJS.Signals) => {
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
    get terminatedBySignal() {
      return state.terminatedBySignal;
    },

    set childClosed(value: boolean) {
      state.childClosed = value;
    },

    onParentSignal,

    cleanup() {
      process.removeListener('SIGINT', onParentSignal);
      process.removeListener('SIGTERM', onParentSignal);
    },
  };
}
