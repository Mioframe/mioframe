/**
 * Manages resource locks by path.
 * Ensures that operations on a single file are executed sequentially.
 */
export class LockManager {
  // Store the "tail" of promise queues for each path.
  // Promise<void> ensures we wait for the previous task to complete,
  // regardless of whether it succeeded or failed.
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Executes the exclusiveTask function in exclusive access mode to the path.
   * If the path is already occupied, queues the task.
   *
   * @param path - The path to lock
   * @param exclusiveTask - The task to execute exclusively
   * @returns A promise that resolves with the result of the exclusive task
   */
  public async request<T>(
    path: string,
    exclusiveTask: () => Promise<T>,
  ): Promise<T> {
    // Get the current tail of the queue (or a resolved promise if there's no queue)
    const currentLock = this.locks.get(path) ?? Promise.resolve();

    // 1. Create a promise with the result for the calling code.
    // It waits for currentLock, then executes the task.
    const taskPromise = currentLock.then(() => exclusiveTask());

    // 2. Create a new tail for the queue.
    // We only care about the completion of the task (success or failure) to start the next one.
    // .catch() suppresses errors in the queue chain, but not in taskPromise.
    const nextTail = taskPromise.then(() => {}).catch(() => {});

    // 3. Update the Map with the new tail
    this.locks.set(path, nextTail);

    // 4. Garbage Collection (memory cleanup)
    // When this tail completes, check: if it's still the last one in the Map, delete the entry.
    void nextTail.then(() => {
      if (this.locks.get(path) === nextTail) {
        this.locks.delete(path);
      }
    });

    return taskPromise;
  }

  /**
   * Checks if a path is currently locked.
   *
   * @param path - The path to check
   * @returns True if the path is locked, false otherwise
   */
  public isLocked(path: string): boolean {
    return this.locks.has(path);
  }
}
