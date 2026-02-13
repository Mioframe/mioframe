export type VfsChangeType = 'create' | 'update' | 'delete' | 'rename';

export interface VfsEvent {
  type: VfsChangeType;
  /** Path relative to root (for VFS) or provider root (for drivers) */
  path: string;
  /** For rename event — new path */
  newPath?: string;
}

/**
 * Helper class for managing subscriptions.
 * Used in both VFS and drivers.
 */
export class EventEmitter {
  private listeners: Set<(event: VfsEvent) => void> = new Set();
  private errorHandler: (error: unknown) => void;

  /**
   * @param errorHandler Function for handling errors in subscribers.
   * Defaults to logging error to console.error.
   */
  constructor(errorHandler?: (error: unknown) => void) {
    this.errorHandler =
      errorHandler ||
      ((e) => {
        // eslint-disable-next-line no-console -- for isolate
        console.error('VFS Event Listener Error:', e);
      });
  }

  /**
   * Subscribe to events.
   * @param callback Function to be called when an event occurs
   * @returns Function to unsubscribe
   */
  public subscribe(callback: (event: VfsEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Emit an event to all subscribers.
   * @param event Event to emit
   */
  public emit(event: VfsEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        this.errorHandler(e);
      }
    }
  }
}
