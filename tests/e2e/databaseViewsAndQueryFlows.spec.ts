import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addSorting,
  addView,
  closeDocumentPane,
  closeBottomSheet,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  expectDatabaseValuesInOrder,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  openSortSheet,
  openViewsSheet,
  removeSorting,
  removeView,
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
  await closeBottomSheet(page, /database views sheet/i);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedViewSheet = await openViewsSheet(page);
  await expect(
    reopenedViewSheet.getByRole('listitem').filter({ hasText: renamedViewName }),
  ).toBeVisible();
  await closeBottomSheet(page, /database views sheet/i);

  await selectView(page, /default view/i);
  const defaultViewSheet = await openViewsSheet(page);
  await expect(
    defaultViewSheet
      .getByRole('listitem')
      .filter({ hasText: /default view/i })
      .getByRole('checkbox'),
  ).toBeChecked();
  await closeBottomSheet(page, /database views sheet/i);

  await removeView(page, renamedViewName);
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
