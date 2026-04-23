import { OPFSName } from '@shared/service/directories';
import { useMainServiceClient } from '@shared/service';
import { computed, ref } from 'vue';
import { DEVICE_FILES } from '@entity/mountedDirectories';
import { PathUtils, FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  createPurchaseTypesExampleDocument,
  createShoppingListExampleDocument,
  createStatusesExampleDocument,
  createWeeklyPlanExampleDocument,
} from '@shared/lib/databaseDocument';

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
      const statuses = createStatusesExampleDocument();
      const statusesDocumentId = await createDocument(documentDirectory, statuses.content);
      const weeklyPlan = createWeeklyPlanExampleDocument({
        documentId: statusesDocumentId,
        viewId: statuses.defaultViewId,
        itemIds: statuses.itemIds,
      });
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
      const purchaseTypes = createPurchaseTypesExampleDocument();
      const purchaseTypesDocumentId = await createDocument(
        documentDirectory,
        purchaseTypes.content,
      );
      const shoppingList = createShoppingListExampleDocument({
        documentId: purchaseTypesDocumentId,
        viewId: purchaseTypes.defaultViewId,
        itemIds: purchaseTypes.itemIds,
      });
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
