import type { AMDocHandle } from '@shared/lib/automerge';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import { zodDocumentId } from '@shared/lib/fsStorageAdapter';
import type { DirectoryGDriveEntry } from '@shared/lib/googleDrive';
import type { DirectoryLocalEntry } from '@shared/lib/localFileSystem';
import { asyncComputed, createGlobalState } from '@vueuse/core';
import { useBrowserStorage } from '@widget/BrowserStorage/useBrowserStorage';
import type { PartialDeep, ReadonlyDeep } from 'type-fest';
import type { ComputedRef } from 'vue';
import { computed, nextTick, reactive, readonly } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { output } from 'zod/v4-mini';
import { array, literal, object, string, union } from 'zod/v4-mini';

const zodPath = array(string());

export const OPFS = 'Origin private file system';

const zodProvider = union([literal('browser')]);

export interface RepoExplorerState {
  /**
   * Провайдер директорий
   */
  provider: output<typeof zodProvider> | undefined;
  /**
   * Путь к директории
   */
  path: output<typeof zodPath> | undefined;
  /**
   * Выбранный документ в директории
   */
  document: output<typeof zodDocumentId> | undefined;
}

interface UseRepoExplorerState {
  state: ReadonlyDeep<RepoExplorerState>;
  directoryEntry: ComputedRef<DirectoryLocalEntry | undefined>;
  documentHandle: ComputedRef<AMDocHandle | undefined>;
  up: () => Promise<void>;
  open: (state: RepoExplorerState) => Promise<void>;
}

export const useRepoExplorerState = createGlobalState(
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
          document: zodDocumentId,
        }).safeParse(route.query).data?.document,
    );

    const provider = computed(
      () =>
        object({
          provider: zodProvider,
        }).safeParse(route.query).data?.provider,
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
          provider: provider.value,
          document: state.document,
          ...state,
        },
        mode,
      );
    };

    const up = async () => {
      await put({
        path: path.value?.length ? path.value.slice(0, -1) : undefined,
        document: undefined,
        provider: path.value?.length ? provider.value : undefined,
      });
    };

    const open = async (
      state: RepoExplorerState = {
        path: undefined,
        provider: undefined,
        document: undefined,
      },
    ) => {
      await set(state, 'push');
    };

    const { getAndRequestMountDirectory } = useBrowserStorage();

    const rootName = computed(() => path.value?.at(0));

    const rootEntry = asyncComputed(
      async (): Promise<
        undefined | DirectoryLocalEntry | DirectoryGDriveEntry
      > => {
        switch (provider.value) {
          case 'browser': {
            // TODO: разделить провайдеры на точки входа, OFPS отдельно от пользовательских, rootEntry получать через watch
            await nextTick();
            const entry = await getAndRequestMountDirectory(rootName.value);
            if (!rootName.value) {
              await put(
                {
                  path: [entry.name],
                },
                'replace',
              );
            }
            return entry;
          }
        }
        return undefined;
      },
      undefined,
      {
        lazy: true,
        shallow: true,
      },
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

    return {
      state: readonly(
        reactive({
          path,
          provider,
          document: documentId,
        }),
      ),
      directoryEntry: currentDirectory,
      documentHandle,
      up,
      open,
    };
  },
);
