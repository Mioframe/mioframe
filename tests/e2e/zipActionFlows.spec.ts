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
