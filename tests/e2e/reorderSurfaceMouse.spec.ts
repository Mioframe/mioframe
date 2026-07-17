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
import { indexOfRow } from './reorderSurface.testUtils';

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

test('the trailing settings action stays independently clickable and never starts a drag', async ({
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
  await firstRow.scrollIntoViewIfNeeded();

  const rowsBeforeGesture = await sheet.getByRole('list').locator(':scope > *').allTextContents();

  const settingsButton = firstRow.getByRole('button', { name: /settings view/i });
  const settingsBox = await settingsButton.boundingBox();
  if (!settingsBox) {
    throw new Error('missing bounding box for trailing settings action');
  }

  const renameMenuItem = page.getByRole('menuitem', { name: /^rename$/i });

  // A drag-shaped gesture starting on the trailing action must not start a reorder session.
  await page.mouse.move(
    settingsBox.x + settingsBox.width / 2,
    settingsBox.y + settingsBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    settingsBox.x + settingsBox.width / 2 + 40,
    settingsBox.y + settingsBox.height / 2,
    {
      steps: 8,
    },
  );

  // The row wrapper must never enter the dragged state while the gesture-holding pointer is
  // still down, since the trailing action is outside the reorder handle boundary.
  await expect(firstRow).not.toHaveClass(/md-state_dragged/);

  await page.mouse.up();

  const rowsAfterGesture = await sheet.getByRole('list').locator(':scope > *').allTextContents();
  expect(rowsAfterGesture).toEqual(rowsBeforeGesture);
  expect(indexOfRow(rowsAfterGesture, firstViewName)).toBeLessThan(
    indexOfRow(rowsAfterGesture, secondViewName),
  );

  // The drag-shaped gesture must not have opened the settings menu either.
  await expect(renameMenuItem).toBeHidden();

  // The trailing action remains an ordinary independent click target: a normal click opens the
  // menu, and a second click on the same trigger closes it again.
  await settingsButton.click();
  await expect(settingsButton).toHaveAttribute('aria-expanded', 'true');
  await expect(renameMenuItem).toBeVisible();

  await settingsButton.click();
  await expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
  await expect(renameMenuItem).toBeHidden();

  await closeBottomSheet(page, /database views sheet/i);
});

test.describe('container bounds', () => {
  test('the dragged row stays inside the list bounds when the pointer moves beyond each edge', async ({
    page,
  }) => {
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(page, createUniqueName('reorder bounds lab'));
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('reorder bounds catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    const firstViewName = await addView(page, createUniqueName('view hotel'));
    await addView(page, createUniqueName('view india'));

    const sheet = await openViewsSheet(page);
    const list = sheet.getByRole('list');
    const draggedRow = findListRow(sheet, firstViewName);
    await draggedRow.scrollIntoViewIfNeeded();

    const listBox = await list.boundingBox();
    const rowBox = await draggedRow.boundingBox();
    if (!listBox || !rowBox) {
      throw new Error('missing bounding box for list or view row');
    }

    const rowCenterX = rowBox.x + rowBox.width / 2;
    const rowCenterY = rowBox.y + rowBox.height / 2;

    // The list's own scroll container can auto-scroll while the pointer is held beyond an edge,
    // so both boxes must be re-measured live rather than compared against the pre-drag snapshot.
    // This asserts the active dragged row's bounds at a single point in time: it must never be
    // observed outside the list, so it must not wait or retry until containment becomes true.
    const assertDraggedRowWithinListBounds = async () => {
      // One rendered frame for the browser to apply the pointer move, not a poll for eventual
      // containment.
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

      const isDragging = await draggedRow.evaluate((el) =>
        el.classList.contains('md-state_dragged'),
      );
      expect(isDragging).toBe(true);

      const [draggedBox, liveListBox] = await Promise.all([
        draggedRow.boundingBox(),
        list.boundingBox(),
      ]);
      if (!draggedBox || !liveListBox) {
        throw new Error('missing live bounding box for list or dragged row');
      }

      expect(draggedBox.x).toBeGreaterThanOrEqual(liveListBox.x - 1);
      expect(draggedBox.y).toBeGreaterThanOrEqual(liveListBox.y - 1);
      expect(draggedBox.x + draggedBox.width).toBeLessThanOrEqual(
        liveListBox.x + liveListBox.width + 1,
      );
      expect(draggedBox.y + draggedBox.height).toBeLessThanOrEqual(
        liveListBox.y + liveListBox.height + 1,
      );
    };

    await page.mouse.move(rowCenterX, rowCenterY);
    await page.mouse.down();
    // Cross the mouse activation distance before probing bounds.
    await page.mouse.move(rowCenterX, rowCenterY + 8, { steps: 4 });

    await page.mouse.move(rowCenterX, listBox.y - 200, { steps: 8 });
    await assertDraggedRowWithinListBounds();

    await page.mouse.move(rowCenterX, listBox.y + listBox.height + 200, { steps: 8 });
    await assertDraggedRowWithinListBounds();

    await page.mouse.move(listBox.x - 200, rowCenterY, { steps: 8 });
    await assertDraggedRowWithinListBounds();

    await page.mouse.move(listBox.x + listBox.width + 200, rowCenterY, { steps: 8 });
    await assertDraggedRowWithinListBounds();

    await page.mouse.up();

    await closeBottomSheet(page, /database views sheet/i);
  });
});

test.describe('activation isolation', () => {
  test('a completed drag reorders views without changing which view is current', async ({
    page,
  }) => {
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(page, createUniqueName('reorder isolation lab'));
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('reorder isolation catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    const firstViewName = await addView(page, createUniqueName('view iso alpha'));
    const secondViewName = await addView(page, createUniqueName('view iso bravo'));

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

    await secondRow.scrollIntoViewIfNeeded();
    await firstRow.scrollIntoViewIfNeeded();

    const firstBox = await firstRow.boundingBox();
    const secondBox = await secondRow.boundingBox();
    if (!firstBox || !secondBox) {
      throw new Error('missing bounding box for view row');
    }

    const dragSurfaceX = secondBox.x + secondBox.width / 2;

    // Drag the second (not the currently selected first) view: this is the only way a later
    // "release did not activate a row" assertion actually exercises isolation between the
    // dragged row and the selected row, rather than trivially holding because they're the same.
    await page.mouse.move(dragSurfaceX, secondBox.y + secondBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dragSurfaceX, secondBox.y + secondBox.height / 2 - 8, { steps: 4 });
    await page.mouse.move(dragSurfaceX, firstBox.y + firstBox.height / 2, { steps: 12 });
    await page.mouse.up();

    await expect
      .poll(async () => {
        const rows = await sheet.getByRole('list').locator(':scope > *').allTextContents();
        return indexOfRow(rows, secondViewName) < indexOfRow(rows, firstViewName);
      })
      .toBe(true);

    // The drag release must not have activated/selected any row: the view selected before the
    // drag stays current, regardless of where the dragged row now sits in the list.
    await expect(sheet.getByRole('button', { name: firstViewName })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(sheet.getByRole('button', { name: secondViewName })).not.toHaveAttribute(
      'aria-current',
      'true',
    );

    await closeBottomSheet(page, /database views sheet/i);
  });
});
