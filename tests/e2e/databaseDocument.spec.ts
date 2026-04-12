import { expect, test } from '@playwright/test';
import {
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  openOpfs,
} from './helpers';

test('creates a database, adds a string property, and saves an item through the UI', async ({
  page,
}) => {
  await page.goto('/');
  await openOpfs(page);

  const folderName = await createDirectory(page, createUniqueName('workspace'));
  await page.getByText(folderName, { exact: true }).click();

  const databaseName = await createDatabaseDocument(page, createUniqueName('catalog'));
  await page.getByText(databaseName, { exact: true }).click();

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  const itemValue = createUniqueName('record');

  await page.getByRole('button', { name: /add item/i }).click();
  await page.getByLabel(new RegExp(propertyName, 'i')).fill(itemValue);
  await page.getByRole('button', { name: /^add$/i }).click();

  await expect(page.getByText(itemValue, { exact: true })).toBeVisible();
});
