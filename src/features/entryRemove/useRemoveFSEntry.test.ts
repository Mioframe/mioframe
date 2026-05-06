import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRemoveFSEntry } from './useRemoveFSEntry';
import { DomainError } from '@shared/lib/error';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';

const { addSnackbarMock, confirmMock, removeEntryMock, reportHandledErrorMock } = vi.hoisted(
  () => ({
    addSnackbarMock: vi.fn(),
    confirmMock: vi.fn(),
    removeEntryMock: vi.fn(),
    reportHandledErrorMock: vi.fn(),
  }),
);

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

vi.mock('@shared/lib/reportHandledError', () => ({
  reportHandledError: reportHandledErrorMock,
}));

describe('useRemoveFSEntry', () => {
  beforeEach(() => {
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    removeEntryMock.mockReset();
    reportHandledErrorMock.mockReset();
  });

  it('shows a snackbar, reports, and does not rethrow when non-recursive remove fails', async () => {
    const error = new Error('remove failed');
    confirmMock.mockResolvedValueOnce(true);
    removeEntryMock.mockRejectedValueOnce(error);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(removeEntryMock).toHaveBeenCalledWith('/docs/file.json');
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not remove the item',
    });
    expect(reportHandledErrorMock).toHaveBeenCalledWith(error, {
      feature: 'entryRemove',
      action: 'removeEntry',
      path: '/docs/file.json',
    });
  });

  it('shows a snackbar, reports, and does not rethrow when recursive remove fails', async () => {
    const directoryNotEmptyError = new VfsError(FileSystemError.DirectoryNotEmpty);
    const recursiveError = new DomainError('Could not remove the directory');
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
    expect(reportHandledErrorMock).toHaveBeenCalledWith(recursiveError, {
      feature: 'entryRemove',
      action: 'removeEntryRecursive',
      path: '/docs/folder',
    });
  });

  it('does not remove or report when the user cancels confirmation', async () => {
    confirmMock.mockResolvedValueOnce(false);

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/file.json')).resolves.toBeUndefined();

    expect(removeEntryMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('does not report when the directory is not empty and the user declines recursive removal', async () => {
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    removeEntryMock.mockRejectedValueOnce(new VfsError(FileSystemError.DirectoryNotEmpty));

    const { remove } = useRemoveFSEntry();

    await expect(remove('/docs/folder')).resolves.toBeUndefined();

    expect(removeEntryMock).toHaveBeenCalledTimes(1);
    expect(removeEntryMock).toHaveBeenCalledWith('/docs/folder');
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });
});
