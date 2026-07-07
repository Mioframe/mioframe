import { ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { useFSEntryManageActions } from './useFSEntryManageActions';

const makeOptions = (overrides?: {
  entryType?: FSNodeType;
  canEditChildren?: boolean | undefined;
  canChangePath?: boolean | undefined;
  canDelete?: boolean | undefined;
  showDocumentActions?: boolean | undefined;
}) => ({
  entryType: ref(overrides?.entryType ?? FSNodeType.Directory),
  canEditChildren: ref(overrides?.canEditChildren),
  canChangePath: ref(overrides?.canChangePath),
  canDelete: ref(overrides?.canDelete),
  showDocumentActions: ref(overrides?.showDocumentActions),
});

const getKeys = (actions: ReturnType<typeof useFSEntryManageActions>['actionButtons']['value']) =>
  actions.map((a) => a.key);

describe('useFSEntryManageActions', () => {
  describe('directory without document actions', () => {
    it('includes createDirectory when canEditChildren is undefined', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.Directory }),
      );
      expect(getKeys(actionButtons.value)).toContain('createDirectory');
    });

    it('includes createDirectory when canEditChildren is true', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.Directory, canEditChildren: true }),
      );
      expect(getKeys(actionButtons.value)).toContain('createDirectory');
    });

    it('does not include createDirectory when canEditChildren is false', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.Directory, canEditChildren: false }),
      );
      expect(getKeys(actionButtons.value)).not.toContain('createDirectory');
    });

    it('does not include createDocument, importJson, or importZip without showDocumentActions', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.Directory }),
      );
      const keys = getKeys(actionButtons.value);
      expect(keys).not.toContain('createDocument');
      expect(keys).not.toContain('importJson');
      expect(keys).not.toContain('importZip');
    });

    it('still includes exportZip without showDocumentActions', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.Directory }),
      );
      expect(getKeys(actionButtons.value)).toContain('exportZip');
    });
  });

  describe('directory with document actions', () => {
    it('includes createDirectory, createDocument, importJson, and importZip', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.Directory, showDocumentActions: true }),
      );
      const keys = getKeys(actionButtons.value);
      expect(keys).toContain('createDirectory');
      expect(keys).toContain('createDocument');
      expect(keys).toContain('importJson');
      expect(keys).toContain('importZip');
    });

    it('does not include createDocument, importJson, or importZip when canEditChildren is false', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({
          entryType: FSNodeType.Directory,
          canEditChildren: false,
          showDocumentActions: true,
        }),
      );
      const keys = getKeys(actionButtons.value);
      expect(keys).not.toContain('createDocument');
      expect(keys).not.toContain('importJson');
      expect(keys).not.toContain('importZip');
    });

    it('still includes exportZip when canEditChildren is false', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({
          entryType: FSNodeType.Directory,
          canEditChildren: false,
          showDocumentActions: true,
        }),
      );
      expect(getKeys(actionButtons.value)).toContain('exportZip');
    });
  });

  describe('file entry', () => {
    it('does not include directory actions', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.File }),
      );
      const keys = getKeys(actionButtons.value);
      expect(keys).not.toContain('createDirectory');
      expect(keys).not.toContain('createDocument');
      expect(keys).not.toContain('importJson');
      expect(keys).not.toContain('exportZip');
      expect(keys).not.toContain('importZip');
    });
  });

  describe('rename action', () => {
    it('includes rename when canChangePath is undefined', () => {
      const { actionButtons } = useFSEntryManageActions(makeOptions());
      expect(getKeys(actionButtons.value)).toContain('rename');
    });

    it('includes rename when canChangePath is true', () => {
      const { actionButtons } = useFSEntryManageActions(makeOptions({ canChangePath: true }));
      expect(getKeys(actionButtons.value)).toContain('rename');
    });

    it('does not include rename when canChangePath is false', () => {
      const { actionButtons } = useFSEntryManageActions(makeOptions({ canChangePath: false }));
      expect(getKeys(actionButtons.value)).not.toContain('rename');
    });
  });

  describe('remove action', () => {
    it('includes remove when canDelete is undefined', () => {
      const { actionButtons } = useFSEntryManageActions(makeOptions());
      expect(getKeys(actionButtons.value)).toContain('remove');
    });

    it('includes remove when canDelete is true', () => {
      const { actionButtons } = useFSEntryManageActions(makeOptions({ canDelete: true }));
      expect(getKeys(actionButtons.value)).toContain('remove');
    });

    it('does not include remove when canDelete is false', () => {
      const { actionButtons } = useFSEntryManageActions(makeOptions({ canDelete: false }));
      expect(getKeys(actionButtons.value)).not.toContain('remove');
    });
  });

  describe('hasActions', () => {
    it('is true when there are actions', () => {
      const { hasActions } = useFSEntryManageActions(makeOptions());
      expect(hasActions.value).toBe(true);
    });

    it('is false when all capabilities are false', () => {
      const { hasActions } = useFSEntryManageActions(
        makeOptions({
          entryType: FSNodeType.File,
          canEditChildren: false,
          canChangePath: false,
          canDelete: false,
        }),
      );
      expect(hasActions.value).toBe(false);
    });
  });

  describe('action ordering', () => {
    it('produces createDirectory before rename before remove for a directory', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({ entryType: FSNodeType.Directory, canChangePath: true, canDelete: true }),
      );
      const keys = getKeys(actionButtons.value);
      expect(keys.indexOf('createDirectory')).toBeLessThan(keys.indexOf('rename'));
      expect(keys.indexOf('rename')).toBeLessThan(keys.indexOf('remove'));
    });

    it('produces createDirectory, createDocument, rename, exportZip, importJson, importZip, remove in order', () => {
      const { actionButtons } = useFSEntryManageActions(
        makeOptions({
          entryType: FSNodeType.Directory,
          canEditChildren: true,
          canChangePath: true,
          canDelete: true,
          showDocumentActions: true,
        }),
      );
      expect(getKeys(actionButtons.value)).toEqual([
        'createDirectory',
        'createDocument',
        'rename',
        'exportZip',
        'importJson',
        'importZip',
        'remove',
      ]);
    });
  });
});
