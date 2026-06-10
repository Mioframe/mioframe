import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRemoveFSEntry } from './useRemoveFSEntry';
import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';

const { addSnackbarMock, confirmMock, removeEntryMock, captureDiagnosticExceptionMock } =
  vi.hoisted(() => ({
    addSnackbarMock: vi.fn(),
    confirmMock: vi.fn(),
    removeEntryMock: vi.fn(),
    captureDiagnosticExceptionMock: vi.fn(),
  }));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    remove: removeEntryMock,
  }),
}));

vi.mock('@shared/ui/Dialog', () => ({
  useDialog: () => ({
    confirm: confirmMock,
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
}));

describe('useRemoveFSEntry', () => {
  beforeEach(() => {
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    removeEntryMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
  });

  const expectSafeReportedDomainError = ({
    action,
    code,
    message,
    causeMessage,
  }: {
    action: 'removeEntry' | 'removeEntryRecursive';
    code: 'remove-failed' | 'recursive-remove-failed';
    message: string;
    causeMessage: string;
  }) => {
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message,
        code,
        cause: expect.objectContaining({
          message: causeMessage,
        }),
      }),
      {
        feature: 'entryRemove',
        action,
      },
    );

    const [reportedError] = captureDiagnosticExceptionMock.mock.calls.at(-1) ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).not.toBeInstanceOf(VfsError);
    if (!(reportedError instanceof DomainError)) {
      throw new Error('Expected a DomainError to be reported');
    }
    expect(reportedError.message).not.toContain('/docs/file.json');
    expect(reportedError.message).not.toContain('/docs/folder/private');
    expect(reportedError.message).not.toContain('file.json');
    expect(reportedError.message).not.toContain('gd-123');
    expect(reportedError.cause).toBeInstanceOf(Error);
    if (!(reportedError.cause instanceof Error)) {
      throw new Error('Expected a safe Error cause to be reported');
    }
    expect(reportedError.cause.message).toBe(causeMessage);
    expect(reportedError.cause.message).not.toContain('/docs');
    expect(reportedError.cause.message).not.toContain('file.json');
    expect(reportedError.cause.message).not.toContain('gd-');
    expect(reportedError.cause.message).not.toContain('provider');
  };

  it('uses basename-only confirmation copy for removal', async () => {
    confirmMock.mockResolvedValueOnce(false);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Remove "file.json"?',
      supportingText: 'This item will be removed.',
      confirmLabel: 'Remove',
      symbolName: 'delete',
    });
  });

  it('shows a snackbar, reports, and does not rethrow when non-recursive remove fails', async () => {
    const error = new Error('Failed to remove /docs/file.json for gd-123');
    confirmMock.mockResolvedValueOnce(true);
    removeEntryMock.mockRejectedValueOnce(error);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(removeEntryMock).toHaveBeenCalledWith('/docs/file.json');
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not remove the item',
    });
    expectSafeReportedDomainError({
      action: 'removeEntry',
      code: 'remove-failed',
      message: 'Could not remove the item',
      causeMessage: 'File system remove operation failed',
    });
  });

  it('wraps VfsError removal failures into a safe reportable DomainError', async () => {
    const error = new VfsError(
      FileSystemError.NoPermissions,
      'File system delete operation is not allowed for /docs/file.json in provider gd-123',
    );
    confirmMock.mockResolvedValueOnce(true);
    removeEntryMock.mockRejectedValueOnce(error);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not remove the item',
    });
    expectSafeReportedDomainError({
      action: 'removeEntry',
      code: 'remove-failed',
      message: 'Could not remove the item',
      causeMessage: 'File system remove operation failed',
    });
  });

  it('shows a snackbar, reports, and does not rethrow when recursive remove fails', async () => {
    const directoryNotEmptyError = new VfsError(FileSystemError.DirectoryNotEmpty);
    const recursiveError = new DomainError('Could not remove the directory', {
      cause: createSafeErrorCause('Unexpected storage backend detail for /docs/folder/private'),
    });
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    removeEntryMock
      .mockRejectedValueOnce(directoryNotEmptyError)
      .mockRejectedValueOnce(recursiveError);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/folder')).resolves.toBeUndefined();

    expect(removeEntryMock).toHaveBeenNthCalledWith(1, '/docs/folder');
    expect(removeEntryMock).toHaveBeenNthCalledWith(2, '/docs/folder', true);
    expect(addSnackbarMock).toHaveBeenNthCalledWith(1, {
      text: 'Removing directory with nested entries...',
    });
    expect(addSnackbarMock).toHaveBeenNthCalledWith(2, {
      text: 'Could not remove the directory',
    });
    expectSafeReportedDomainError({
      action: 'removeEntryRecursive',
      code: 'recursive-remove-failed',
      message: 'Could not remove the directory',
      causeMessage: 'File system recursive remove operation failed',
    });
  });

  it('wraps untrusted recursive removal errors before reporting', async () => {
    const directoryNotEmptyError = new VfsError(FileSystemError.DirectoryNotEmpty);
    const recursiveError = new Error('Failed to remove /docs/folder/private for gd-456');
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    removeEntryMock
      .mockRejectedValueOnce(directoryNotEmptyError)
      .mockRejectedValueOnce(recursiveError);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/folder')).resolves.toBeUndefined();

    expectSafeReportedDomainError({
      action: 'removeEntryRecursive',
      code: 'recursive-remove-failed',
      message: 'Could not remove the directory',
      causeMessage: 'File system recursive remove operation failed',
    });
  });

  it('does not forward arbitrary DomainError message or cause text into remove diagnostics', async () => {
    const error = new DomainError('Could not remove /docs/file.json for gd-123', {
      cause: createSafeErrorCause('Provider error for storage key gd-123 at /docs/file.json'),
      code: 'upstream-remove-failed',
    });
    confirmMock.mockResolvedValueOnce(true);
    removeEntryMock.mockRejectedValueOnce(error);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not remove the item',
    });
    expectSafeReportedDomainError({
      action: 'removeEntry',
      code: 'remove-failed',
      message: 'Could not remove the item',
      causeMessage: 'File system remove operation failed',
    });
  });

  it('does not remove or report when the user cancels confirmation', async () => {
    confirmMock.mockResolvedValueOnce(false);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(removeEntryMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('does not report when the directory is not empty and the user declines recursive removal', async () => {
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    removeEntryMock.mockRejectedValueOnce(new VfsError(FileSystemError.DirectoryNotEmpty));

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/folder')).resolves.toBeUndefined();

    expect(removeEntryMock).toHaveBeenCalledTimes(1);
    expect(removeEntryMock).toHaveBeenCalledWith('/docs/folder');
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });
});
