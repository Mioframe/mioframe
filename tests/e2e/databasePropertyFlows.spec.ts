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

test('shows relation settings during property creation and requires a related document', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('relation property lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('source database'),
  );
  const targetDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('target database'),
  );

  await openDocumentFromExplorer(page, sourceDocumentName);

  await page.getByRole('button', { name: /configure properties/i }).click();
  const sheet = page.getByRole('dialog', { name: /database properties sheet/i });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: /add property/i }).click();

  const dialog = page.getByRole('dialog', { name: /create property/i });
  await expect(dialog).toBeVisible();

  const relationPropertyName = createUniqueName('related tasks');
  await dialog.getByLabel(/^name$/i).fill(relationPropertyName);

  await dialog.getByRole('combobox', { name: /property type/i }).click();
  await page.getByRole('option', { name: /^relation$/i }).click();

  const relationDocumentField = dialog.getByRole('combobox', { name: /database document/i });
  await expect(relationDocumentField).toBeVisible();

  await dialog.getByRole('button', { name: /^create$/i }).click();
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${relationPropertyName}$`, 'i') }),
  ).toHaveCount(0);

  await relationDocumentField.click();
  await page.getByRole('option', { name: new RegExp(`^${targetDocumentName}$`, 'i') }).click();

  await dialog.getByRole('button', { name: /^create$/i }).click();
  await expect(dialog).toHaveCount(0);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${relationPropertyName}$`, 'i') }),
  ).toBeVisible();

  await page.getByRole('button', { name: /configure properties/i }).click();
  const reopenedSheet = page.getByRole('dialog', { name: /database properties sheet/i });
  await expect(reopenedSheet).toBeVisible();
  await reopenedSheet.getByRole('button', { name: /add property/i }).click();

  const reopenedDialog = page.getByRole('dialog', { name: /create property/i });
  await expect(reopenedDialog).toBeVisible();
  await reopenedDialog.getByRole('combobox', { name: /property type/i }).click();
  await page.getByRole('option', { name: /^relation$/i }).click();

  await expect(reopenedDialog.getByRole('combobox', { name: /database document/i })).toBeVisible();
  await expect(reopenedDialog.getByText(targetDocumentName, { exact: true })).toHaveCount(0);
});
