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

test('reordering database views by drag does not leak text selection', async ({ page }) => {
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
  await page.mouse.move(dragSurfaceX, secondRowCenterY, { steps: 12 });

  const selectionDuringDrag = await page.evaluate(() => window.getSelection()?.toString() ?? '');
  expect(selectionDuringDrag).toBe('');

  await page.mouse.up();

  await expect
    .poll(async () => page.evaluate(() => window.getSelection()?.toString() ?? ''))
    .toBe('');

  await closeBottomSheet(page, /database views sheet/i);

  // Reopen the sheet and confirm the drag was actually persisted, not only visible for the
  // duration of the live session: the dragged-down view (alpha) must render below the one it
  // was dropped onto (bravo).
  const reopenedSheet = await openViewsSheet(page);
  const reopenedFirstBox = await reopenedSheet
    .getByRole('button', { name: firstViewName })
    .boundingBox();
  const reopenedSecondBox = await reopenedSheet
    .getByRole('button', { name: secondViewName })
    .boundingBox();
  if (!reopenedFirstBox || !reopenedSecondBox) {
    throw new Error('missing bounding box for view row after reopening the sheet');
  }
  expect(reopenedSecondBox.y).toBeLessThan(reopenedFirstBox.y);

  await closeBottomSheet(page, /database views sheet/i);
});

test('a trailing context-menu control opens its menu and never starts a reorder', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('reorder trailing lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(
    page,
    createUniqueName('reorder trailing catalog'),
  );
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  await addDatabaseItem(page, propertyName, createUniqueName('row'));

  const firstViewName = await addView(page, createUniqueName('view delta'));
  const secondViewName = await addView(page, createUniqueName('view echo'));

  const sheet = await openViewsSheet(page);
  const firstRow = findListRow(sheet, firstViewName);
  const secondRow = findListRow(sheet, secondViewName);
  const trailingButton = firstRow.getByRole('button', { name: /settings view/i });

  await secondRow.scrollIntoViewIfNeeded();
  // `.hover()` waits for the target to be visible and geometrically stable (e.g. past the
  // sheet's own open animation) before moving the mouse there; reading raw coordinates via
  // `boundingBox()` alone can otherwise capture a transient in-animation position.
  await trailingButton.hover();

  const trailingBox = await trailingButton.boundingBox();
  const secondBox = await secondRow.boundingBox();
  if (!trailingBox || !secondBox) {
    throw new Error('missing bounding box for view row');
  }

  const trailingCenterX = trailingBox.x + trailingBox.width / 2;
  const trailingCenterY = trailingBox.y + trailingBox.height / 2;
  const secondRowCenterY = secondBox.y + secondBox.height / 2;

  // Press and move on the trailing control the same way a real drag gesture would: this must
  // never start a reorder session, since the trailing region is excluded from the row's
  // activator.
  await page.mouse.move(trailingCenterX, trailingCenterY);
  await page.mouse.down();
  await page.mouse.move(trailingCenterX, trailingCenterY + 8, { steps: 4 });
  await page.mouse.move(trailingCenterX, secondRowCenterY, { steps: 12 });
  await page.mouse.up();

  const firstBoxAfterPress = await firstRow.boundingBox();
  const secondBoxAfterPress = await secondRow.boundingBox();
  if (!firstBoxAfterPress || !secondBoxAfterPress) {
    throw new Error('missing bounding box for view row after pressing the trailing control');
  }
  expect(firstBoxAfterPress.y).toBeLessThan(secondBoxAfterPress.y);

  // A normal click on the same control still opens its context menu.
  await trailingButton.click();
  const renameMenuItem = page.getByRole('menuitem', { name: /^rename$/i });
  await expect(renameMenuItem).toBeVisible();

  // Dismiss via the same control that opened it (a toggle), rather than Escape: the menu and
  // the sheet each own an independent Escape registration, and this test only needs to confirm
  // the trailing control's own open/close contract, not that layered contract.
  await trailingButton.click();
  await expect(renameMenuItem).toBeHidden();

  await closeBottomSheet(page, /database views sheet/i);
});

test('clicking a database view row selects it without starting a drag', async ({ page }) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('reorder click lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(
    page,
    createUniqueName('reorder click catalog'),
  );
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  await addDatabaseItem(page, propertyName, createUniqueName('row'));

  const viewName = await addView(page, createUniqueName('view charlie'));

  const sheet = await openViewsSheet(page);
  const row = sheet.getByRole('button', { name: viewName });

  await expect(row).toBeVisible();
  await row.click();

  await expect(sheet.getByRole('button', { name: viewName })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await closeBottomSheet(page, /database views sheet/i);
});
