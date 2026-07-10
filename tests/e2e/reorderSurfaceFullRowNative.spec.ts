import { expect, test, type Page } from '@playwright/test';
import {
  addDatabaseItem,
  addSorting,
  addView,
  closeBottomSheet,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  findListRow,
  getViewRowOrder,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  openSortSheet,
  openViewsSheet,
  selectView,
} from './helpers';
import { performCdpTouchLongPressDrag } from './support/gestures/cdpTouchDrag';
import { getCenterPoint } from './support/gestures/coordinates';
import { performMouseDrag } from './support/gestures/mouseDrag';

const setupViewCatalog = async (page: Page, labPrefix: string) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName(`${labPrefix} lab`));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName(`${labPrefix} catalog`));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  await addDatabaseItem(page, propertyName, createUniqueName('row'));

  const firstViewName = await addView(page, createUniqueName('view one'));
  const secondViewName = await addView(page, createUniqueName('view two'));
  const thirdViewName = await addView(page, createUniqueName('view three'));

  return { firstViewName, secondViewName, thirdViewName };
};

/**
 * Counts `dragstart` events so a probe can prove no native browser drag ever began.
 * @param page - Page to install the counter on.
 * @returns The evaluate promise that installs the counter.
 */
const installDragStartCounter = (page: Page) =>
  page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- widens window with the test-only dragstart counter shared between install and probe
    const state = window as Window & { reorderDragstartCount?: number };

    state.reorderDragstartCount = 0;
    window.addEventListener(
      'dragstart',
      () => {
        state.reorderDragstartCount = (state.reorderDragstartCount ?? 0) + 1;
      },
      { capture: true },
    );
  });

const getDragstartCount = (page: Page) =>
  page.evaluate(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions -- reads the test-only counter installed by installDragStartCounter
      ((window as any).reorderDragstartCount as number | undefined) ?? 0,
  );

test('desktop: dragging a database view row by its full row reorders the list and suppresses the immediate post-drag click', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'desktop mouse full-row drag activation');

  const { firstViewName, secondViewName, thirdViewName } = await setupViewCatalog(
    page,
    'reorder full-row drag',
  );

  await selectView(page, secondViewName);

  const sheet = await openViewsSheet(page);
  const viewNames = [firstViewName, secondViewName, thirdViewName];
  await expect.poll(() => getViewRowOrder(sheet, viewNames)).toEqual(viewNames);

  const pageScrollY = () => page.evaluate(() => window.scrollY);
  const initialPageScrollY = await pageScrollY();
  await expect(sheet.getByRole('button', { name: secondViewName })).toHaveAttribute(
    'aria-current',
    'true',
  );

  const firstRow = findListRow(sheet, firstViewName);
  const thirdRow = findListRow(sheet, thirdViewName);
  const firstRowAction = firstRow.getByRole('button', { name: firstViewName }).first();
  const thirdRowAction = thirdRow.getByRole('button', { name: thirdViewName }).first();
  const thirdRowActionBox = await thirdRowAction.boundingBox();
  if (!thirdRowActionBox) {
    throw new Error('missing bounding box for view row');
  }

  await performMouseDrag(
    page,
    await getCenterPoint(firstRowAction),
    {
      x: thirdRowActionBox.x + thirdRowActionBox.width / 2,
      y: thirdRowActionBox.y + thirdRowActionBox.height - 6,
    },
    {
      steps: 20,
      settleMs: 500,
    },
  );

  await expect
    .poll(() => getViewRowOrder(sheet, viewNames))
    .toEqual([secondViewName, thirdViewName, firstViewName]);

  // The reorder gesture must never drive page/pane/sheet scrolling.
  expect(await pageScrollY()).toBe(initialPageScrollY);

  // secondViewName's selection must survive the drag, and the click browsers fire
  // immediately after mouseup (landing on the row the drag just moved) must not select
  // that row — otherwise every completed drag would also change the active view.
  await expect(sheet.getByRole('button', { name: secondViewName })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(sheet.getByRole('button', { name: firstViewName })).not.toHaveAttribute(
    'aria-current',
    'true',
  );

  await firstRow.click();
  await expect(sheet.getByRole('button', { name: firstViewName })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await closeBottomSheet(page, /database views sheet/i);
});

