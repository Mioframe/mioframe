import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRemoveFSEntry } from './useRemoveFSEntry';
import { DomainError } from '@shared/lib/error';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';

const {
  addSnackbarMock,
  confirmMock,
  removeEntryMock,
  captureDiagnosticExceptionMock,
  requestDiagnosticsErrorPromptMock,
} = vi.hoisted(() => ({
  addSnackbarMock: vi.fn(),
  confirmMock: vi.fn(),
  removeEntryMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
  requestDiagnosticsErrorPromptMock: vi.fn(),
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

vi.mock('@feature/diagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPromptTrigger: () => ({
    requestDiagnosticsErrorPrompt: requestDiagnosticsErrorPromptMock,
  }),
}));

describe('useRemoveFSEntry', () => {
  beforeEach(() => {
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    removeEntryMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    requestDiagnosticsErrorPromptMock.mockReset();
  });

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
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls.at(-1) ?? [];
    expect(options).toEqual({ feature: 'entryRemove', action: 'removeEntry' });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      message: 'Could not remove the item',
      code: 'entryRemove.removeFailed',
    });
    expect(reportedError.cause).toBe(error);
    expect(reportedError.message).not.toContain('/docs');
    expect(reportedError.message).not.toContain('gd-123');
    expect(requestDiagnosticsErrorPromptMock).toHaveBeenCalledWith({
      source: 'entryRemove',
      placement: 'home',
    });
  });

  it('preserves VfsError as raw cause for non-recursive remove failures', async () => {
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
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls.at(-1) ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      message: 'Could not remove the item',
      code: 'entryRemove.removeFailed',
    });
    expect(reportedError.cause).toBe(error);
    expect(reportedError.message).not.toContain('/docs');
    expect(reportedError.message).not.toContain('gd-123');
  });

  it('shows a snackbar, reports, and does not rethrow when recursive remove fails', async () => {
    const directoryNotEmptyError = new VfsError(FileSystemError.DirectoryNotEmpty);
    const recursiveError = new Error('Failed to remove /docs/folder/private recursively');
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
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls.at(-1) ?? [];
    expect(options).toEqual({ feature: 'entryRemove', action: 'removeEntryRecursive' });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      message: 'Could not remove the directory',
      code: 'entryRemove.recursiveRemoveFailed',
    });
    expect(reportedError.cause).toBe(recursiveError);
    expect(reportedError.message).not.toContain('/docs');
    expect(requestDiagnosticsErrorPromptMock).toHaveBeenCalledWith({
      source: 'entryRemove',
      placement: 'home',
    });
  });

  it('preserves upstream error as raw cause for recursive removal failures', async () => {
    const directoryNotEmptyError = new VfsError(FileSystemError.DirectoryNotEmpty);
    const recursiveError = new Error('Failed to remove /docs/folder/private for gd-456');
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    removeEntryMock
      .mockRejectedValueOnce(directoryNotEmptyError)
      .mockRejectedValueOnce(recursiveError);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/folder')).resolves.toBeUndefined();

    const [reportedError] = captureDiagnosticExceptionMock.mock.calls.at(-1) ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      message: 'Could not remove the directory',
      code: 'entryRemove.recursiveRemoveFailed',
    });
    expect(reportedError.cause).toBe(recursiveError);
    expect(reportedError.message).not.toContain('/docs');
    expect(reportedError.message).not.toContain('gd-456');
  });

  it('preserves upstream DomainError as raw cause for non-recursive remove failures', async () => {
    const error = new DomainError('Could not remove /docs/file.json for gd-123', {
      code: 'upstream-remove-failed',
    });
    confirmMock.mockResolvedValueOnce(true);
    removeEntryMock.mockRejectedValueOnce(error);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not remove the item',
    });
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls.at(-1) ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      message: 'Could not remove the item',
      code: 'entryRemove.removeFailed',
    });
    expect(reportedError.cause).toBe(error);
    expect(reportedError.message).not.toContain('/docs');
    expect(reportedError.message).not.toContain('gd-123');
  });

  it('does not remove or report when the user cancels confirmation', async () => {
    confirmMock.mockResolvedValueOnce(false);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(removeEntryMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(requestDiagnosticsErrorPromptMock).not.toHaveBeenCalled();
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
    expect(requestDiagnosticsErrorPromptMock).not.toHaveBeenCalled();
  });
});
