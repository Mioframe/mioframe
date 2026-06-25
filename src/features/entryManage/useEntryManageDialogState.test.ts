import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useEntryManageDialogState } from './useEntryManageDialogState';

vi.mock('@feature/entryRemove', () => ({
  useRemoveFSEntry: () => ({ remove: vi.fn() }),
}));

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({ importDocument: vi.fn() }),
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
});
