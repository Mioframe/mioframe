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
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { createStarterExampleDocument } from './createStarterExampleDocument';

const EXAMPLES_DIRECTORY_NAME = 'Examples';
const EXAMPLE_CREATE_ERROR_MESSAGE = 'Could not create example';
const MAX_EXAMPLE_DIRECTORY_ATTEMPTS = 100;

type ExampleResult = {
  documentDirectory: string;
  documentId: AMDocumentId;
};

const isAlreadyExistingDirectoryError = (error: unknown) =>
  error instanceof VfsError && error.code === FileSystemError.FileExists;

const classifyExampleCreateError = (error: unknown): string => {
  if (error instanceof VfsError) {
    switch (error.code) {
      case FileSystemError.FileExists:
        return 'example-create-vfs-file-exists';
      case FileSystemError.NoPermissions:
        return 'example-create-vfs-permission-required';
      case FileSystemError.Unknown:
        return 'example-create-vfs-unknown';
      default:
        return 'example-create-vfs-access-denied';
    }
  }
  return 'example-create-unexpected';
};

/**
 * Composable for creating starter example documents in the first available indexed OPFS directory.
 * Pre-inspects existing entries before creating so that expected existing directories do not
 * leave a VFS activity error. Falls back to `FileExists` retry only for race conditions.
 * @returns Actions and reactive state for weekly plan and shopping starter example creation.
 */
export const useExampleDocumentsCreate = () => {
  const {
    fileSystem: { createDirectory, directoryContent },
    repositories: { createDocument },
  } = useMainServiceClient();

  const activeExample = ref<'weekly' | 'shopping' | undefined>();
  const weeklyPlanErrorMessage = ref<string>();
  const shoppingErrorMessage = ref<string>();

  const exampleRootPath = computed(() => PathUtils.join('/', DEVICE_FILES, OPFSName));

  const listExistingNames = async (): Promise<Set<string>> => {
    try {
      const result = await directoryContent.fetch({ path: exampleRootPath.value });
      if (!result || result instanceof Error) return new Set<string>();
      return new Set(result.map(([name]) => name));
    } catch {
      return new Set<string>();
    }
  };

  const createIndexedExampleDirectory = async () => {
    const existingNames = await listExistingNames();
    let index = 1;

    for (;;) {
      if (index > MAX_EXAMPLE_DIRECTORY_ATTEMPTS) {
        throw new DomainError(EXAMPLE_CREATE_ERROR_MESSAGE, {
          cause: createSafeErrorCause('example-create-directory-limit-exceeded'),
          code: 'example-create-failed',
        });
      }

      const directoryName =
        index === 1 ? EXAMPLES_DIRECTORY_NAME : `${EXAMPLES_DIRECTORY_NAME} ${index}`;

      if (existingNames.has(directoryName)) {
        index += 1;
        continue;
      }

      const nextDirectoryPath = PathUtils.join(exampleRootPath.value, directoryName);

      try {
        // eslint-disable-next-line no-await-in-loop -- this loop must stop at the first available indexed directory
        await createDirectory(nextDirectoryPath);
        return nextDirectoryPath;
      } catch (error) {
        if (isAlreadyExistingDirectoryError(error)) {
          // Race condition: another operation created the directory between listing and creation
          index += 1;
          continue;
        }

        throw error;
      }
    }
  };

  const makeExampleCreateError = (error: unknown) =>
    new DomainError(EXAMPLE_CREATE_ERROR_MESSAGE, {
      cause: createSafeErrorCause(classifyExampleCreateError(error)),
      code: 'example-create-failed',
    });

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
      weeklyPlanErrorMessage.value = EXAMPLE_CREATE_ERROR_MESSAGE;
      captureDiagnosticException(makeExampleCreateError(error), {
        feature: 'exampleDocumentsCreate',
        action: 'createWeeklyPlanExample',
      });
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
      shoppingErrorMessage.value = EXAMPLE_CREATE_ERROR_MESSAGE;
      captureDiagnosticException(makeExampleCreateError(error), {
        feature: 'exampleDocumentsCreate',
        action: 'createShoppingExample',
      });
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
