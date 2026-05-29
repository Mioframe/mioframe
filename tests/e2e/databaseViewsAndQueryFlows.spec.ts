import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addDatabaseItemValues,
  addEqualFilter,
  addSorting,
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
  expectDatabaseValuesInOrder,
  findDatabaseRow,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openEqualFilterDialog,
  openFilterSheet,
  openOpfs,
  openSortSheet,
  openViewsSheet,
  removeSorting,
  renameView,
  selectView,
  toggleSortingDirection,
} from './helpers';

test('creates, renames, selects, and removes views through the view settings sheet', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('view lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('view catalog'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  const alphaValue = createUniqueName('alpha');
  const betaValue = createUniqueName('beta');

  await addDatabaseItem(page, propertyName, alphaValue);
  await addDatabaseItem(page, propertyName, betaValue);

  const initialViewSheet = await openViewsSheet(page);
  await expect(
    initialViewSheet
      .getByRole('listitem')
      .filter({ hasText: /default view/i })
      .getByRole('checkbox'),
  ).toBeChecked();
  await closeBottomSheet(page, /database views sheet/i);

  const secondViewName = await addView(page, createUniqueName('secondary view'));
  const renamedViewName = createUniqueName('focused view');
  await renameView(page, secondViewName, renamedViewName);
  await selectView(page, renamedViewName);
  const selectedViewSheet = await openViewsSheet(page);
  await expect(
    selectedViewSheet
      .getByRole('listitem')
      .filter({ hasText: renamedViewName })
      .getByRole('checkbox'),
  ).toBeChecked();

  const selectedViewRow = selectedViewSheet
    .getByRole('listitem')
    .filter({ hasText: renamedViewName })
    .first();
  await selectedViewRow.getByRole('button', { name: /settings view/i }).click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();

  const removeDialog = page.getByRole('dialog', { name: /remove view\?/i });
  await expect(removeDialog).toBeVisible();
  await removeDialog.getByRole('button', { name: /^remove$/i }).click();
  await expect(removeDialog).toHaveCount(0);

  await expect(
    selectedViewSheet
      .getByRole('listitem')
      .filter({ hasText: /default view/i })
      .getByRole('checkbox'),
  ).toBeChecked();
  await closeBottomSheet(page, /database views sheet/i);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedViewSheet = await openViewsSheet(page);
  await expect(
    reopenedViewSheet
      .getByRole('listitem')
      .filter({ hasText: /default view/i })
      .getByRole('checkbox'),
  ).toBeChecked();
  await closeBottomSheet(page, /database views sheet/i);
});

test('adds sorting, toggles direction, and removes sorting controls', async ({ page }) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('sorting lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('sorting catalog'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  const bravoValue = createUniqueName('bravo');
  const alphaValue = createUniqueName('alpha');
  const charlieValue = createUniqueName('charlie');

  await addDatabaseItem(page, propertyName, bravoValue);
  await addDatabaseItem(page, propertyName, alphaValue);
  await addDatabaseItem(page, propertyName, charlieValue);

  await addSorting(page, propertyName);
  await expect
    .poll(() => expectDatabaseValuesInOrder(page, [alphaValue, bravoValue, charlieValue]))
    .toBeUndefined();

  await toggleSortingDirection(page, propertyName);
  await closeBottomSheet(page, /database sort sheet/i);
  await expect
    .poll(() => expectDatabaseValuesInOrder(page, [charlieValue, bravoValue, alphaValue]), {
      message: 'expected row order to reverse after toggling sort direction',
    })
    .toBeUndefined();

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedSortSheet = await openSortSheet(page);
  await expect(
    reopenedSortSheet.getByRole('listitem').filter({ hasText: propertyName }).first(),
  ).toBeVisible();
  await closeBottomSheet(page, /database sort sheet/i);

  await removeSorting(page, propertyName);
  await closeBottomSheet(page, /database sort sheet/i);
  await expect(page.getByRole('dialog', { name: /database sort sheet/i })).toHaveCount(0);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedSortSheetAfterRemoval = await openSortSheet(page);
  await expect(
    reopenedSortSheetAfterRemoval.getByRole('listitem').filter({ hasText: propertyName }),
  ).toHaveCount(0);
});

