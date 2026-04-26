import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addSorting,
  addView,
  closeBottomSheet,
  closeDocumentPane,
  createRelationProperty,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  expectDatabaseValuesInOrder,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openEqualFilterDialog,
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
