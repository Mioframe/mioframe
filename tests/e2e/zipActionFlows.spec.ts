import { expect, type Page, test } from '@playwright/test';
import { zipSync } from 'fflate';
import {
  closeBottomSheet,
  closeDocumentPane,
  createDatabaseDocument,
  createDirectory,
  createUniqueName,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openEntryAddSheet,
  openOpfs,
} from './helpers';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stubShowSaveFilePicker = async (page: Page) => {
  await page.addInitScript(() => {
    Reflect.set(globalThis, 'showSaveFilePicker', () =>
      Promise.resolve({
        createWritable: () =>
          Promise.resolve({
            write: () => Promise.resolve(undefined),
            close: () => Promise.resolve(undefined),
            abort: () => Promise.resolve(undefined),
          }),
      }),
    );
  });
};

const stubShowOpenFilePicker = async (page: Page, archiveBytes: Uint8Array) => {
  await page.addInitScript((bytes: number[]) => {
    const file = new File([new Uint8Array(bytes)], 'archive.zip', { type: 'application/zip' });
    Reflect.set(globalThis, 'showOpenFilePicker', () =>
      Promise.resolve([{ getFile: () => Promise.resolve(file) }]),
    );
  }, Array.from(archiveBytes));
};

const stubSequentialZipPickers = async (page: Page, archives: Uint8Array[]) => {
  await page.addInitScript(
    (archiveValues: number[][]) => {
      let index = 0;
      Reflect.set(globalThis, 'showOpenFilePicker', () => {
        const bytes = archiveValues.at(index++);
        if (bytes === undefined) throw new Error('No ZIP fixture remains');
        const file = new File([new Uint8Array(bytes)], 'archive.zip', {
          type: 'application/zip',
        });
        return Promise.resolve([{ getFile: () => Promise.resolve(file) }]);
      });
    },
    archives.map((archive) => Array.from(archive)),
  );
};

const openEntryOptionsMenu = async (page: Page, entryName: string) => {
  await page
    .getByRole('button', { name: new RegExp(`^options ${escapeRegex(entryName)}$`, 'i') })
    .click();
};

test('current/open folder context menu exposes Import ZIP and Import JSON, not the Add sheet', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('zip-import-current-dir'));
  await openDirectory(page, directoryName);

  const addSheet = await openEntryAddSheet(page);
  await expect(addSheet.getByText(/^import zip$/i)).toHaveCount(0);
  await closeBottomSheet(page, /^add$/i);

  await openEntryOptionsMenu(page, directoryName);
  await expect(page.getByRole('menuitem', { name: /^import zip$/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^import json$/i })).toBeVisible();
});

test('directory options menu exposes Export ZIP, and exporting shows the ZIP dialog until closed', async ({
  page,
}) => {
  await stubShowSaveFilePicker(page);
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('zip-export-dir'));

  await openEntryOptionsMenu(page, directoryName);
  await expect(page.getByRole('menuitem', { name: /^export zip$/i })).toBeVisible();
  await page.getByRole('menuitem', { name: /^export zip$/i }).click();

  const successDialog = page.getByRole('dialog', { name: /^zip archive exported$/i });
  await expect(successDialog).toBeVisible();

  const doneButton = successDialog.getByRole('button', { name: /^done$/i });
  await expect(doneButton).toBeVisible();
  await doneButton.click();
  await expect(successDialog).toHaveCount(0);
});

test('directory options menu exposes Import ZIP, and importing shows the ZIP dialog until closed', async ({
  page,
}) => {
  const archiveBytes = zipSync({
    'imported-item.txt': new TextEncoder().encode('imported content'),
  });
  await stubShowOpenFilePicker(page, archiveBytes);
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('zip-import-dir'));

  await openEntryOptionsMenu(page, directoryName);
  await expect(page.getByRole('menuitem', { name: /^import zip$/i })).toBeVisible();
  await page.getByRole('menuitem', { name: /^import zip$/i }).click();

  const successDialog = page.getByRole('dialog', { name: /^zip archive imported$/i });
  await expect(successDialog).toBeVisible();

  const doneButton = successDialog.getByRole('button', { name: /^done$/i });
  await expect(doneButton).toBeVisible();
  await doneButton.click();
  await expect(successDialog).toHaveCount(0);

  await openDirectory(page, directoryName);
  await expect(page.getByText('imported-item.txt', { exact: true })).toBeVisible();

  const addSheet = await openEntryAddSheet(page);
  await expect(addSheet.getByText(/^import zip$/i)).toHaveCount(0);
  await closeBottomSheet(page, /^add$/i);
});

test('current folder reports an ordinary ZIP conflict, writes nothing, and only offers Close', async ({
  page,
}) => {
  await stubSequentialZipPickers(page, [
    zipSync({ 'existing.txt': new TextEncoder().encode('original') }),
    zipSync({
      'existing.txt': new TextEncoder().encode('replacement'),
      'new.txt': new TextEncoder().encode('new'),
    }),
  ]);
  await launchApp(page);
  await openOpfs(page);
  const directoryName = await createDirectory(page, createUniqueName('zip-current-conflict'));
  await openDirectory(page, directoryName);

  await openEntryOptionsMenu(page, directoryName);
  await page.getByRole('menuitem', { name: /^import zip$/i }).click();
  await page
    .getByRole('dialog', { name: /^zip archive imported$/i })
    .getByRole('button', {
      name: /^done$/i,
    })
    .click();

  await openEntryOptionsMenu(page, directoryName);
  await page.getByRole('menuitem', { name: /^import zip$/i }).click();
  const conflictDialog = page.getByRole('dialog', { name: /^import conflicts found$/i });
  await expect(conflictDialog).toBeVisible();
  await expect(conflictDialog).toContainText('No files were written');
  await expect(conflictDialog).toContainText('empty or different target directory');
  await expect(conflictDialog.getByRole('button', { name: /^skip existing$/i })).toHaveCount(0);
  await conflictDialog.getByRole('button', { name: /^close$/i }).click();
  await expect(conflictDialog).toHaveCount(0);

  await expect(page.getByText('existing.txt', { exact: true })).toBeVisible();
  await expect(page.getByText('new.txt', { exact: true })).toHaveCount(0);

  await expect
    .poll(() =>
      page.evaluate(async (name) => {
        const root = await navigator.storage.getDirectory();
        const directory = await root.getDirectoryHandle(name);
        return (await (await directory.getFileHandle('existing.txt')).getFile()).text();
      }, directoryName),
    )
    .toBe('original');
});

test('document options menu exposes Export ZIP, and exporting shows the ZIP dialog until closed', async ({
  page,
}) => {
  await stubShowSaveFilePicker(page);
  await launchApp(page);
  await openOpfs(page);

  const documentName = await createDatabaseDocument(page, createUniqueName('zip-export-document'));
  await openDocumentFromExplorer(page, documentName);
  await closeDocumentPane(page);

  await openEntryOptionsMenu(page, documentName);
  await expect(page.getByRole('menuitem', { name: /^export zip$/i })).toBeVisible();
  await page.getByRole('menuitem', { name: /^export zip$/i }).click();

  const successDialog = page.getByRole('dialog', { name: /^zip archive exported$/i });
  await expect(successDialog).toBeVisible();

  const doneButton = successDialog.getByRole('button', { name: /^done$/i });
  await expect(doneButton).toBeVisible();
  await doneButton.click();
  await expect(successDialog).toHaveCount(0);
});
