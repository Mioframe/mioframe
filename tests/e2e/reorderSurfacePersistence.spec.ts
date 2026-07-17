import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addView,
  closeBottomSheet,
  closeDocumentPane,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  openViewsSheet,
} from './helpers';
import { indexOfRow } from './reorderSurface.testUtils';

test('reordering database views by drag does not leak text selection and persists after reopen', async ({
  page,
}) => {
  test.slow();
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('reorder drag lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('reorder drag catalog'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  await addDatabaseItem(page, propertyName, createUniqueName('row'));

  const firstViewName = await addView(page, createUniqueName('view alpha'));
  const secondViewName = await addView(page, createUniqueName('view bravo'));

  const sheet = await openViewsSheet(page);
  const firstRow = sheet.getByRole('button', { name: firstViewName });
  const secondRow = sheet.getByRole('button', { name: secondViewName });

  await expect(firstRow).toBeVisible();
  await expect(secondRow).toBeVisible();

  // Raw page.mouse coordinates are not auto-scrolled by Playwright the way locator actions
  // are, and the sheet's row list can render the newly added rows below the viewport fold.
  // Scroll both rows into view before reading their boxes so the drag gesture lands on them.
  await secondRow.scrollIntoViewIfNeeded();
  await firstRow.scrollIntoViewIfNeeded();

  const firstBox = await firstRow.boundingBox();
  const secondBox = await secondRow.boundingBox();
  if (!firstBox || !secondBox) {
    throw new Error('missing bounding box for view row');
  }

  const dragSurfaceX = firstBox.x + firstBox.width / 2;
  const firstRowCenterY = firstBox.y + firstBox.height / 2;
  const secondRowCenterY = secondBox.y + secondBox.height / 2;

  await page.mouse.move(dragSurfaceX, firstRowCenterY);
  await page.mouse.down();
  await page.mouse.move(dragSurfaceX, firstRowCenterY + 8, { steps: 4 });

  const selectionDuringDrag = await page.evaluate(() => window.getSelection()?.toString() ?? '');
  expect(selectionDuringDrag).toBe('');

  // No clone/overlay: exactly one element carries the dragged row's accessible name while active.
  await expect(page.getByRole('button', { name: firstViewName })).toHaveCount(1);

  await page.mouse.move(dragSurfaceX, secondRowCenterY, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(async () => page.evaluate(() => window.getSelection()?.toString() ?? ''))
    .toBe('');

  const rowsAfterDrag = await sheet.getByRole('list').locator(':scope > *').allTextContents();
  expect(indexOfRow(rowsAfterDrag, secondViewName)).toBeLessThan(
    indexOfRow(rowsAfterDrag, firstViewName),
  );

  await closeBottomSheet(page, /database views sheet/i);
  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedSheet = await openViewsSheet(page);
  const reopenedRowLocator = reopenedSheet.getByRole('list').locator(':scope > *');

  // The reopened document's view list can render asynchronously after the sheet dialog itself
  // becomes visible, so read row text through a poll rather than a single snapshot.
  await expect
    .poll(async () => {
      const reopenedRows = await reopenedRowLocator.allTextContents();
      return (
        indexOfRow(reopenedRows, secondViewName) >= 0 &&
        indexOfRow(reopenedRows, firstViewName) >= 0 &&
        indexOfRow(reopenedRows, secondViewName) < indexOfRow(reopenedRows, firstViewName)
      );
    })
    .toBe(true);

  await closeBottomSheet(page, /database views sheet/i);
});
