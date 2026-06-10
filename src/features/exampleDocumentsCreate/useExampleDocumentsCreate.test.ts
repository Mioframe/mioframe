import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
import { DomainError } from '@shared/lib/error';
import { useExampleDocumentsCreate } from './useExampleDocumentsCreate';

const {
  createDirectoryMock,
  createDocumentMock,
  directoryContentFetchMock,
  captureDiagnosticExceptionMock,
} = vi.hoisted(() => ({
  createDirectoryMock: vi.fn(),
  createDocumentMock: vi.fn(),
  directoryContentFetchMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      createDirectory: createDirectoryMock,
      directoryContent: {
        fetch: directoryContentFetchMock,
      },
    },
    repositories: {
      createDocument: createDocumentMock,
    },
  }),
}));

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
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
    directoryContentFetchMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();

    directoryContentFetchMock.mockResolvedValue([]);
    createDirectoryMock.mockResolvedValue(undefined);
    createDocumentMock
      .mockResolvedValueOnce('related-doc-id')
      .mockResolvedValueOnce('primary-doc-id')
      .mockResolvedValueOnce('related-doc-id')
      .mockResolvedValueOnce('primary-doc-id');
  });

  it('selects Examples 2 without calling createDirectory for Examples when Examples already exists in the listing', async () => {
    directoryContentFetchMock.mockResolvedValueOnce([['Examples', { type: 'directory' }]]);

    const { createWeeklyPlanExample, weeklyPlanErrorMessage, isCreatingWeeklyPlanExample } =
      useExampleDocumentsCreate();

    const result = await createWeeklyPlanExample();

    expect(createDirectoryMock).toHaveBeenCalledTimes(1);
    expect(createDirectoryMock).toHaveBeenCalledWith('/Device Files/Browser Storage/Examples 2');
    expect(createDirectoryMock).not.toHaveBeenCalledWith('/Device Files/Browser Storage/Examples');
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

  it('does not leave VFS activity in an error state when Examples already exists — no FileExists createDirectory attempt is made', async () => {
    directoryContentFetchMock.mockResolvedValueOnce([
      ['Examples', { type: 'directory' }],
      ['Examples 2', { type: 'directory' }],
    ]);

    const { createWeeklyPlanExample } = useExampleDocumentsCreate();

    const result = await createWeeklyPlanExample();

    expect(createDirectoryMock).toHaveBeenCalledTimes(1);
    expect(createDirectoryMock).toHaveBeenCalledWith('/Device Files/Browser Storage/Examples 3');
    expect(createDirectoryMock).not.toHaveBeenCalledWith('/Device Files/Browser Storage/Examples');
    expect(createDirectoryMock).not.toHaveBeenCalledWith(
      '/Device Files/Browser Storage/Examples 2',
    );
    expect(result).toEqual({
      documentDirectory: '/Device Files/Browser Storage/Examples 3',
      documentId: 'primary-doc-id',
    });
  });

  it('retries to the next available name when a race-condition FileExists occurs on the selected name', async () => {
    directoryContentFetchMock.mockResolvedValueOnce([]);
    createDirectoryMock
      .mockRejectedValueOnce(new VfsError(FileSystemError.FileExists, 'Directory already exists'))
      .mockResolvedValueOnce(undefined);

    const { createWeeklyPlanExample, weeklyPlanErrorMessage } = useExampleDocumentsCreate();

    const result = await createWeeklyPlanExample();

    expect(createDirectoryMock).toHaveBeenNthCalledWith(
      1,
      '/Device Files/Browser Storage/Examples',
    );
    expect(createDirectoryMock).toHaveBeenNthCalledWith(
      2,
      '/Device Files/Browser Storage/Examples 2',
    );
    expect(result).toEqual({
      documentDirectory: '/Device Files/Browser Storage/Examples 2',
      documentId: 'primary-doc-id',
    });
    expect(weeklyPlanErrorMessage.value).toBeUndefined();
  });

  it('reports a safe handled diagnostic and sets a safe error message on final failure', async () => {
    createDirectoryMock.mockRejectedValueOnce(new Error('No permission to create directory'));

    const { createWeeklyPlanExample, weeklyPlanErrorMessage } = useExampleDocumentsCreate();

    const result = await createWeeklyPlanExample();

    expect(createDirectoryMock).toHaveBeenCalledTimes(1);
    expect(createDocumentMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(weeklyPlanErrorMessage.value).toBe('Could not create example');

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledOnce();
    const [reportedError, context] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(context).toEqual({
      feature: 'exampleDocumentsCreate',
      action: 'createWeeklyPlanExample',
    });
  });

  it('does not include raw paths, directory names, or raw error messages in the reported diagnostic', async () => {
    createDirectoryMock.mockRejectedValueOnce(
      new Error('ENOENT: no such file or directory, mkdir /private/Examples'),
    );

    const { createWeeklyPlanExample } = useExampleDocumentsCreate();

    await createWeeklyPlanExample();

    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    if (!(reportedError instanceof DomainError)) return;

    expect(reportedError.message).not.toContain('/');
    expect(reportedError.message).not.toContain('Examples');
    expect(reportedError.message).not.toContain('ENOENT');
    expect(reportedError.message).not.toContain('mkdir');

    expect(reportedError.cause).toBeInstanceOf(Error);
    if (!(reportedError.cause instanceof Error)) return;
    expect(reportedError.cause.message).not.toContain('/');
    expect(reportedError.cause.message).not.toContain('Examples');
    expect(reportedError.cause.message).not.toContain('ENOENT');
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
    expect(weeklyPlanErrorMessage.value).toBe('Could not create example');
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledOnce();
  });

  it('creates a shopping example and reports safe diagnostics when creation fails', async () => {
    createDocumentMock
      .mockReset()
      .mockResolvedValueOnce('purchase-types-doc-id')
      .mockRejectedValueOnce(new Error('Cannot write document'));

    const { createShoppingExample, shoppingErrorMessage, isCreatingShoppingExample } =
      useExampleDocumentsCreate();

    const result = await createShoppingExample();

    expect(createDirectoryMock).toHaveBeenCalledWith('/Device Files/Browser Storage/Examples');
    expect(getCreatedDocumentName(0)).toBe('Purchase Types');
    expect(result).toBeUndefined();
    expect(shoppingErrorMessage.value).toBe('Could not create example');
    expect(isCreatingShoppingExample.value).toBe(false);
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledOnce();
    const [, context] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(context).toEqual({
      feature: 'exampleDocumentsCreate',
      action: 'createShoppingExample',
    });
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
