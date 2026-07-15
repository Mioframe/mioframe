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

// Samples a scrollable element's `scrollTop` across consecutive rendered animation frames. A real
// autoscroll loop would increment `scrollTop` every single frame for as long as the pointer stays
// near the edge, so comparing every sample (not just the last few) against a pre-hold baseline is
// required to catch a scroll that happens first and then stops.
const sampleScrollTop = async (
  page: Page,
  scrollable: { evaluate: (fn: (el: HTMLElement) => number) => Promise<number> },
  frameCount = 12,
): Promise<number[]> => {
  const samples: number[] = [];
  for (let frame = 0; frame < frameCount; frame += 1) {
    // eslint-disable-next-line no-await-in-loop -- each frame must render before the next
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    // eslint-disable-next-line no-await-in-loop -- sampling must happen in order, one per frame
    samples.push(await scrollable.evaluate((el) => el.scrollTop));
  }
  return samples;
};

const assertScrollTopHoldsAtBaseline = (samples: number[], baseline: number): void => {
  for (const sample of samples) {
    expect(
      Math.abs(sample - baseline),
      `scrollTop samples: ${samples.join(', ')}, baseline: ${baseline}`,
    ).toBeLessThanOrEqual(1);
  }
};

// Waits for a scrollable element's `scrollTop` to hold steady across several consecutive polls,
// not just one, before treating it as settled: a single matching poll pair can still land inside
// an in-progress reposition (e.g. the bottom sheet's own ResizeObserver-driven watcher) on a
// resource-constrained runner.
const waitForStableScrollTop = async (
  scrollable: { evaluate: (fn: (el: HTMLElement) => number) => Promise<number> },
  requiredStableReads = 3,
): Promise<number> => {
  let previous = await scrollable.evaluate((el) => el.scrollTop);
  let stableCount = 1;
  await expect
    .poll(
      async () => {
        const current = await scrollable.evaluate((el) => el.scrollTop);
        stableCount = current === previous ? stableCount + 1 : 1;
        previous = current;
        return stableCount >= requiredStableReads;
      },
      { timeout: 5000, intervals: [200] },
    )
    .toBe(true);
  return previous;
};

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

