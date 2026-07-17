import { captureDiagnosticException } from '@shared/lib/diagnostics';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import {
  isSameOrder,
  type ReorderCommitRequest,
  type ReorderCommitResult,
} from '@shared/lib/reorder';
import { useSnackbar } from '@shared/ui/Snackbar';
import { computed, ref, watch, type Ref } from 'vue';

enum DatabaseViewReorderErrorCode {
  reorderFailed = 'databaseViewMapEdit.reorderFailed',
}

interface PendingReorder {
  token: symbol;
  expectedOrderedIds: readonly DatabaseViewId[];
  orderedIds: readonly DatabaseViewId[];
  /** Set once the guarded reorder settles; undefined while the service call is still in flight. */
  serviceResult: ReorderCommitResult | undefined;
  /** Set once canonical state confirms `orderedIds`, independent of whether the service settled. */
  canonicalConfirmed: boolean;
  /** Set once the canonical order diverges from both the expected and requested order. */
  conflicted: boolean;
}

/** Reactive contract returned by {@link useDatabaseViewReorderState}. */
export interface UseDatabaseViewReorderStateResult {
  /** The order to render: the optimistic order while a reorder is pending, canonical otherwise. */
  displayIds: Readonly<Ref<readonly DatabaseViewId[]>>;
  /** Whether a reorder is unresolved; a new drag must stay disabled while true. */
  isPending: Readonly<Ref<boolean>>;
  /** Applies one guarded reorder request optimistically and reconciles it against canonical state. */
  onReorder: (request: ReorderCommitRequest<DatabaseViewId>) => Promise<void>;
}

/**
 * Owns the optimistic displayed database-view order and single-flight reconciliation for one
 * guarded reorder mutation: immediate optimistic order, rollback on `stale` or rejection, and
 * held-optimistic display until canonical confirmation on `applied`.
 * @param canonicalIds - The canonical ordered view ids observed from the entity read model.
 * @param reorder - The guarded entity reorder mutation.
 * @returns The displayed order, pending state, and the reorder handler.
 */
export const useDatabaseViewReorderState = (
  canonicalIds: Readonly<Ref<readonly DatabaseViewId[]>>,
  reorder: (request: ReorderCommitRequest<DatabaseViewId>) => Promise<ReorderCommitResult>,
): UseDatabaseViewReorderStateResult => {
  const { addSnackbar } = useSnackbar();
  const pending = ref<PendingReorder | null>(null);

  // `pending.value` is typed as a plain property, so a synchronous pre-`await` assignment
  // narrows it as non-null even though the `watch` below can null it out while an `onReorder`
  // call is suspended at `await`. Reading through this function call breaks that false narrowing.
  const readPending = (): PendingReorder | null => pending.value;

  const displayIds = computed<readonly DatabaseViewId[]>(() => {
    const current = pending.value;

    if (!current || current.conflicted) {
      return canonicalIds.value;
    }

    return current.orderedIds;
  });

  const isPending = computed(() => pending.value !== null);

  watch(canonicalIds, (nextCanonical) => {
    const current = pending.value;

    if (!current || current.conflicted) {
      return;
    }

    if (isSameOrder(nextCanonical, current.orderedIds)) {
      current.canonicalConfirmed = true;

      if (current.serviceResult === 'applied') {
        pending.value = null;
      }

      return;
    }

    if (!isSameOrder(nextCanonical, current.expectedOrderedIds)) {
      current.conflicted = true;

      // The service has already settled: both facts this request needs (its own result and
      // the canonical divergence) are now known, so pending must terminate here. Without this,
      // a conflict detected after the service already resolved `applied` would never clear
      // pending, since `onReorder`'s continuation already ran and won't re-check `conflicted`.
      if (current.serviceResult !== undefined) {
        pending.value = null;
      }
    }
  });

  const onReorder = async (request: ReorderCommitRequest<DatabaseViewId>): Promise<void> => {
    if (pending.value) {
      return;
    }

    const token = Symbol('database-view-reorder');
    pending.value = {
      token,
      expectedOrderedIds: request.expectedOrderedIds,
      orderedIds: request.orderedIds,
      serviceResult: undefined,
      canonicalConfirmed: false,
      conflicted: false,
    };

    try {
      const result = await reorder(request);
      const current = readPending();

      if (current?.token !== token) {
        return;
      }

      current.serviceResult = result;

      if (result === 'stale' || current.conflicted || current.canonicalConfirmed) {
        pending.value = null;
      }
    } catch (error) {
      const current = readPending();

      if (current?.token !== token) {
        return;
      }

      pending.value = null;

      const reportedError = new DomainError('Could not reorder database views', {
        cause: error,
        code: DatabaseViewReorderErrorCode.reorderFailed,
      });

      addSnackbar({ text: 'Could not reorder views' });
      captureDiagnosticException(reportedError, {
        feature: 'databaseViewMapEdit',
        action: 'reorder',
      });
    }
  };

  return { displayIds, isPending, onReorder };
};
