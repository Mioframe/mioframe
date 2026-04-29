import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  closeDocumentPane,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  dismissStorageOnboarding,
  findDatabaseRow,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
} from './helpers';

test('persists a database document and item after a browser reload', async ({ page }) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('database persistence lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('reload catalog'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('reload title'));
  const itemValue = createUniqueName('reload row');
  await addDatabaseItem(page, propertyName, itemValue);
  await expect(findDatabaseRow(page, itemValue)).toBeVisible();

  await closeDocumentPane(page);
  await expect(page.getByText(documentName, { exact: true })).toBeVisible();

  await page.reload();
  await dismissStorageOnboarding(page);

  await expect(page.getByText(documentName, { exact: true })).toBeVisible();
  await expect(page.getByText(/error reading|corrupt|lost changes|failed to open/i)).toHaveCount(0);

  await openDocumentFromExplorer(page, documentName);

  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();
  await expect(page.getByText(documentName, { exact: true }).last()).toBeVisible();
  await expect(findDatabaseRow(page, itemValue)).toBeVisible();
  await expect(page.getByText(/error reading|corrupt|lost changes|failed to open/i)).toHaveCount(0);
});