test('desktop: dragging a database sorting row by its full row reorders the sort list and persists', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'desktop mouse full-row drag activation');

  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('sorting drag lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('sorting drag catalog'));
  await openDocumentFromExplorer(page, documentName);

  const firstProperty = await createStringProperty(page, createUniqueName('alpha'));
  const secondProperty = await createStringProperty(page, createUniqueName('bravo'));
  await addDatabaseItem(page, firstProperty, createUniqueName('row'));

  await addSorting(page, firstProperty);
  await addSorting(page, secondProperty);

  const sheet = await openSortSheet(page);
  const propertyNames = [firstProperty, secondProperty];
  await expect.poll(() => getViewRowOrder(sheet, propertyNames)).toEqual(propertyNames);

  const firstRow = findListRow(sheet, firstProperty);
  const secondRow = findListRow(sheet, secondProperty);
  const firstRowAction = firstRow.getByRole('button', { name: firstProperty }).first();
  const secondRowAction = secondRow.getByRole('button', { name: secondProperty }).first();
  const secondRowActionBox = await secondRowAction.boundingBox();
  if (!secondRowActionBox) {
    throw new Error('missing bounding box for sorting row');
  }

  // Regression guard for the sorting-row drag defect: v-reorder-item is applied to the
  // DatabaseSortingListItem component (a nested component-root consumer), and the drag
  // starts on the row's own primary-action surface — the full-row native contract.
  await performMouseDrag(
    page,
    await getCenterPoint(firstRowAction),
    {
      x: secondRowActionBox.x + secondRowActionBox.width / 2,
      y: secondRowActionBox.y + secondRowActionBox.height - 6,
    },
    {
      steps: 20,
      settleMs: 500,
    },
  );

  await expect
    .poll(() => getViewRowOrder(sheet, propertyNames))
    .toEqual([secondProperty, firstProperty]);

  // The new order must be persisted through the entity, not just previewed optimistically.
  await closeBottomSheet(page, /database sort sheet/i);
  const reopenedSheet = await openSortSheet(page);
  await expect
    .poll(() => getViewRowOrder(reopenedSheet, propertyNames))
    .toEqual([secondProperty, firstProperty]);

  await closeBottomSheet(page, /database sort sheet/i);
});

test('desktop: an active full-row reorder keeps the dragged row as a normal list row with no overlay, clone, or browser drag image, and reorders the list reactively before release', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'desktop mouse full-row drag activation');

  const { firstViewName, secondViewName, thirdViewName } = await setupViewCatalog(
    page,
    'reorder visual model',
  );

  const sheet = await openViewsSheet(page);
  const viewNames = [firstViewName, secondViewName, thirdViewName];
  await expect.poll(() => getViewRowOrder(sheet, viewNames)).toEqual(viewNames);

  await installDragStartCounter(page);

  const firstRow = findListRow(sheet, firstViewName);
  const thirdRow = findListRow(sheet, thirdViewName);
  const from = await getCenterPoint(firstRow.getByRole('button', { name: firstViewName }).first());
  const to = await getCenterPoint(thirdRow.getByRole('button', { name: thirdViewName }).first());

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y + 8, { steps: 4 }); // clears the activation threshold
  await page.mouse.move(to.x, to.y, { steps: 16 });

  // The reactive reorder actually moves the row in the list before release — this is the
  // Vue-reactive contract, not a lifted preview that only resolves on drop.
  await expect.poll(() => getViewRowOrder(sheet, viewNames)).not.toEqual(viewNames);

  // No lifted overlay, DOM clone, or SortableJS-style ghost/fallback/chosen artifact
  // anywhere in the document, and the dragged row is still the real in-list row.
  const probe = await page.evaluate(
    ({ selector }) => {
      const legacyArtifactSelectors = [
        '.reorder-overlay',
        '.reorder-item_slot',
        '.reorder-item_ghost',
        '.reorder-item_fallback',
        '.reorder-item_chosen',
        '.reorder-item_drag',
      ];

      return {
        legacyArtifactCount: document.querySelectorAll(legacyArtifactSelectors.join(', ')).length,
        draggedRowCount: document.querySelectorAll(selector).length,
      };
    },
    { selector: '.md-state_dragged' },
  );

  expect(probe.legacyArtifactCount).toBe(0);
  // Exactly one row (the real row) carries the dragged visual state; there is no second
  // (lifted/cloned) element also showing it.
  expect(probe.draggedRowCount).toBe(1);
  expect(await getDragstartCount(page)).toBe(0);

  await page.mouse.up();

  await expect(page.locator('.md-state_dragged')).toHaveCount(0);

  await closeBottomSheet(page, /database views sheet/i);
});

test('desktop: clicking a trailing action opens its menu without starting a drag', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'desktop pointer ignore-zone scoping');

  const { firstViewName, secondViewName, thirdViewName } = await setupViewCatalog(
    page,
    'reorder trailing action',
  );

  const sheet = await openViewsSheet(page);
  const viewNames = [firstViewName, secondViewName, thirdViewName];
  const settingsButton = findListRow(sheet, firstViewName).getByRole('button', {
    name: /settings view/i,
  });
  await settingsButton.click();

  await expect(page.getByRole('menuitem', { name: /^rename$/i })).toBeVisible();
  // Closes the menu via its own trigger toggle rather than Escape, which also closes
  // the enclosing bottom sheet.
  await settingsButton.click();

  await expect.poll(() => getViewRowOrder(sheet, viewNames)).toEqual(viewNames);

  await closeBottomSheet(page, /database views sheet/i);
});

