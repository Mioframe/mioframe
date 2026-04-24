import { OPFSName } from '@shared/service/directories';
import { useMainServiceClient } from '@shared/service';
import { computed, ref } from 'vue';
import { DEVICE_FILES } from '@entity/mountedDirectories';
import { PathUtils, FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  createShoppingListStarterExample,
  createWeeklyPlanStarterExample,
  purchaseTypesStarterExample,
  statusesStarterExample,
} from '@entity/starterExample';
import { createStarterExampleDocument } from './createStarterExampleDocument';

const EXAMPLES_DIRECTORY_NAME = 'Examples';

type ExampleResult = {
  documentDirectory: string;
  documentId: AMDocumentId;
};

const isAlreadyExistingDirectoryError = (error: unknown) =>
  error instanceof VfsError && error.code === FileSystemError.FileExists;

export const useExampleDocumentsCreate = () => {
  const {
    fileSystem: { createDirectory },
    repositories: { createDocument },
  } = useMainServiceClient();

  const activeExample = ref<'weekly' | 'shopping' | undefined>();
  const weeklyPlanErrorMessage = ref<string>();
  const shoppingErrorMessage = ref<string>();

  const exampleRootPath = computed(() => PathUtils.join('/', DEVICE_FILES, OPFSName));

  const createIndexedExampleDirectory = async () => {
    let index = 1;

    for (;;) {
      const directoryName =
        index === 1 ? EXAMPLES_DIRECTORY_NAME : `${EXAMPLES_DIRECTORY_NAME} ${index}`;
      const nextDirectoryPath = PathUtils.join(exampleRootPath.value, directoryName);

      try {
        // eslint-disable-next-line no-await-in-loop -- this loop must stop at the first available indexed directory
        await createDirectory(nextDirectoryPath);
        return nextDirectoryPath;
      } catch (error) {
        if (isAlreadyExistingDirectoryError(error)) {
          index += 1;
          continue;
        }

        throw error;
      }
    }
  };

  const createWeeklyPlanExample = async (): Promise<ExampleResult | undefined> => {
    weeklyPlanErrorMessage.value = undefined;
    activeExample.value = 'weekly';

    try {
      const documentDirectory = await createIndexedExampleDirectory();
      const statusesDocumentId = await createDocument(
        documentDirectory,
        createStarterExampleDocument(statusesStarterExample.recipe),
      );
      const weeklyPlan = createStarterExampleDocument(
        createWeeklyPlanStarterExample({
          documentId: statusesDocumentId,
          viewId: statusesStarterExample.defaultViewId,
          itemIds: statusesStarterExample.itemIds,
        }),
      );
      const documentId = await createDocument(documentDirectory, weeklyPlan);

      return {
        documentDirectory,
        documentId,
      };
    } catch (error) {
      weeklyPlanErrorMessage.value =
        error instanceof Error ? error.message : 'Failed to create example';
      return undefined;
    } finally {
      activeExample.value = undefined;
    }
  };

  const createShoppingExample = async (): Promise<ExampleResult | undefined> => {
    shoppingErrorMessage.value = undefined;
    activeExample.value = 'shopping';

    try {
      const documentDirectory = await createIndexedExampleDirectory();
      const purchaseTypesDocumentId = await createDocument(
        documentDirectory,
        createStarterExampleDocument(purchaseTypesStarterExample.recipe),
      );
      const shoppingList = createStarterExampleDocument(
        createShoppingListStarterExample({
          documentId: purchaseTypesDocumentId,
          viewId: purchaseTypesStarterExample.defaultViewId,
          itemIds: purchaseTypesStarterExample.itemIds,
        }),
      );
      const documentId = await createDocument(documentDirectory, shoppingList);

      return {
        documentDirectory,
        documentId,
      };
    } catch (error) {
      shoppingErrorMessage.value =
        error instanceof Error ? error.message : 'Failed to create example';
      return undefined;
    } finally {
      activeExample.value = undefined;
    }
  };

  return {
    createShoppingExample,
    createWeeklyPlanExample,
    isCreatingShoppingExample: computed(() => activeExample.value === 'shopping'),
    isCreatingWeeklyPlanExample: computed(() => activeExample.value === 'weekly'),
    shoppingErrorMessage,
    weeklyPlanErrorMessage,
  };
};
