import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useEntryManageDialogState } from './useEntryManageDialogState';

const { exportDirectoryZipMock, importDirectoryZipMock } = vi.hoisted(() => ({
  exportDirectoryZipMock: vi.fn(),
  importDirectoryZipMock: vi.fn(),
}));

vi.mock('@feature/entryRemove', () => ({
  useRemoveFSEntry: () => ({ remove: vi.fn() }),
}));

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({ importDocument: vi.fn() }),
}));

vi.mock('@feature/exportZip', () => ({
  useExportDirectoryZip: () => ({
    exportDirectoryZip: exportDirectoryZipMock,
    progress: ref(undefined),
    isRunning: ref(false),
  }),
}));

vi.mock('@feature/importZip', () => ({
  useImportZipAction: () => ({
    importDirectoryZip: importDirectoryZipMock,
    progress: ref(undefined),
    isRunning: ref(false),
  }),
}));

describe('useEntryManageDialogState', () => {
  it('closes the create directory, create document, and rename dialogs when the path changes', async () => {
    const path = ref('/repo/a');
    const { showCreateDirectoryDialog, showCreateDocumentDialog, showRenameDialog } =
      useEntryManageDialogState(path);

    showCreateDirectoryDialog.value = true;
    showCreateDocumentDialog.value = true;
    showRenameDialog.value = true;

    path.value = '/repo/b';
    await Promise.resolve();

    expect(showCreateDirectoryDialog.value).toBe(false);
    expect(showCreateDocumentDialog.value).toBe(false);
    expect(showRenameDialog.value).toBe(false);
  });

  it('keeps dialogs closed by default and opens them only through their select handlers', () => {
    const path = ref('/repo/a');
    const { showCreateDirectoryDialog, showRenameDialog, onSelectCreateDirectory, onSelectRename } =
      useEntryManageDialogState(path);

    expect(showCreateDirectoryDialog.value).toBe(false);
    expect(showRenameDialog.value).toBe(false);

    onSelectCreateDirectory();
    expect(showCreateDirectoryDialog.value).toBe(true);

    onSelectRename();
    expect(showRenameDialog.value).toBe(true);
  });

  it('delegates ZIP export/import selections to their respective actions', async () => {
    const path = ref('/repo/a');
    const { onSelectExportZip, onSelectImportZip } = useEntryManageDialogState(path);

    await onSelectExportZip();
    expect(exportDirectoryZipMock).toHaveBeenCalledWith('/repo/a');

    await onSelectImportZip();
    expect(importDirectoryZipMock).toHaveBeenCalledWith('/repo/a');
  });

  it('exposes ZIP export/import running state for the progress surfaces', () => {
    const path = ref('/repo/a');
    const { isExportZipRunning, isImportZipRunning } = useEntryManageDialogState(path);

    expect(isExportZipRunning.value).toBe(false);
    expect(isImportZipRunning.value).toBe(false);
  });
});
