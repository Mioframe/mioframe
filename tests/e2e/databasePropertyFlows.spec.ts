import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  closeDocumentPane,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  removeProperty,
  renameProperty,
} from './helpers';

test('adds, edits, and removes properties through the properties sheet', async ({ page }) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('property lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('property catalog'));
  await openDocumentFromExplorer(page, documentName);

  const originalPropertyName = await createStringProperty(page, createUniqueName('title'));
  await addDatabaseItem(page, originalPropertyName, createUniqueName('entry'));

  const renamedPropertyName = createUniqueName('headline');
  await renameProperty(page, originalPropertyName, renamedPropertyName);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${renamedPropertyName}$`, 'i') }),
  ).toBeVisible();

  await page.getByRole('button', { name: /add item/i }).click();
  const addDialog = page.getByRole('dialog', { name: /add item/i });
  await expect(addDialog).toBeVisible();
  await expect(addDialog.getByLabel(new RegExp(`^${renamedPropertyName}$`, 'i'))).toBeVisible();
  await addDialog.getByRole('button', { name: /^cancel$/i }).click();
  await expect(addDialog).toHaveCount(0);

  await removeProperty(page, renamedPropertyName);
  await expect(page.getByText(/missing properties\./i)).toBeVisible();
  await expect(page.getByRole('button', { name: /add item/i })).toHaveCount(0);
});
