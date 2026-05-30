import { expect, test } from '@playwright/test';
import {
  closeDocumentPane,
  createDatabaseDocument,
  createDirectory,
  createUniqueName,
  dismissStorageOnboarding,
  expectNoDocumentsInExplorer,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  removeExplorerEntry,
  renameExplorerEntry,
  renameOpenDocument,
} from './helpers';

test('creates, navigates, renames, and removes directories through the explorer UI', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const originalName = await createDirectory(page, createUniqueName('workspace'));
  await openDirectory(page, originalName);

  await page.getByRole('button', { name: /^back$/i }).click();
  await expect(page).toHaveURL(/Browser%20Storage/i);

  const renamedName = createUniqueName('renamed workspace');
  await renameExplorerEntry(page, originalName, renamedName);
  await page.reload();
  await dismissStorageOnboarding(page);
  await openOpfs(page);
  await expect(page.getByText(renamedName, { exact: true })).toBeVisible();
  await removeExplorerEntry(page, renamedName);
});

test('creates a document in a directory, opens it, renames it, and removes it from the explorer', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('records'));
  await openDirectory(page, directoryName);

  const originalDocumentName = await createDatabaseDocument(page, createUniqueName('catalog'));
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^document ${originalDocumentName}$`, 'i'),
    }),
  ).toBeVisible();
  await openDocumentFromExplorer(page, originalDocumentName);
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();

  const renamedDocumentName = createUniqueName('renamed catalog');
  await renameOpenDocument(page, renamedDocumentName);
  await closeDocumentPane(page);

  await openDocumentFromExplorer(page, renamedDocumentName);
  await closeDocumentPane(page);

  await removeExplorerEntry(page, renamedDocumentName);
  await expectNoDocumentsInExplorer(page);
});

test('removes a document from explorer without rename and leaves no broken document item', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('records'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('catalog'));
  await openDocumentFromExplorer(page, documentName);
  await closeDocumentPane(page);

  await removeExplorerEntry(page, documentName);
  await expectNoDocumentsInExplorer(page);
});

test('shows document not found after navigating to a removed document URL', async ({ page }) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('records'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('catalog'));
  await openDocumentFromExplorer(page, documentName);

  const documentUrl = page.url();

  await closeDocumentPane(page);
  await removeExplorerEntry(page, documentName);
  await expectNoDocumentsInExplorer(page);

  await page.goto(documentUrl);

  await expect(
    page.getByText('This document no longer exists in the current directory.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /rename document/i })).toHaveCount(0);
});