test.describe('scoped autoscroll', () => {
  test('a fully visible list does not scroll its bottom sheet while holding near either edge', async ({
    page,
  }) => {
    test.slow();
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(
      page,
      createUniqueName('reorder scope visible lab'),
    );
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('reorder scope visible catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    // A single added view (plus the document's own default view) keeps the list short enough to
    // stay fully visible even on the narrowest supported viewport.
    const firstViewName = await addView(page, createUniqueName('view scope alpha'));

    const sheet = await openViewsSheet(page);
    const list = sheet.getByRole('list');
    const draggedRow = findListRow(sheet, firstViewName);

    // The document's own default view row renders alongside added views, but can settle into the
    // list a moment after the sheet itself becomes visible. Wait for the final row count before
    // measuring bounds below, or a still-growing list would falsely appear to fit the sheet.
    await expect(list.locator(':scope > *')).toHaveCount(2);

    // Scroll the whole list, not just the dragged row, into view: only the row is guaranteed
    // visible otherwise, and this test specifically needs the entire container visible.
    await list.scrollIntoViewIfNeeded();

    const preDragRowBox = await draggedRow.boundingBox();
    const sheetBox = await sheet.boundingBox();
    if (!preDragRowBox || !sheetBox) {
      throw new Error('missing bounding box for view row or sheet');
    }

    const rowCenterX = preDragRowBox.x + preDragRowBox.width / 2;

    await page.mouse.move(rowCenterX, preDragRowBox.y + preDragRowBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance before probing autoscroll.
    await page.mouse.move(rowCenterX, preDragRowBox.y + preDragRowBox.height / 2 + 8, { steps: 4 });

    // Measure bounds only once the drag is active and settled: dnd-kit's feedback plugin takes
    // the dragged row out of normal flow (`position: fixed`) and inserts a same-size placeholder
    // once activation completes, and the sheet separately repositions itself via a
    // ResizeObserver-driven watcher whenever its body's rendered height changes as a result. Both
    // are unrelated to autoscroll, so wait for them to finish before measuring, or their tail end
    // could be mistaken for the list not fitting.
    await expect(draggedRow).toHaveClass(/md-state_dragged/);
    await waitForStableScrollTop(sheet);

    const rowBox = await draggedRow.boundingBox();
    const listBox = await list.boundingBox();
    if (!rowBox || !listBox) {
      throw new Error('missing live bounding box for view row or list');
    }

    // Sanity: the whole list must already fit inside the sheet's visible viewport rectangle, or
    // this test would not actually exercise the "fully visible container" scenario it targets.
    // The sheet's own `scrollHeight` includes layout padding unrelated to list content, so
    // comparing rendered boxes (rather than scrollHeight/clientHeight) is the reliable check here.
    expect(listBox.y).toBeGreaterThanOrEqual(sheetBox.y - 1);
    expect(listBox.y + listBox.height).toBeLessThanOrEqual(sheetBox.y + sheetBox.height + 1);

    const holdNearEdgeAndAssertNoScroll = async (edgeY: number) => {
      // Record the exact baseline before holding near the edge, then assert every sampled frame
      // during the hold stays within it: a test that only checks the tail of the hold has settled
      // would still pass if the sheet scrolled first and then stopped, which is not this
      // scenario's contract.
      const baseline = await sheet.evaluate((el) => el.scrollTop);

      await page.mouse.move(rowCenterX, edgeY, { steps: 4 });

      const samples = await sampleScrollTop(page, sheet);
      assertScrollTopHoldsAtBaseline(samples, baseline);

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
      expect(draggedBox.y).toBeGreaterThanOrEqual(liveListBox.y - 1);
      expect(draggedBox.y + draggedBox.height).toBeLessThanOrEqual(
        liveListBox.y + liveListBox.height + 1,
      );
    };

    await holdNearEdgeAndAssertNoScroll(sheetBox.y + 2);
    await holdNearEdgeAndAssertNoScroll(sheetBox.y + sheetBox.height - 2);

    await page.mouse.up();

    await closeBottomSheet(page, /database views sheet/i);
  });

  test('a partially hidden list autoscrolls toward hidden rows, stops once revealed, and reverses toward the opposite edge', async ({
    page,
  }) => {
    test.slow();
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(page, createUniqueName('reorder scope hidden lab'));
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('reorder scope hidden catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    const viewNames: string[] = [];
    for (let index = 0; index < 16; index += 1) {
      const viewName = createUniqueName(`view hidden ${String(index).padStart(2, '0')}`);
      // eslint-disable-next-line no-await-in-loop -- each view must be created before the next is added
      viewNames.push(await addView(page, viewName));
    }

    const sheet = await openViewsSheet(page);
    const list = sheet.getByRole('list');
    const firstRow = findListRow(sheet, viewNames[0]);

    // Uses the complete list rectangle, not just one row's loose viewport overlap, so "revealed"
    // reflects the whole reorder container's edge becoming visible, matching the autoscroll
    // contract rather than Playwright's looser, any-overlap `toBeInViewport` definition.
    const isListEdgeVisible = async (edge: 'top' | 'bottom'): Promise<boolean> => {
      const [listBox, liveSheetBox] = await Promise.all([list.boundingBox(), sheet.boundingBox()]);
      if (!listBox || !liveSheetBox) {
        throw new Error('missing live bounding box for list or sheet');
      }
      return edge === 'bottom'
        ? listBox.y + listBox.height <= liveSheetBox.y + liveSheetBox.height + 1
        : listBox.y >= liveSheetBox.y - 1;
    };

    // Signed gap between the list's edge and the sheet's matching visible edge, collapsed to an
    // absolute distance. Autoscroll must stop exactly at this edge, not merely once the edge is
    // somewhere inside the sheet's visible rectangle (which `isListEdgeVisible` above would still
    // accept if autoscroll overshot past the edge and later settled back), so this drives the
    // exact-edge poll below instead.
    const edgeDistance = async (edge: 'top' | 'bottom'): Promise<number> => {
      const [listBox, liveSheetBox] = await Promise.all([list.boundingBox(), sheet.boundingBox()]);
      if (!listBox || !liveSheetBox) {
        throw new Error('missing live bounding box for list or sheet');
      }
      return edge === 'bottom'
        ? Math.abs(listBox.y + listBox.height - (liveSheetBox.y + liveSheetBox.height))
        : Math.abs(listBox.y - liveSheetBox.y);
    };

    // The document's own default view row renders alongside added views, but can settle into the
    // list a moment after the sheet itself becomes visible.
    await expect(list.locator(':scope > *')).toHaveCount(viewNames.length + 1);
    await firstRow.scrollIntoViewIfNeeded();

    // Sanity: the list must overflow the sheet and start with its bottom edge hidden below the
    // sheet's visible rectangle, or this test would not actually exercise the "partially hidden
    // container" scenario it targets.
    await expect
      .poll(() => sheet.evaluate((el) => el.scrollHeight - el.clientHeight))
      .toBeGreaterThan(1);
    await expect.poll(() => isListEdgeVisible('bottom')).toBe(false);

    const sheetBox = await sheet.boundingBox();
    const rowBox = await firstRow.boundingBox();
    if (!sheetBox || !rowBox) {
      throw new Error('missing bounding box for sheet or view row');
    }

    const rowCenterX = rowBox.x + rowBox.width / 2;
    const scrollTopStart = await sheet.evaluate((el) => el.scrollTop);

    await page.mouse.move(rowCenterX, rowBox.y + rowBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance before probing autoscroll.
    await page.mouse.move(rowCenterX, rowBox.y + rowBox.height / 2 + 8, { steps: 4 });
    await page.mouse.move(rowCenterX, sheetBox.y + sheetBox.height - 2, { steps: 4 });

    await expect
      .poll(() => sheet.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(scrollTopStart);
    await expect.poll(() => edgeDistance('bottom'), { timeout: 5000 }).toBeLessThanOrEqual(1);

    // Autoscroll must stop exactly at the container's own bottom edge rather than overshoot past
    // it and settle back: record scrollTop the instant the exact-edge condition above is reached,
    // then sample several animation frames to confirm it holds at that baseline while the pointer
    // is still held near the sheet's edge.
    const scrollTopAtBottomRevealed = await sheet.evaluate((el) => el.scrollTop);
    const bottomHoldSamples = await sampleScrollTop(page, sheet);
    assertScrollTopHoldsAtBaseline(bottomHoldSamples, scrollTopAtBottomRevealed);

    // Moving toward the opposite, now-hidden edge enables scrolling in that direction too.
    await page.mouse.move(rowCenterX, sheetBox.y + 2, { steps: 4 });
    await expect
      .poll(() => sheet.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeLessThan(scrollTopAtBottomRevealed);
    await expect.poll(() => edgeDistance('top'), { timeout: 5000 }).toBeLessThanOrEqual(1);

    // Autoscroll must stop exactly at the container's own top edge, symmetric to the bottom-edge
    // check above.
    const scrollTopAtTopRevealed = await sheet.evaluate((el) => el.scrollTop);
    const topHoldSamples = await sampleScrollTop(page, sheet);
    assertScrollTopHoldsAtBaseline(topHoldSamples, scrollTopAtTopRevealed);

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

    const dragSurfaceX = firstBox.x + firstBox.width / 2;

    await page.mouse.move(dragSurfaceX, firstBox.y + firstBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dragSurfaceX, firstBox.y + firstBox.height / 2 + 8, { steps: 4 });
    await page.mouse.move(dragSurfaceX, secondBox.y + secondBox.height / 2, { steps: 12 });
    await page.mouse.up();

    const rowsAfterDrag = await sheet.getByRole('list').locator(':scope > *').allTextContents();
    expect(indexOfRow(rowsAfterDrag, secondViewName)).toBeLessThan(
      indexOfRow(rowsAfterDrag, firstViewName),
    );

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
    const firstRowWrapper = findListRow(sheet, firstViewName);

    await secondRow.scrollIntoViewIfNeeded();
    await firstRow.scrollIntoViewIfNeeded();

    const rowsBeforeDrag = await sheet.getByRole('list').locator(':scope > *').allTextContents();

    const firstBox = await firstRow.boundingBox();
    const secondBox = await secondRow.boundingBox();
    if (!firstBox || !secondBox) {
      throw new Error('missing bounding box for view row');
    }

    const dragSurfaceX = firstBox.x + firstBox.width / 2;

    await page.mouse.move(dragSurfaceX, firstBox.y + firstBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance so the drag actually activates before cancelling it.
    await page.mouse.move(dragSurfaceX, firstBox.y + firstBox.height / 2 + 8, { steps: 4 });
    await expect(firstRowWrapper).toHaveClass(/md-state_dragged/);

    await page.mouse.move(dragSurfaceX, secondBox.y + secondBox.height / 2, { steps: 8 });

    // Escape cancels the active drag while the physical mouse button is still held down.
    await page.keyboard.press('Escape');
    await expect(firstRowWrapper).not.toHaveClass(/md-state_dragged/);

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
