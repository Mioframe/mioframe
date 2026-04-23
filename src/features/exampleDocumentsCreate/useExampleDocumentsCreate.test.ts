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
});
