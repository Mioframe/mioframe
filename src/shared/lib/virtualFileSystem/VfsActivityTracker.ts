import { BehaviorSubject } from 'rxjs';
import type { Observable } from 'rxjs';

/**
 * High-level VFS mutation activity state exposed to UI-facing consumers.
 */
export type VfsActivityStatus = 'idle' | 'active' | 'error';

/**
 * Mutation operations that participate in VFS activity tracking.
 */
export type VfsMutationOperationType = 'writeFile' | 'createDirectory' | 'delete' | 'move';

/**
 * Snapshot of the last failed VFS mutation exposed to UI-facing consumers.
 * The optional `cause` is preserved for in-app recovery detection across service boundaries,
 * but must not be displayed directly or copied into user-facing diagnostics.
 */
export interface VfsActivityError {
  /** Mutation kind that failed. */
  operationType: VfsMutationOperationType;
  /** Path targeted by the failed mutation. */
  path: string;
  /** Destination path for move operations, when relevant. */
  newPath?: string;
  /** User-displayable failure message. */
  message: string;
  /** Optional transported cause retained for internal recovery parsing. */
  cause?: unknown;
  /** Failure timestamp in Unix milliseconds. */
  occurredAt: number;
  /** Whether the UI has dismissed the latest failure. */
  acknowledged: boolean;
}

/**
 * Snapshot of the current VFS mutation activity.
 */
export interface VfsActivityState {
  /** Aggregate tracker status derived from active work and last error. */
  status: VfsActivityStatus;
  /** Number of currently running tracked mutations. */
  activeCount: number;
  /** Last observed mutation failure, if any. */
  lastError?: VfsActivityError;
}

/**
 * Serializable descriptor of a tracked VFS mutation.
 */
export interface VfsMutationOperation {
  /** Mutation kind being tracked. */
  type: VfsMutationOperationType;
  /** Source or target path associated with the mutation. */
  path: string;
  /** Destination path for move operations, when relevant. */
  newPath?: string;
}

interface VfsActivitySnapshot {
  activeCount: number;
  lastError: VfsActivityError | undefined;
}

/**
 * Public tracker contract exposed to VFS consumers.
 */
export interface VfsActivityTracker {
  /**
   * Read-only stream of the current mutation activity state.
   */
  state$: Observable<VfsActivityState>;

  /**
   * Runs a tracked mutation and updates activity state before and after completion.
   * @param operation - Serializable mutation metadata stored on failure.
   * @param run - Async mutation body.
   * @returns Promise resolved with the mutation result.
   */
  track<T>(operation: VfsMutationOperation, run: () => Promise<T>): Promise<T>;

  /**
   * Marks the current activity error as acknowledged without discarding the snapshot.
   */
  acknowledgeError(): void;
}

const getStatus = (state: VfsActivitySnapshot): VfsActivityStatus => {
  if (state.activeCount > 0) {
    return 'active';
  }
  if (state.lastError && !state.lastError.acknowledged) {
    return 'error';
  }
  return 'idle';
};

const createState = (state: VfsActivitySnapshot): VfsActivityState => {
  const nextState: VfsActivityState = {
    status: getStatus(state),
    activeCount: state.activeCount,
  };

  if (state.lastError) {
    nextState.lastError = state.lastError;
  }

  return nextState;
};

/**
 * Creates a VFS activity tracker that retains the last unacknowledged mutation error.
 * @returns Tracker with a read-only state stream and tracked mutation helpers.
 */
export const createVfsActivityTracker = (): VfsActivityTracker => {
  const state$ = new BehaviorSubject<VfsActivityState>(
    createState({
      activeCount: 0,
      lastError: undefined,
    }),
  );

  /**
   * Applies a state transition and emits the derived public snapshot.
   * @param updater - Pure transition that computes the next internal snapshot.
   */
  const patchState = (updater: (state: VfsActivityState) => VfsActivitySnapshot): void => {
    state$.next(createState(updater(state$.value)));
  };

  return {
    state$: state$.asObservable(),
    async track<T>(operation: VfsMutationOperation, run: () => Promise<T>): Promise<T> {
      patchState((state) => ({
        activeCount: state.activeCount + 1,
        lastError: state.lastError?.acknowledged === true ? undefined : state.lastError,
      }));

      try {
        const result = await run();

        patchState((state) => ({
          activeCount: Math.max(0, state.activeCount - 1),
          lastError: state.lastError,
        }));

        return result;
      } catch (error) {
        patchState((state) => ({
          activeCount: Math.max(0, state.activeCount - 1),
          lastError: {
            operationType: operation.type,
            path: operation.path,
            ...(operation.newPath ? { newPath: operation.newPath } : {}),
            message: error instanceof Error ? error.message : String(error),
            cause: error,
            occurredAt: Date.now(),
            acknowledged: false,
          },
        }));

        throw error;
      }
    },
    acknowledgeError(): void {
      patchState((state) => ({
        activeCount: state.activeCount,
        lastError: state.lastError
          ? {
              ...state.lastError,
              acknowledged: true,
            }
          : undefined,
      }));
    },
  };
};