test('applies string, boolean, and relation filters and persists them after reload', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('filter persistence lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('filtered source'),
  );
  const targetDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('filtered target'),
  );

  await openDocumentFromExplorer(page, targetDocumentName);
  const targetPropertyName = await createStringProperty(page, createUniqueName('target title'));
  const targetAlphaValue = createUniqueName('target alpha');
  const targetBetaValue = createUniqueName('target beta');
  await addDatabaseItem(page, targetPropertyName, targetAlphaValue);
  await addDatabaseItem(page, targetPropertyName, targetBetaValue);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  const titlePropertyName = await createStringProperty(page, createUniqueName('source title'));
  const categoryPropertyName = await createStringProperty(page, createUniqueName('category'));
  const booleanPropertyName = await createDatabaseProperty(page, {
    name: createUniqueName('ready'),
    type: 'boolean',
  });
  const relationPropertyName = await createRelationProperty(page, targetDocumentName);

  const categoryValue = createUniqueName('release');
  const expectedValue = createUniqueName('expected row');
  const stringMismatchValue = createUniqueName('string mismatch');
  const booleanMismatchValue = createUniqueName('boolean mismatch');
  const relationMismatchValue = createUniqueName('relation mismatch');

  await addDatabaseItemValues(page, {
    [titlePropertyName]: expectedValue,
    [categoryPropertyName]: categoryValue,
    [booleanPropertyName]: true,
    [relationPropertyName]: [targetAlphaValue],
  });
  await addDatabaseItemValues(page, {
    [titlePropertyName]: stringMismatchValue,
    [categoryPropertyName]: createUniqueName('backlog'),
    [booleanPropertyName]: true,
    [relationPropertyName]: [targetAlphaValue],
  });
  await addDatabaseItemValues(page, {
    [titlePropertyName]: booleanMismatchValue,
    [categoryPropertyName]: categoryValue,
    [booleanPropertyName]: false,
    [relationPropertyName]: [targetAlphaValue],
  });
  await addDatabaseItemValues(page, {
    [titlePropertyName]: relationMismatchValue,
    [categoryPropertyName]: categoryValue,
    [booleanPropertyName]: true,
    [relationPropertyName]: [targetBetaValue],
  });

  await addEqualFilter(page, categoryPropertyName, categoryValue);
  await closeBottomSheet(page, /database filters sheet/i);
  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, stringMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, booleanMismatchValue)).toBeVisible();
  await expect(findDatabaseRow(page, relationMismatchValue)).toBeVisible();

  const booleanDialog = await openEqualFilterDialog(page, booleanPropertyName);
  await booleanDialog
    .getByRole('checkbox', { name: new RegExp(`^${booleanPropertyName}$`, 'i') })
    .click();
  await booleanDialog.getByRole('button', { name: /^apply$/i }).click();
  await expect(booleanDialog).toHaveCount(0);
  await closeBottomSheet(page, /database filters sheet/i);
  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, booleanMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, relationMismatchValue)).toBeVisible();

  const relationDialog = await openEqualFilterDialog(page, relationPropertyName);
  await findDatabaseRow(relationDialog, targetAlphaValue).getByRole('checkbox').check();
  await relationDialog.getByRole('button', { name: /^apply$/i }).click();
  await expect(relationDialog).toHaveCount(0);
  await closeBottomSheet(page, /database filters sheet/i);

  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, stringMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, booleanMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, relationMismatchValue)).toHaveCount(0);

  await page.reload();
  await dismissStorageOnboarding(page);
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();

  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, stringMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, booleanMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, relationMismatchValue)).toHaveCount(0);

  const filtersSheet = await openFilterSheet(page);
  await expect(
    filtersSheet.getByRole('button', { name: new RegExp(`^${categoryPropertyName}$`, 'i') }),
  ).toBeVisible();
  await expect(
    filtersSheet.getByRole('button', { name: new RegExp(`^${booleanPropertyName}$`, 'i') }),
  ).toBeVisible();
  await expect(
    filtersSheet.getByRole('button', { name: new RegExp(`^${relationPropertyName}$`, 'i') }),
  ).toBeVisible();
  await expect(filtersSheet.getByText(categoryValue, { exact: true })).toBeVisible();
  await expect(filtersSheet.getByText(targetAlphaValue, { exact: true })).toBeVisible();
  await closeBottomSheet(page, /database filters sheet/i);
});

