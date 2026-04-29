import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addView,
  closeBottomSheet,
  closeDocumentPane,
  createRelationProperty,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  dismissStorageOnboarding,
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

test('uses the default related view in item edit and persists an explicit relation view override', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('relation item edit lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('source database'),
  );
  const targetDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('target database'),
  );

  await openDocumentFromExplorer(page, targetDocumentName);
  const targetPropertyName = await createStringProperty(page, createUniqueName('target title'));
  const targetItemValue = createUniqueName('linked row');
  await addDatabaseItem(page, targetPropertyName, targetItemValue);
  const secondViewName = await addView(page, createUniqueName('linked items view'));

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  const sourcePropertyName = await createStringProperty(page, createUniqueName('source title'));
  const sourceItemValue = createUniqueName('source row');
  await addDatabaseItem(page, sourcePropertyName, sourceItemValue);
  await createRelationProperty(page, targetDocumentName);

  const row = findDatabaseRow(page, sourceItemValue);
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /^options$/i }).click();
  await page.getByRole('menuitem', { name: /^edit$/i }).click();

  const dialog = page.getByRole('dialog', { name: /edit item/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(targetItemValue, { exact: true })).toBeVisible();

  await dialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }).click();
  await expect(
    dialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);

  await dialog.getByRole('button', { name: /^cancel$/i }).click();
  await expect(dialog).toHaveCount(0);

  await row.getByRole('button', { name: /^options$/i }).click();
  await page.getByRole('menuitem', { name: /^edit$/i }).click();

  const reopenedDialog = page.getByRole('dialog', { name: /edit item/i });
  await expect(reopenedDialog).toBeVisible();
  await expect(
    reopenedDialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);
  await expect(reopenedDialog.getByText(targetItemValue, { exact: true })).toBeVisible();
  await reopenedDialog.getByRole('button', { name: /^cancel$/i }).click();
});

test('creates a relation property, selects related records, and persists relation values', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('relation values lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('source database'),
  );
  const targetDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('target database'),
  );

  await openDocumentFromExplorer(page, targetDocumentName);
  const targetPropertyName = await createStringProperty(page, createUniqueName('target title'));
  const firstTargetValue = createUniqueName('target alpha');
  const secondTargetValue = createUniqueName('target beta');
  await addDatabaseItem(page, targetPropertyName, firstTargetValue);
  await addDatabaseItem(page, targetPropertyName, secondTargetValue);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  const sourcePropertyName = await createStringProperty(page, createUniqueName('source title'));
  const sourceItemValue = createUniqueName('source row');
  await addDatabaseItem(page, sourcePropertyName, sourceItemValue);

  await page.getByRole('button', { name: /configure properties/i }).click();
  const sheet = page.getByRole('dialog', { name: /database properties sheet/i });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: /add property/i }).click();

  const propertyDialog = page.getByRole('dialog', { name: /create property/i });
  await expect(propertyDialog).toBeVisible();

  const relationPropertyName = createUniqueName('related targets');
  await propertyDialog.getByLabel(/^name$/i).fill(relationPropertyName);
  await propertyDialog.getByRole('combobox', { name: /property type/i }).click();
  await page.getByRole('option', { name: /^relation$/i }).click();

  await propertyDialog.getByRole('button', { name: /^create$/i }).click();
  await expect(propertyDialog).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${relationPropertyName}$`, 'i') }),
  ).toHaveCount(0);

  await propertyDialog.getByRole('combobox', { name: /database document/i }).click();
  await page.getByRole('option', { name: new RegExp(`^${targetDocumentName}$`, 'i') }).click();

  await propertyDialog.getByRole('button', { name: /^create$/i }).click();
  await expect(propertyDialog).toHaveCount(0);
  await closeBottomSheet(page, /database properties sheet/i);
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${relationPropertyName}$`, 'i') }),
  ).toBeVisible();

  const sourceRow = findDatabaseRow(page, sourceItemValue);
  await expect(sourceRow).toBeVisible();
  await sourceRow.getByRole('button', { name: /^options$/i }).click();
  await page.getByRole('menuitem', { name: /^edit$/i }).click();

  const editDialog = page.getByRole('dialog', { name: /edit item/i });
  await expect(editDialog).toBeVisible();
  await expect(editDialog.getByText(firstTargetValue, { exact: true })).toBeVisible();
  await expect(editDialog.getByText(secondTargetValue, { exact: true })).toBeVisible();

  await findDatabaseRow(page, firstTargetValue).getByRole('checkbox').click();
  await findDatabaseRow(page, secondTargetValue).getByRole('checkbox').click();
  await editDialog.getByRole('button', { name: /^edit$/i }).click();
  await expect(editDialog).toHaveCount(0);

  await expect(sourceRow.getByText(firstTargetValue, { exact: true })).toBeVisible();
  await expect(sourceRow.getByText(secondTargetValue, { exact: true })).toBeVisible();

  await page.reload();
  await dismissStorageOnboarding(page);

  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();
  await expect(findDatabaseRow(page, sourceItemValue)).toBeVisible();
  await expect(
    findDatabaseRow(page, sourceItemValue).getByText(firstTargetValue, { exact: true }),
  ).toBeVisible();
  await expect(
    findDatabaseRow(page, sourceItemValue).getByText(secondTargetValue, { exact: true }),
  ).toBeVisible();
});
