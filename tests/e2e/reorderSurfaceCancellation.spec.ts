import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addView,
  closeBottomSheet,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  findListRow,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  openViewsSheet,
} from './helpers';

test.describe('activation isolation', () => {
  test('pressing Escape mid-drag cancels the reorder and leaves current view and dragged state untouched', async ({
    page,
  }) => {
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(page, createUniqueName('reorder escape lab'));
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('reorder escape catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    const firstViewName = await addView(page, createUniqueName('view escape alpha'));
    const secondViewName = await addView(page, createUniqueName('view escape bravo'));

    let sheet = await openViewsSheet(page);
    await sheet.getByRole('button', { name: firstViewName }).click();
    await expect(sheet.getByRole('button', { name: firstViewName })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await closeBottomSheet(page, /database views sheet/i);

    sheet = await openViewsSheet(page);
    const firstRow = sheet.getByRole('button', { name: firstViewName });
    const secondRow = sheet.getByRole('button', { name: secondViewName });
    // `md-state_dragged` lives on the row's list-item wrapper, not the inner primary-action
    // button that `getByRole('button', ...)` resolves to.
    const secondRowWrapper = findListRow(sheet, secondViewName);

    await secondRow.scrollIntoViewIfNeeded();
    await firstRow.scrollIntoViewIfNeeded();

    const rowsBeforeDrag = await sheet.getByRole('list').locator(':scope > *').allTextContents();

    const firstBox = await firstRow.boundingBox();
    const secondBox = await secondRow.boundingBox();
    if (!firstBox || !secondBox) {
      throw new Error('missing bounding box for view row');
    }

    const dragSurfaceX = secondBox.x + secondBox.width / 2;

    // Drag the second (not the currently selected first) view, matching the completed-drag
    // scenario above: cancelling the non-selected row's drag is the meaningful isolation check.
    await page.mouse.move(dragSurfaceX, secondBox.y + secondBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance so the drag actually activates before cancelling it.
    await page.mouse.move(dragSurfaceX, secondBox.y + secondBox.height / 2 - 8, { steps: 4 });
    await expect(secondRowWrapper).toHaveClass(/md-state_dragged/);

    // Move far enough that a reorder would otherwise be possible.
    await page.mouse.move(dragSurfaceX, firstBox.y + firstBox.height / 2, { steps: 8 });

    // Escape cancels the active drag while the physical mouse button is still held down.
    await page.keyboard.press('Escape');
    await expect(secondRowWrapper).not.toHaveClass(/md-state_dragged/);

    await page.mouse.up();

    // Escape's own overlay-dismiss behavior also closes the bottom sheet (its dialog contract
    // is unrelated to this reorder scenario). Close (a no-op if already closed) and reopen it
    // through the real product entry point before reading state, matching this app's actual
    // observed behavior instead of assuming the sheet stays open.
    await closeBottomSheet(page, /database views sheet/i);
    sheet = await openViewsSheet(page);

    // The reopened list can render asynchronously after the sheet dialog itself becomes
    // visible, so wait for the expected row count before reading content.
    const reopenedListItems = sheet.getByRole('list').locator(':scope > *');
    await expect(reopenedListItems).toHaveCount(rowsBeforeDrag.length);

    const rowsAfterCancel = await reopenedListItems.allTextContents();
    expect(rowsAfterCancel).toEqual(rowsBeforeDrag);

    await expect(sheet.getByRole('button', { name: firstViewName })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // A later normal click still works after the cancelled drag.
    await sheet.getByRole('button', { name: secondViewName }).click();
    await expect(sheet.getByRole('button', { name: secondViewName })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await closeBottomSheet(page, /database views sheet/i);
  });
});