test('uses default relation view inline and switches to a selected relation view', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('relation inline view lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(page, createUniqueName('inline source'));
  const targetDocumentName = await createDatabaseDocument(page, createUniqueName('inline target'));

  await openDocumentFromExplorer(page, targetDocumentName);
  const targetPropertyName = await createStringProperty(page, createUniqueName('target title'));
  const alphaValue = createUniqueName('alpha target');
  const betaValue = createUniqueName('beta target');
  await addDatabaseItem(page, targetPropertyName, alphaValue);
  await addDatabaseItem(page, targetPropertyName, betaValue);
  await addSorting(page, targetPropertyName);

  const descendingViewName = await addView(page, createUniqueName('descending targets'));
  await selectView(page, descendingViewName);
  await addSorting(page, targetPropertyName);
  await toggleSortingDirection(page, targetPropertyName);
  await closeBottomSheet(page, /database sort sheet/i);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  const sourcePropertyName = await createStringProperty(page, createUniqueName('source title'));
  const sourceItemValue = createUniqueName('source row');
  await addDatabaseItem(page, sourcePropertyName, sourceItemValue);
  const relationPropertyName = await createRelationProperty(page, targetDocumentName);

  const sourceRow = findDatabaseRow(page, sourceItemValue);
  await sourceRow
    .getByRole('button', { name: new RegExp(`^${relationPropertyName}$`, 'i') })
    .click();
  const relationField = page.getByRole('group', {
    name: new RegExp(`^${relationPropertyName}$`, 'i'),
  });

  await expect(relationField.getByRole('button', { name: /^default view$/i })).toHaveClass(
    /md-chip_selected/,
  );
  await expect
    .poll(() => expectDatabaseValuesInOrder(relationField, [alphaValue, betaValue]))
    .toBeUndefined();

  await relationField
    .getByRole('button', { name: new RegExp(`^${descendingViewName}$`, 'i') })
    .click();
  await expect(
    relationField.getByRole('button', { name: new RegExp(`^${descendingViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);
  await expect
    .poll(() => expectDatabaseValuesInOrder(relationField, [betaValue, alphaValue]))
    .toBeUndefined();
});

test('uses the default related view in filter settings and persists an explicit relation view override', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('relation filter lab'));
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
  const targetItemValue = createUniqueName('filter row');
  await addDatabaseItem(page, targetPropertyName, targetItemValue);
  const secondViewName = await addView(page, createUniqueName('filterable linked items'));

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  await createStringProperty(page, createUniqueName('source title'));
  const relationPropertyName = await createRelationProperty(page, targetDocumentName);

  const dialog = await openEqualFilterDialog(page, relationPropertyName);
  await expect(dialog.getByText(targetItemValue, { exact: true })).toBeVisible();

  await dialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }).click();
  await expect(
    dialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);

  await dialog.getByRole('button', { name: /^cancel$/i }).click();
  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database filters sheet/i);

  const reopenedDialog = await openEqualFilterDialog(page, relationPropertyName);
  await expect(
    reopenedDialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);
  await expect(reopenedDialog.getByText(targetItemValue, { exact: true })).toBeVisible();
  await reopenedDialog.getByRole('button', { name: /^cancel$/i }).click();
  await closeBottomSheet(page, /database filters sheet/i);
});