test('Mobile Chrome: tapping a database view row selects it without starting a drag', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'touch-only tap activation');

  const { firstViewName, secondViewName } = await setupViewCatalog(page, 'reorder tap select');
  const viewNames = [firstViewName, secondViewName];

  const sheet = await openViewsSheet(page);
  await sheet.getByRole('button', { name: secondViewName }).tap();

  await expect(sheet.getByRole('button', { name: secondViewName })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect.poll(() => getViewRowOrder(sheet, viewNames)).toEqual(viewNames);
});

test('Mobile Chrome: a quick vertical pointer movement over a row without a long press does not reorder the list', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'touch-only scroll-vs-drag disambiguation');

  const { firstViewName, secondViewName, thirdViewName } = await setupViewCatalog(
    page,
    'reorder quick movement',
  );

  const sheet = await openViewsSheet(page);
  const viewNames = [firstViewName, secondViewName, thirdViewName];
  const row = sheet.getByRole('button', { name: firstViewName });
  const box = await row.boundingBox();
  if (!box) {
    throw new Error('missing bounding box for view row');
  }

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  // Dispatched as real DOM PointerEvents from inside the page (not via Playwright/CDP
  // input synthesis): the reorder session drives its whole activation gate from Pointer
  // Events. This only proves that fast vertical movement with no press delay does not
  // arm a reorder: touch input gates activation behind a long press, and movement beyond
  // the touch slop before the long press cancels the pending press. Because these are
  // synthetic PointerEvents dispatched from inside the page rather than a real OS-level
  // touch gesture, the browser's own scroll/compositor path never runs, so this test
  // cannot and does not assert that the sheet actually scrolled.
  await page.evaluate(
    ({ startX, startY, endY }) => {
      const dispatch = (type: string, clientX: number, clientY: number) => {
        const target = document.elementFromPoint(clientX, clientY) ?? document.body;
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            button: 0,
            pointerType: 'touch',
          }),
        );
      };

      dispatch('pointerdown', startX, startY);
      dispatch('pointermove', startX, endY);
      dispatch('pointerup', startX, endY);
    },
    { startX: x, startY: y, endY: y + 80 },
  );

  await expect.poll(() => getViewRowOrder(sheet, viewNames)).toEqual(viewNames);
});

test('Mobile Chrome: long-pressing then moving a row reorders the list', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'touch-only long-press activation');

  const { firstViewName, secondViewName, thirdViewName } = await setupViewCatalog(
    page,
    'reorder long press',
  );

  const sheet = await openViewsSheet(page);
  const viewNames = [firstViewName, secondViewName, thirdViewName];
  // Settles the sheet's open/enter transition before reading fixed CDP touch
  // coordinates below: unlike a locator `.tap()`, raw CDP touch points are captured
  // once and do not get Playwright's own actionability/stability waiting.
  await expect.poll(() => getViewRowOrder(sheet, viewNames)).toEqual(viewNames);
  const firstRow = sheet.getByRole('button', { name: firstViewName });
  const thirdRow = sheet.getByRole('button', { name: thirdViewName });

  // Real touch input via CDP, not synthetic dispatchEvent — the reorder starts on the
  // row's own primary-action surface after a long press, matching the full-row
  // contract under test. The geometry-based target-index calculation does not depend on
  // the container's native DnD hit-testing path that blocked this scenario under
  // SortableJS.
  await performCdpTouchLongPressDrag(
    page,
    await getCenterPoint(firstRow),
    await getCenterPoint(thirdRow),
    // Extra headroom above the 180ms long-press threshold for a resource-constrained
    // container runner, where JS timer callbacks can lag behind wall-clock CDP timing.
    { pressDelayMs: 400, stepDelayMs: 30, settleMs: 250 },
  );

  await expect
    .poll(() => getViewRowOrder(sheet, viewNames))
    .toEqual([secondViewName, thirdViewName, firstViewName]);
});

test('Mobile Chrome: tapping a trailing action opens its menu without starting a drag', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'touch-only ignore-zone check');

  const { firstViewName, secondViewName, thirdViewName } = await setupViewCatalog(
    page,
    'reorder trailing action touch',
  );

  const sheet = await openViewsSheet(page);
  const viewNames = [firstViewName, secondViewName, thirdViewName];
  const settingsButton = findListRow(sheet, firstViewName).getByRole('button', {
    name: /settings view/i,
  });
  await settingsButton.tap();

  await expect(page.getByRole('menuitem', { name: /^rename$/i })).toBeVisible();
  // Closes the menu via its own trigger toggle rather than Escape, which also closes
  // the enclosing bottom sheet.
  await settingsButton.tap();

  await expect.poll(() => getViewRowOrder(sheet, viewNames)).toEqual(viewNames);
});
