import { expect, test, type Locator, type Page } from '@playwright/test';
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

const dragRowToRow = async (
  page: Page,
  fromRow: Locator,
  toRow: Locator,
  position: 'before' | 'after' = 'after',
) => {
  await fromRow.scrollIntoViewIfNeeded();
  await toRow.scrollIntoViewIfNeeded();

  const fromBox = await fromRow.boundingBox();
  const toBox = await toRow.boundingBox();
  if (!fromBox || !toBox) {
    throw new Error('missing bounding box for view row');
  }

  const dragSurfaceX = fromBox.x + fromBox.width / 2;
  const fromCenterY = fromBox.y + fromBox.height / 2;
  const toCenterY = position === 'before' ? toBox.y + 4 : toBox.y + toBox.height - 4;

  await page.mouse.move(dragSurfaceX, fromCenterY);
  await page.mouse.down();
  await page.mouse.move(dragSurfaceX, fromCenterY + 8, { steps: 4 });
  await page.mouse.move(dragSurfaceX, toCenterY, { steps: 12 });
  await page.mouse.up();
};

const readVisualOrder = async (
  rows: ReadonlyArray<{
    name: string;
    locator: Locator;
  }>,
): Promise<string[]> => {
  const positionedRows = await Promise.all(
    rows.map(async ({ name, locator }) => {
      const box = await locator.boundingBox();

      return box ? { name, y: box.y } : null;
    }),
  );

  if (positionedRows.some((row) => row === null)) {
    return [];
  }

  return positionedRows
    .filter((row): row is { name: string; y: number } => row !== null)
    .sort((left, right) => left.y - right.y)
    .map(({ name }) => name);
};

const arraysEqual = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const expectRowsInVisualOrder = async (
  rows: ReadonlyArray<{
    name: string;
    locator: Locator;
  }>,
  expectedNames: readonly string[],
): Promise<void> => {
  await expect.poll(() => readVisualOrder(rows)).toEqual(expectedNames);
};

// Confirms the rows have both reached the expected visual order and stayed there across
// several consecutive polls, instead of trusting a single sample that could land during a
// transient overshoot of the move animation.
const expectRowsToRemainInVisualOrder = async (
  rows: ReadonlyArray<{
    name: string;
    locator: Locator;
  }>,
  expectedNames: readonly string[],
): Promise<void> => {
  let consecutiveMatches = 0;

  await expect
    .poll(async () => {
      const order = await readVisualOrder(rows);
      consecutiveMatches = arraysEqual(order, expectedNames) ? consecutiveMatches + 1 : 0;

      return consecutiveMatches;
    })
    .toBeGreaterThanOrEqual(3);
};

// Reads the committed DOM sequence of the database-view rows (not their transform-animated
// visual position), scoped to the reorderable list. The list also renders a pre-existing
// "default view" row plus any other row outside the current scenario, so the read names are
// filtered down to only the rows this assertion cares about before comparing order.
const expectRowsInDomOrder = async (
  list: Locator,
  expectedNames: readonly string[],
): Promise<void> => {
  const expectedSet = new Set(expectedNames);

  await expect
    .poll(async () => {
      const names = await list
        .locator('.md-list-item__label-text')
        .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));

      return names.filter((name) => expectedSet.has(name));
    })
    .toEqual(expectedNames);
};

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

