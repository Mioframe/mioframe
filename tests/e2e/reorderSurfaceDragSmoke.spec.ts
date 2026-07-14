import { expect, test, type CDPSession, type Page } from '@playwright/test';
import {
  addDatabaseItem,
  addView,
  closeBottomSheet,
  closeDocumentPane,
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

// Chromium tracks in-flight touch sequence state per CDP client: opening a fresh session for
// each dispatch call breaks a multi-event gesture ("Must send a TouchStart first"). Reuse one
// session per page for the whole gesture instead.
const cdpSessions = new WeakMap<Page, CDPSession>();

const getCdpSession = async (page: Page): Promise<CDPSession> => {
  const existing = cdpSessions.get(page);
  if (existing) return existing;

  const session = await page.context().newCDPSession(page);
  cdpSessions.set(page, session);
  return session;
};

const dispatchTouch = async (
  page: Page,
  type: 'touchStart' | 'touchMove' | 'touchEnd',
  point?: { x: number; y: number },
) => {
  const cdp = await getCdpSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: point ? [{ x: point.x, y: point.y }] : [],
  });
};

const center = (box: { x: number; y: number; width: number; height: number }) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

// The document's own default view row always renders alongside any added views, so row order
// must be asserted relatively (by name) rather than by fixed list index.
const indexOfRow = (rows: string[], name: string) => rows.findIndex((text) => text.includes(name));

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

  const settingsButton = firstRow.getByRole('button', { name: /settings view/i });
  const settingsBox = await settingsButton.boundingBox();
  if (!settingsBox) {
    throw new Error('missing bounding box for trailing settings action');
  }

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
  await page.mouse.up();

  const rowsAfterGesture = await sheet.getByRole('list').locator(':scope > *').allTextContents();
  expect(indexOfRow(rowsAfterGesture, firstViewName)).toBeLessThan(
    indexOfRow(rowsAfterGesture, secondViewName),
  );

  // The trailing action remains an ordinary independent click target.
  await settingsButton.click();
  const renameMenuItem = page.getByRole('menuitem', { name: /^rename$/i });
  await expect(renameMenuItem).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(renameMenuItem).toBeHidden();

  await closeBottomSheet(page, /database views sheet/i);
});

test.describe('touch activation', () => {
  test.use({ hasTouch: true });

  test('a touch swipe before the long-press delay scrolls the sheet instead of reordering', async ({
    page,
  }) => {
    test.slow();
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(page, createUniqueName('reorder touch scroll lab'));
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('reorder touch scroll catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    const viewNames: string[] = [];
    for (let index = 0; index < 10; index += 1) {
      // eslint-disable-next-line no-await-in-loop -- each view must be created before the next is added
      viewNames.push(await addView(page, createUniqueName(`view scroll ${index}`)));
    }

    const sheet = await openViewsSheet(page);
    const firstRow = sheet.getByRole('button', { name: viewNames[0] });
    await expect(firstRow).toBeVisible();

    const scrollTopBefore = await sheet.evaluate((el) => el.scrollTop);
    const box = await firstRow.boundingBox();
    if (!box) {
      throw new Error('missing bounding box for view row');
    }

    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    await dispatchTouch(page, 'touchStart', point);
    for (let i = 1; i <= 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- touch moves must be sent in order, one at a time
      await dispatchTouch(page, 'touchMove', { x: point.x, y: point.y - i * 15 });
    }
    await dispatchTouch(page, 'touchEnd');

    await expect
      .poll(() => sheet.evaluate((el) => el.scrollTop), { timeout: 3000 })
      .toBeGreaterThan(scrollTopBefore);

    await closeBottomSheet(page, /database views sheet/i);
  });

  test('a long press followed by movement activates a drag and reorders', async ({ page }) => {
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(page, createUniqueName('reorder touch drag lab'));
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('reorder touch drag catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    const firstViewName = await addView(page, createUniqueName('view foxtrot'));
    const secondViewName = await addView(page, createUniqueName('view golf'));

    const sheet = await openViewsSheet(page);
    const firstRow = sheet.getByRole('button', { name: firstViewName });
    const secondRow = sheet.getByRole('button', { name: secondViewName });
    await secondRow.scrollIntoViewIfNeeded();
    await firstRow.scrollIntoViewIfNeeded();

    const firstBox = await firstRow.boundingBox();
    const secondBox = await secondRow.boundingBox();
    if (!firstBox || !secondBox) {
      throw new Error('missing bounding box for view row');
    }

    const from = center(firstBox);
    const to = center(secondBox);

    await dispatchTouch(page, 'touchStart', from);
    // Below the 8px tolerance: must not cancel the pending long press.
    await dispatchTouch(page, 'touchMove', { x: from.x + 2, y: from.y });
    // The long-press activation delay is 400ms; wait past it before moving further.
    await page.waitForTimeout(500);

    const steps = 8;
    for (let i = 1; i <= steps; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- touch moves must be sent in order, one at a time
      await dispatchTouch(page, 'touchMove', {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      });
    }
    await dispatchTouch(page, 'touchEnd');

    await expect
      .poll(async () => {
        const rows = await sheet.getByRole('list').locator(':scope > *').allTextContents();
        return indexOfRow(rows, secondViewName) < indexOfRow(rows, firstViewName);
      })
      .toBe(true);

    await closeBottomSheet(page, /database views sheet/i);
  });
});
