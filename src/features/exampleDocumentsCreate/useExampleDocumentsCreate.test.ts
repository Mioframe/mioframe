import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
import { useExampleDocumentsCreate } from './useExampleDocumentsCreate';

const createDirectoryMock = vi.fn();
const createDocumentMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      createDirectory: createDirectoryMock,
    },
    repositories: {
      createDocument: createDocumentMock,
    },
  }),
}));

const getCreatedDocumentName = (callIndex: number) => {
  const content = createDocumentMock.mock.calls[callIndex]?.[1];

  if (
    typeof content !== 'object' ||
    content === null ||
    !('name' in content) ||
    typeof content.name !== 'string'
  ) {
    throw new Error(`Expected document content with a name at call ${callIndex}`);
  }

  return content.name;
};

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
};

describe('useExampleDocumentsCreate', () => {
  beforeEach(() => {
    createDirectoryMock.mockReset();
    createDocumentMock.mockReset();
    createDirectoryMock.mockResolvedValue(undefined);
    createDocumentMock
      .mockResolvedValueOnce('related-doc-id')
      .mockResolvedValueOnce('primary-doc-id')
      .mockResolvedValueOnce('related-doc-id')
      .mockResolvedValueOnce('primary-doc-id');
  });

  it('creates a weekly plan example pair in the first available indexed OPFS directory', async () => {
    createDirectoryMock.mockRejectedValueOnce(
      new VfsError(FileSystemError.FileExists, 'Directory already exists'),
    );

    const { createWeeklyPlanExample, weeklyPlanErrorMessage, isCreatingWeeklyPlanExample } =
      useExampleDocumentsCreate();

    const result = await createWeeklyPlanExample();

    expect(createDirectoryMock).toHaveBeenNthCalledWith(
      1,
      '/Device Files/Browser Storage/Examples',
    );
    expect(createDirectoryMock).toHaveBeenNthCalledWith(
      2,
      '/Device Files/Browser Storage/Examples 2',
    );
    expect(createDocumentMock).toHaveBeenCalledTimes(2);
    expect(createDocumentMock.mock.calls[0]?.[0]).toBe('/Device Files/Browser Storage/Examples 2');
    expect(getCreatedDocumentName(0)).toBe('Statuses');
    expect(getCreatedDocumentName(1)).toBe('Plan Week');
    expect(result).toEqual({
      documentDirectory: '/Device Files/Browser Storage/Examples 2',
      documentId: 'primary-doc-id',
    });
    expect(weeklyPlanErrorMessage.value).toBeUndefined();
    expect(isCreatingWeeklyPlanExample.value).toBe(false);
  });

  it('creates a shopping example pair and reports errors when creation fails', async () => {
    createDocumentMock
      .mockReset()
      .mockResolvedValueOnce('purchase-types-doc-id')
      .mockRejectedValueOnce(new Error('Cannot write document'));

    const { createShoppingExample, shoppingErrorMessage, isCreatingShoppingExample } =
      useExampleDocumentsCreate();

    const result = await createShoppingExample();

    expect(createDirectoryMock).toHaveBeenCalledWith('/Device Files/Browser Storage/Examples');
    expect(getCreatedDocumentName(0)).toBe('Purchase Types');
    expect(getCreatedDocumentName(1)).toBe('Shopping List');
    expect(result).toBeUndefined();
    expect(shoppingErrorMessage.value).toBe('Cannot write document');
    expect(isCreatingShoppingExample.value).toBe(false);
  });

  it('reports weekly plan errors when creating the example directory fails for a non-existing-directory reason', async () => {
    createDirectoryMock.mockRejectedValueOnce(new Error('No permission to create directory'));

    const { createWeeklyPlanExample, weeklyPlanErrorMessage } = useExampleDocumentsCreate();

    const result = await createWeeklyPlanExample();

    expect(createDirectoryMock).toHaveBeenCalledTimes(1);
    expect(createDocumentMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(weeklyPlanErrorMessage.value).toBe('No permission to create directory');
  });

  it('does not retry directory creation for VfsError codes other than FileExists', async () => {
    createDirectoryMock.mockRejectedValueOnce(
      new VfsError(FileSystemError.NoPermissions, 'No permission to create directory'),
    );

    const { createWeeklyPlanExample, weeklyPlanErrorMessage } = useExampleDocumentsCreate();

    const result = await createWeeklyPlanExample();

    expect(createDirectoryMock).toHaveBeenCalledTimes(1);
    expect(createDocumentMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(weeklyPlanErrorMessage.value).toBe('No permission to create directory');
  });

  it('exposes weekly loading while creation is in flight and clears it after completion', async () => {
    const firstCreateDocument = createDeferred<string>();

    createDocumentMock.mockReset();
    createDocumentMock
      .mockReturnValueOnce(firstCreateDocument.promise)
      .mockResolvedValueOnce('primary-doc-id');

    const { createWeeklyPlanExample, isCreatingWeeklyPlanExample } = useExampleDocumentsCreate();

    const resultPromise = createWeeklyPlanExample();

    expect(isCreatingWeeklyPlanExample.value).toBe(true);

    firstCreateDocument.resolve('related-doc-id');

    const result = await resultPromise;

    expect(result).toEqual({
      documentDirectory: '/Device Files/Browser Storage/Examples',
      documentId: 'primary-doc-id',
    });
    expect(isCreatingWeeklyPlanExample.value).toBe(false);
  });

  it('exposes shopping loading while creation is in flight and returns the created document payload', async () => {
    const firstCreateDocument = createDeferred<string>();

    createDocumentMock.mockReset();
    createDocumentMock
      .mockReturnValueOnce(firstCreateDocument.promise)
      .mockResolvedValueOnce('shopping-doc-id');

    const { createShoppingExample, isCreatingShoppingExample, shoppingErrorMessage } =
      useExampleDocumentsCreate();

    const resultPromise = createShoppingExample();

    expect(isCreatingShoppingExample.value).toBe(true);

    firstCreateDocument.resolve('purchase-types-doc-id');

    const result = await resultPromise;

    expect(result).toEqual({
      documentDirectory: '/Device Files/Browser Storage/Examples',
      documentId: 'shopping-doc-id',
    });
    expect(shoppingErrorMessage.value).toBeUndefined();
    expect(isCreatingShoppingExample.value).toBe(false);
  });
});
