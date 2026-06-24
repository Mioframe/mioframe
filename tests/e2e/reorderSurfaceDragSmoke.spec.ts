import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  addView,
  closeBottomSheet,
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

  const firstBox = await firstRow.boundingBox();
  const secondBox = await secondRow.boundingBox();
  if (!firstBox || !secondBox) throw new Error('missing bounding box for view row');

  const rowCenterX = firstBox.x + firstBox.width / 2;

  await page.mouse.move(rowCenterX, firstBox.y + firstBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(rowCenterX, firstBox.y + firstBox.height / 2 + 5, { steps: 3 });
  await page.mouse.move(rowCenterX, secondBox.y + secondBox.height / 2, { steps: 10 });

  const selectionDuringDrag = await page.evaluate(() => window.getSelection()?.toString() ?? '');
  expect(selectionDuringDrag).toBe('');

  await page.mouse.up();
  await page.waitForTimeout(300);

  const selectionAfterDrag = await page.evaluate(() => window.getSelection()?.toString() ?? '');
  expect(selectionAfterDrag).toBe('');

  await closeBottomSheet(page, /database views sheet/i);
});