test('closing the views sheet immediately after a second completed reorder keeps the latest persisted order', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('reorder latest lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(
    page,
    createUniqueName('reorder latest catalog'),
  );
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  await addDatabaseItem(page, propertyName, createUniqueName('row'));

  const firstViewName = await addView(page, createUniqueName('view alpha'));
  const secondViewName = await addView(page, createUniqueName('view bravo'));
  const thirdViewName = await addView(page, createUniqueName('view charlie'));

  const sheet = await openViewsSheet(page);
  const firstRow = sheet.getByRole('button', { name: firstViewName });
  const secondRow = sheet.getByRole('button', { name: secondViewName });
  const thirdRow = sheet.getByRole('button', { name: thirdViewName });
  const rows = [
    { name: firstViewName, locator: firstRow },
    { name: secondViewName, locator: secondRow },
    { name: thirdViewName, locator: thirdRow },
  ];

  // Wait for each drag's visible result before starting the next user action: a physical
  // pointer release does not guarantee the reorder session has finished settling, and starting
  // a new drag while the prior one is still settling can cause the next pointerdown to be
  // ignored.
  await dragRowToRow(page, firstRow, secondRow, 'after');
  await expectRowsInVisualOrder(rows, [secondViewName, firstViewName, thirdViewName]);

  await dragRowToRow(page, thirdRow, secondRow, 'before');
  await expectRowsInVisualOrder(rows, [thirdViewName, secondViewName, firstViewName]);

  await closeBottomSheet(page, /database views sheet/i);

  const reopenedSheet = await openViewsSheet(page);
  const reopenedRows = [
    { name: firstViewName, locator: reopenedSheet.getByRole('button', { name: firstViewName }) },
    {
      name: secondViewName,
      locator: reopenedSheet.getByRole('button', { name: secondViewName }),
    },
    { name: thirdViewName, locator: reopenedSheet.getByRole('button', { name: thirdViewName }) },
  ];
  await expectRowsInVisualOrder(reopenedRows, [thirdViewName, secondViewName, firstViewName]);

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

test('a second immediate reorder involving previously moved rows settles to the latest order', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('reorder motion lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(
    page,
    createUniqueName('reorder motion catalog'),
  );
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  await addDatabaseItem(page, propertyName, createUniqueName('row'));

  const firstViewName = await addView(page, createUniqueName('view foxtrot'));
  const secondViewName = await addView(page, createUniqueName('view golf'));
  const thirdViewName = await addView(page, createUniqueName('view hotel'));
  const fourthViewName = await addView(page, createUniqueName('view india'));

  const sheet = await openViewsSheet(page);
  const list = sheet.locator('.db-view-map-edit');
  const rowLocator = (name: string) => sheet.getByRole('button', { name });
  const rowRootLocator = (name: string) =>
    list.locator('.db-view-map-edit__view-item').filter({ hasText: name });
  const rows = [firstViewName, secondViewName, thirdViewName, fourthViewName].map((name) => ({
    name,
    locator: rowLocator(name),
  }));

  await expect(rows[0]?.locator).toBeVisible();
  await expect(rows[1]?.locator).toBeVisible();
  await expect(rows[2]?.locator).toBeVisible();
  await expect(rows[3]?.locator).toBeVisible();

  // First drag: move foxtrot after golf. [foxtrot, golf, hotel, india] -> [golf, foxtrot,
  // hotel, india]. Wait only for the DOM sequence to commit — not for the move animation
  // (MDList animateMoves) to visually settle — before starting the next gesture.
  await dragRowToRow(page, rowLocator(firstViewName), rowLocator(secondViewName), 'after');
  await expectRowsInDomOrder(list, [secondViewName, firstViewName, thirdViewName, fourthViewName]);

  // Second drag starts immediately, without waiting for the first drag's move transition
  // (350ms) to finish. It retargets foxtrot — the row the first drag just moved — moving it
  // after hotel this time: [golf, foxtrot, hotel, india] -> [golf, hotel, foxtrot, india].
  await dragRowToRow(page, rowLocator(firstViewName), rowLocator(thirdViewName), 'after');

  const finalOrder = [secondViewName, thirdViewName, firstViewName, fourthViewName];
  await expectRowsInVisualOrder(rows, finalOrder);
  // No oscillation once the pointer stops and any in-flight move transitions finish settling.
  await expectRowsToRemainInVisualOrder(rows, finalOrder);

  await Promise.all(
    [firstViewName, secondViewName, thirdViewName, fourthViewName].map((name) =>
      expect(rowRootLocator(name)).not.toHaveClass(/md-state_dragged/),
    ),
  );

  await closeBottomSheet(page, /database views sheet/i);

  // Reopening confirms the second gesture's result — not an intermediate state — was
  // persisted.
  const reopenedSheet = await openViewsSheet(page);
  const reopenedRows = [firstViewName, secondViewName, thirdViewName, fourthViewName].map(
    (name) => ({
      name,
      locator: reopenedSheet.getByRole('button', { name }),
    }),
  );
  await expectRowsInVisualOrder(reopenedRows, finalOrder);

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
