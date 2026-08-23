import { useDatabaseValueWrite } from '@entity/databaseValue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItemId, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { useSnackbar } from '@shared/ui/Snackbar';
import { isEqual } from 'es-toolkit';
import { shallowRef, type Ref } from 'vue';

enum DatabaseInlineEditErrorCode {
  persistenceFailed = 'databaseInlineValueEdit.persistenceFailed',
}

type InlineEditResolution = { status: 'success' } | { status: 'error'; error: DomainError };

type ActiveInlineEditSession = {
  itemId: DatabaseItemId;
  propertyId: DatabasePropertyId;
  initialValue: unknown;
  draft: unknown;
  resolving: boolean;
};

const isActiveInlineEdit = (
  session: ActiveInlineEditSession | undefined,
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
): session is ActiveInlineEditSession =>
  session?.itemId === itemId && session.propertyId === propertyId;

/**
 * Keeps one Database inline-edit draft stable across virtual remounts and serializes its
 * persistence through the entity-owned value writer.
 * @param path - Directory path containing the Database document.
 * @param documentId - Database document identity.
 * @returns Session lookup and lifecycle operations for Database composition.
 */
export const useDatabaseInlineEditSession = (path: Ref<string>, documentId: Ref<AMDocumentId>) => {
  const { postValue } = useDatabaseValueWrite(path, documentId);
  const { addSnackbar } = useSnackbar();
  const activeInlineEditSession = shallowRef<ActiveInlineEditSession>();
  let activeInlineEditResolution: Promise<InlineEditResolution> | undefined;

  const getSession = (itemId: DatabaseItemId, propertyId: DatabasePropertyId) => {
    const session = activeInlineEditSession.value;

    if (!isActiveInlineEdit(session, itemId, propertyId)) {
      return undefined;
    }

    return {
      draft: session.draft,
      resolving: session.resolving,
    };
  };

  const resolve = (): Promise<InlineEditResolution> => {
    if (activeInlineEditResolution) {
      return activeInlineEditResolution;
    }

    const session = activeInlineEditSession.value;

    if (!session) {
      return Promise.resolve({ status: 'success' });
    }

    activeInlineEditSession.value = {
      ...session,
      resolving: true,
    };

    const resolution: Promise<InlineEditResolution> = (async (): Promise<InlineEditResolution> => {
      try {
        if (!isEqual(session.initialValue, session.draft)) {
          await postValue(session.itemId, session.propertyId, session.draft);
        }

        if (isActiveInlineEdit(activeInlineEditSession.value, session.itemId, session.propertyId)) {
          activeInlineEditSession.value = undefined;
        }

        return { status: 'success' };
      } catch (cause) {
        const currentSession = activeInlineEditSession.value;

        if (isActiveInlineEdit(currentSession, session.itemId, session.propertyId)) {
          activeInlineEditSession.value = {
            ...currentSession,
            resolving: false,
          };
        }

        const error =
          cause instanceof DomainError
            ? cause
            : new DomainError('Could not save the inline value.', {
                code: DatabaseInlineEditErrorCode.persistenceFailed,
                cause,
              });

        addSnackbar({ text: 'Could not save the inline value.' });

        if (!(cause instanceof DomainError)) {
          captureDiagnosticException(error, {
            feature: 'databaseInlineValueEdit',
            action: 'resolve',
          });
        }

        return { status: 'error', error };
      }
    })();

    activeInlineEditResolution = resolution;
    void resolution.finally(() => {
      if (activeInlineEditResolution === resolution) {
        activeInlineEditResolution = undefined;
      }
    });

    return resolution;
  };

  const request = async (
    itemId: DatabaseItemId,
    propertyId: DatabasePropertyId,
    initialValue: unknown,
  ) => {
    if (isActiveInlineEdit(activeInlineEditSession.value, itemId, propertyId)) {
      return;
    }

    if ((await resolve()).status !== 'success') {
      return;
    }

    activeInlineEditSession.value = {
      itemId,
      propertyId,
      initialValue,
      draft: initialValue,
      resolving: false,
    };
  };

  const updateDraft = (itemId: DatabaseItemId, propertyId: DatabasePropertyId, draft: unknown) => {
    const session = activeInlineEditSession.value;

    if (!isActiveInlineEdit(session, itemId, propertyId) || session.resolving) {
      return;
    }

    activeInlineEditSession.value = {
      ...session,
      draft,
    };
  };

  const commit = (itemId: DatabaseItemId, propertyId: DatabasePropertyId) => {
    if (isActiveInlineEdit(activeInlineEditSession.value, itemId, propertyId)) {
      return resolve();
    }

    return Promise.resolve<InlineEditResolution>({ status: 'success' });
  };

  const cancel = (itemId: DatabaseItemId, propertyId: DatabasePropertyId) => {
    const session = activeInlineEditSession.value;

    if (isActiveInlineEdit(session, itemId, propertyId) && !session.resolving) {
      activeInlineEditSession.value = undefined;
    }
  };

  return {
    cancel,
    commit,
    getSession,
    request,
    resolve,
    updateDraft,
  };
};
