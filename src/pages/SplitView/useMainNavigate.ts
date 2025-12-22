import { stringPath } from '@shared/service/directories';
import type { AMDocumentId } from '@shared/lib/automerge';
import { zodDocumentId } from '@shared/lib/automerge';
import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { zodEntryPath } from '@shared/lib/fileSystem/GeneralFSEntry';
import { createGlobalState } from '@vueuse/core';
import type { PartialDeep, ReadonlyDeep } from 'type-fest';
import type { ComputedRef } from 'vue';
import { computed, reactive, readonly } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { output } from 'zod/v4-mini';
import { object } from 'zod/v4-mini';

export interface RepoExplorerState {
  /**
   * Путь к директории
   */
  path: EntryPath | undefined;
  /**
   * Выбранный документ в директории
   */
  document: output<typeof zodDocumentId> | undefined;
}

interface UseRepoExplorerState {
  /**
   * @deprecated
   */
  state: ReadonlyDeep<RepoExplorerState>;
  /**
   * @deprecated
   */
  directoryPath: ComputedRef<EntryPath | undefined>;
  /**
   * @deprecated
   */
  directoryPathString: ComputedRef<EntryPathString | undefined>;
  /**
   * @deprecated
   */
  documentId: ComputedRef<AMDocumentId | undefined>;
  /**
   * @deprecated
   */
  up: () => Promise<void>;
  /**
   * @deprecated
   */
  open: (state: RepoExplorerState) => Promise<void>;
  /**
   * @deprecated
   */
  closeDocument: () => Promise<void>;
}

/**
 * @deprecated -- // todo: заменить на props из query
 */
export const useMainNavigate = createGlobalState((): UseRepoExplorerState => {
  const route = useRoute();
  const router = useRouter();

  const path = computed(
    () =>
      object({
        path: zodEntryPath,
      }).safeParse(route.query).data?.path,
  );

  const documentId = computed(
    () =>
      object({
        document: zodDocumentId,
      }).safeParse(route.query).data?.document,
  );

  const set = async (
    state: RepoExplorerState,
    mode: 'push' | 'replace' = 'replace',
  ) => {
    await router[mode]({
      query: {
        ...route.query,
        ...state,
      },
    });
  };

  const put = async (
    state: PartialDeep<RepoExplorerState>,
    mode: 'push' | 'replace' = 'replace',
  ) => {
    await set(
      {
        path: path.value,
        document: state.document,
        ...state,
      },
      mode,
    );
  };

  const up = async () => {
    await put(
      {
        path: path.value?.length ? path.value.slice(0, -1) : undefined,
      },
      'push',
    );
  };

  const open = async (
    state: RepoExplorerState = {
      path: undefined,
      document: undefined,
    },
  ) => {
    await set(state, 'push');
  };

  const state: RepoExplorerState = reactive({
    path,
    document: documentId,
  });

  const closeDocument = async () => {
    await put(
      {
        document: undefined,
      },
      'push',
    );
  };

  return {
    state: readonly(state),
    directoryPath: computed((): EntryPath | undefined =>
      path.value?.length ? path.value : undefined,
    ),
    directoryPathString: computed((): EntryPathString | undefined =>
      path.value?.length ? stringPath(path.value) : undefined,
    ),
    documentId,
    up,
    open,
    closeDocument,
  };
});
