import type { DatabaseItemId, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { isEqual } from 'es-toolkit';
import { shallowRef } from 'vue';

type ActiveInlineEditSession = {
  itemId: DatabaseItemId;
  propertyId: DatabasePropertyId;
  initialValue: unknown;
  draft: unknown;
  resolving: boolean;
};

type DatabaseInlineEditValueWriter = (
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
  value: unknown,
) => Promise<unknown>;

const isActiveInlineEdit = (
  session: ActiveInlineEditSession | undefined,
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
): session is ActiveInlineEditSession =>
  session?.itemId === itemId && session.propertyId === propertyId;

/**
 * Keeps the Database widget's one active inline-edit draft stable across virtual remounts and
 * serializes its persistence through the entity-owned value writer.
 * @param postValue - Narrow persistence dependency addressed by logical cell identity.
 * @returns Session lookup and lifecycle operations for Database widget composition.
 */
export const useDatabaseInlineEditSession = (postValue: DatabaseInlineEditValueWriter) => {
  const activeInlineEditSession = shallowRef<ActiveInlineEditSession>();
  let activeInlineEditResolution: Promise<boolean> | undefined;

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

  const resolve = (): Promise<boolean> => {
    if (activeInlineEditResolution) {
      return activeInlineEditResolution;
    }

    const session = activeInlineEditSession.value;

    if (!session) {
      return Promise.resolve(true);
    }

    activeInlineEditSession.value = {
      ...session,
      resolving: true,
    };

    const resolution = (async () => {
      try {
        if (!isEqual(session.initialValue, session.draft)) {
          await postValue(session.itemId, session.propertyId, session.draft);
        }

        if (isActiveInlineEdit(activeInlineEditSession.value, session.itemId, session.propertyId)) {
          activeInlineEditSession.value = undefined;
        }

        return true;
      } catch {
        const currentSession = activeInlineEditSession.value;

        if (isActiveInlineEdit(currentSession, session.itemId, session.propertyId)) {
          activeInlineEditSession.value = {
            ...currentSession,
            resolving: false,
          };
        }

        return false;
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

    if (!(await resolve())) {
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
      void resolve();
    }
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
