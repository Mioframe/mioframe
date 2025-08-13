import type { AMDocHandle } from '@shared/lib/automerge';
import { zodStrictDocumentId } from '@shared/lib/automerge';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import type { DirectoryLocalEntry } from '@shared/lib/localFileSystem';
import { asyncComputed, createGlobalState } from '@vueuse/core';
import type { PartialDeep, ReadonlyDeep } from 'type-fest';
import type { ComputedRef } from 'vue';
import { computed, reactive, readonly } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { output } from 'zod/v4-mini';
import { array, object, string } from 'zod/v4-mini';
import { useMountedDirectories } from '@entity/mountedDirectories/useMountedDirectories';

const zodPath = array(string());

export interface RepoExplorerState {
  /**
   * Путь к директории
   */
  path: output<typeof zodPath> | undefined;
  /**
   * Выбранный документ в директории
   */
  document: output<typeof zodStrictDocumentId> | undefined;
}

interface UseRepoExplorerState {
  state: ReadonlyDeep<RepoExplorerState>;
  directoryEntry: ComputedRef<DirectoryLocalEntry | undefined>;
  documentHandle: ComputedRef<AMDocHandle | undefined>;
  up: () => Promise<void>;
  open: (state: RepoExplorerState) => Promise<void>;
  closeDocument: () => Promise<void>;
}

export const useRepoExplorerNavigate = createGlobalState(
  (): UseRepoExplorerState => {
    const route = useRoute();
    const router = useRouter();

    const path = computed(
      () =>
        object({
          path: zodPath,
        }).safeParse(route.query).data?.path,
    );
    const documentId = computed(
      () =>
        object({
          document: zodStrictDocumentId,
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

    const rootName = computed(() => path.value?.at(0));

    const { get: getMountedDirectory } = useMountedDirectories();

    const rootEntry = computed(() =>
      rootName.value ? getMountedDirectory(rootName.value) : undefined,
    );

    const currentDirectory = asyncComputed(
      async () => {
        const childPath = path.value?.slice(1);
        const root = rootEntry.value;
        if (root && childPath) {
          let lastDirectory = root;
          for (const name of childPath) {
            const entry = await lastDirectory.get(name);
            if (entry && 'get' in entry) {
              lastDirectory = entry;
            } else {
              throw new Error(
                `directory "${name}" not found in directory "${lastDirectory.name}"`,
              );
            }
          }
          return lastDirectory;
        }
        return undefined;
      },
      undefined,
      {
        lazy: true,
        shallow: true,
      },
    );

    const directoryRepo = useDirectoryRepo(currentDirectory);

    const documentHandle = computed(() =>
      documentId.value
        ? directoryRepo.value?.map.get(documentId.value)
        : undefined,
    );

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
      directoryEntry: computed(() => currentDirectory.value),
      documentHandle,
      up,
      open,
      closeDocument,
    };
  },
);
