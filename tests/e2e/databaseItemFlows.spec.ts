import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  editDatabaseItem,
  findDatabaseRow,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  removeDatabaseItem,
} from './helpers';

test('shows the empty database state, creates the first property, and manages item lifecycle', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('inventory'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('products'));
  await openDocumentFromExplorer(page, documentName);

  await expect(page.getByText(/missing properties\./i)).toBeVisible();

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  const createdValue = createUniqueName('record');
  await addDatabaseItem(page, propertyName, createdValue);

  const updatedValue = createUniqueName('updated record');
  await editDatabaseItem(page, createdValue, propertyName, updatedValue);
  await expect(findDatabaseRow(page, updatedValue)).toBeVisible();

  await removeDatabaseItem(page, updatedValue);
  await expect(findDatabaseRow(page, updatedValue)).toHaveCount(0);
});
