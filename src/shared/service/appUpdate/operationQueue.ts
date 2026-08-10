/**
 * A single serialized async operation slot: every enqueued operation runs
 * strictly after the previous one has settled, regardless of whether it
 * resolved or rejected. This is the update controller's only concurrency
 * primitive — it replaces persisted operation tokens or a client registry
 * for making concurrent commands (discovery, preparation, mode changes,
 * clean-launch activation, commit, rollback, cleanup) never interleave.
 */
export type OperationQueue = <T>(operation: () => Promise<T>) => Promise<T>;

/**
 * Creates a new, empty {@link OperationQueue}.
 * @returns A function that enqueues and runs one operation after another.
 */
export function createOperationQueue(): OperationQueue {
  let tail: Promise<unknown> = Promise.resolve();

  return function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation, operation);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
