import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addDatabaseItemValues,
  addView,
  closeBottomSheet,
  closeDocumentPane,
  createDatabaseProperty,
  createRelationProperty,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  dismissStorageOnboarding,
  editDatabaseItem,
  editDatabaseItemValues,
  findDatabaseRow,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  removeDatabaseItem,
  setInlineDatabaseValue,
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

test('updates string, number, boolean, and date values inline and persists them', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('inline edit lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('inline values'));
  await openDocumentFromExplorer(page, documentName);

  const stringPropertyName = await createStringProperty(page, createUniqueName('task'));
  const numberPropertyName = await createDatabaseProperty(page, {
    name: createUniqueName('estimate'),
    type: 'number',
  });
  const booleanPropertyName = await createDatabaseProperty(page, {
    name: createUniqueName('done'),
    type: 'boolean',
  });
  const datePropertyName = await createDatabaseProperty(page, {
    name: createUniqueName('due'),
    type: 'date',
  });

  const initialStringValue = createUniqueName('draft task');
  const nextStringValue = createUniqueName('published task');
  const nextNumberValue = 42;
  const nextDateValue = '2026-04-27';

  await addDatabaseItemValues(page, {
    [stringPropertyName]: initialStringValue,
  });

  await setInlineDatabaseValue(page, initialStringValue, stringPropertyName, nextStringValue);
  await expect(findDatabaseRow(page, nextStringValue)).toBeVisible();

  await setInlineDatabaseValue(page, nextStringValue, numberPropertyName, nextNumberValue);
  await setInlineDatabaseValue(page, nextStringValue, booleanPropertyName, true);
  await setInlineDatabaseValue(page, nextStringValue, datePropertyName, nextDateValue);

  const updatedRow = findDatabaseRow(page, nextStringValue);
  await expect(updatedRow.getByText(String(nextNumberValue), { exact: true })).toBeVisible();
  await expect(
    updatedRow.getByRole('checkbox', { name: new RegExp(`^${booleanPropertyName}$`, 'i') }).first(),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(updatedRow.locator(`time[datetime="${nextDateValue}"]`)).toBeVisible();

  await page.reload();
  await dismissStorageOnboarding(page);
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();

  const reloadedRow = findDatabaseRow(page, nextStringValue);
  await expect(reloadedRow).toBeVisible();
  await expect(reloadedRow.getByText(String(nextNumberValue), { exact: true })).toBeVisible();
  await expect(
    reloadedRow
      .getByRole('checkbox', { name: new RegExp(`^${booleanPropertyName}$`, 'i') })
      .first(),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(reloadedRow.locator(`time[datetime="${nextDateValue}"]`)).toBeVisible();
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

test('toggles recursive relation preview without opening an inline relation editor', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('recursive relation lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('recursive database'));
  await openDocumentFromExplorer(page, documentName);

  const titlePropertyName = await createStringProperty(page, createUniqueName('node'));
  const firstItemValue = createUniqueName('node alpha');
  const secondItemValue = createUniqueName('node beta');
  await addDatabaseItem(page, titlePropertyName, firstItemValue);
  await addDatabaseItem(page, titlePropertyName, secondItemValue);

  const relationPropertyName = await createRelationProperty(
    page,
    documentName,
    createUniqueName('related nodes'),
  );

  await editDatabaseItemValues(page, firstItemValue, {
    [relationPropertyName]: [secondItemValue],
  });
  await editDatabaseItemValues(page, secondItemValue, {
    [relationPropertyName]: [firstItemValue],
  });

  const firstRow = findDatabaseRow(page, firstItemValue);
  await expect(firstRow.getByText(secondItemValue, { exact: true }).first()).toBeVisible();

  const showButton = firstRow.getByRole('button', { name: /^show value$/i });
  await expect(showButton).toBeVisible();
  await showButton.click();

  const hideButton = page.getByRole('button', { name: /^hide value$/i });
  await expect(hideButton).toBeVisible();
  await expect(hideButton).toBeFocused();
  await expect(page.getByRole('button', { name: /^default view$/i })).toHaveCount(0);

  await hideButton.click();
  await expect(page.getByRole('button', { name: /^show value$/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^default view$/i })).toHaveCount(0);
});
