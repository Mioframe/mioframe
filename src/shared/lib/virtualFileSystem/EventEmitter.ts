import type { FSNodeType } from './IFileSystemProvider';

/**
 * Virtual file system event types.
 *
 * @remarks
 * Events are divided into two categories:
 *
 * **Content events** (files and directories):
 * - `create` — A new file or directory has been created
 * - `update` — An existing file has been modified (content changed)
 * - `delete` — A file or directory has been deleted
 * - `rename` — A file or directory has been renamed/moved
 *
 * **System events** (mount points):
 * - `mount` — A provider has been mounted at a path
 * - `unmount` — A provider has been unmounted from a path
 *
 * For content events, check the `nodeType` field to determine if the event
 * is for a file or directory.
 */
export enum VfsEventType {
  /**
   * A new file or directory has been created.
   * Emitted by: writeFile (new file), createDirectory
   */
  CREATE = 'create',

  /**
   * An existing file has been modified.
   * Emitted by: writeFile (existing file)
   * Note: Only for files, not directories
   */
  UPDATE = 'update',

  /**
   * A file or directory has been deleted.
   * Emitted by: delete
   */
  DELETE = 'delete',

  /**
   * A file or directory has been renamed or moved.
   * Emitted by: move
   */
  RENAME = 'rename',

  /**
   * A provider has been mounted at a path.
   * Emitted by: mount
   */
  MOUNT = 'mount',

  /**
   * A provider has been unmounted from a path.
   * Emitted by: unmount
   */
  UNMOUNT = 'unmount',
}

export enum VfsEventSource {
  VFS = 'vfs',
  PROVIDER = 'provider',
}

export interface VfsEvent {
  /** Event origin */
  source: VfsEventSource;
  type: VfsEventType;
  /** Path relative to VFS root */
  path: string;
  /** For rename event — new path */
  newPath?: string | undefined;
  /** Mount path for forwarded provider events */
  mountPath?: string | undefined;
  /** Original provider-relative path before mount prefixing */
  providerPath?: string | undefined;
  /** Original provider-relative new path before mount prefixing */
  providerNewPath?: string | undefined;
  /** Node type for content events (create, update, delete, rename) */
  nodeType?: FSNodeType | undefined;
  /** File size in bytes (for update events) */
  size?: number | undefined;
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
