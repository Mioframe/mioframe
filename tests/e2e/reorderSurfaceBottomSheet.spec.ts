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
import {
  assertScrollTopHoldsAtBaseline,
  sampleScrollTop,
  waitForStableScrollTop,
} from './reorderSurface.testUtils';

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

test.describe('bottom sheet scroll stability during activation and release', () => {
  test('grabbing and releasing a row near the top edge does not move the bottom sheet', async ({
    page,
  }) => {
    test.slow();
    await launchApp(page);
    await openOpfs(page);

    const directoryName = await createDirectory(page, createUniqueName('scroll stability lab'));
    await openDirectory(page, directoryName);

    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('scroll stability catalog'),
    );
    await openDocumentFromExplorer(page, documentName);

    const propertyName = await createStringProperty(page, createUniqueName('title'));
    await addDatabaseItem(page, propertyName, createUniqueName('row'));

    // Enough views to overflow the sheet's own open-reveal height and create meaningful
    // bottom-sheet scroll room.
    const viewNames: string[] = [];
    for (let index = 0; index < 18; index += 1) {
      const viewName = createUniqueName(`view stability ${String(index).padStart(2, '0')}`);
      // eslint-disable-next-line no-await-in-loop -- each view must be created before the next
      viewNames.push(await addView(page, viewName));
    }

    const sheet = await openViewsSheet(page);
    const list = sheet.getByRole('list');
    const dragHandle = sheet.getByRole('button', { name: /close sheet|expand sheet/i });

    // The sheet opens itself to a non-zero scrollTop; wait for that open animation to settle
    // before arranging the rest of the scenario.
    const openedScrollTop = await waitForStableScrollTop(sheet);
    expect(openedScrollTop).toBeGreaterThan(0);

    // Scroll a little further, as a user browsing past the header to reach a row further down a
    // long list would, until the drag handle has just scrolled out of view while a reorder row's
    // top edge is still visible: the exact "row near the top edge of the screen, no autoscroll
    // needed" geometry from the bug report.
    await expect
      .poll(
        async () => {
          const handleBox = await dragHandle.boundingBox();
          if (handleBox && handleBox.y + handleBox.height <= 0) {
            return true;
          }
          await sheet.evaluate((el) => {
            el.scrollTo({ top: el.scrollTop + 8, behavior: 'instant' });
          });
          return false;
        },
        { timeout: 10000, intervals: [30] },
      )
      .toBe(true);

    await waitForStableScrollTop(sheet);

    // The reorder container's own top edge must already be visible: no autoscroll should be
    // needed to reveal it before or during this gesture.
    const listBoxBeforeDrag = await list.boundingBox();
    if (!listBoxBeforeDrag) {
      throw new Error('missing bounding box for reorder container');
    }
    expect(listBoxBeforeDrag.y).toBeGreaterThanOrEqual(-1);

    // Find the row closest to (but not above) the top edge of the viewport.
    const allRows = list.locator(':scope > *');
    const rowCount = await allRows.count();
    const rowBoxes: {
      index: number;
      box: { x: number; y: number; width: number; height: number };
    }[] = [];
    for (let i = 0; i < rowCount; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- geometry must be read row by row in order
      const box = await allRows.nth(i).boundingBox();
      if (box) {
        rowBoxes.push({ index: i, box });
      }
    }
    const chosen = rowBoxes
      .filter((r) => r.box.y >= 0)
      .sort((a, b) => a.box.y - b.box.y)
      .at(0);
    if (!chosen) {
      throw new Error('no visible reorder row found near the top edge');
    }
    expect(chosen.box.y).toBeLessThan(50);

    const draggedRow = allRows.nth(chosen.index);
    const rowCenterX = chosen.box.x + chosen.box.width / 2;
    const rowCenterY = chosen.box.y + chosen.box.height / 2;

    // Baseline geometry snapshot: a small fractional tolerance absorbs layout rounding, but any
    // larger deviation is a real, user-visible jump.
    const scrollTopBeforeDrag = await sheet.evaluate((el) => el.scrollTop);
    const scrollTolerance = 1;

    const assertNoJump = async (label: string) => {
      const current = await sheet.evaluate((el) => el.scrollTop);
      expect(Math.abs(current - scrollTopBeforeDrag), label).toBeLessThanOrEqual(scrollTolerance);
    };

    // Autoscroll guard: the container's top is already visible and the pointer has not entered
    // a scroll-triggering edge zone, so the reorder plugin must not request scrim movement yet.
    await assertNoJump('scrollTop before activation');

    // Pointer-down on the row's real primary-action button.
    await page.mouse.move(rowCenterX, rowCenterY);
    await page.mouse.down();
    await assertNoJump('scrollTop right after pointerdown');

    // Cross the mouse activation distance by only a small amount.
    await page.mouse.move(rowCenterX, rowCenterY + 8, { steps: 4 });
    await expect(draggedRow).toHaveClass(/md-state_dragged/);
    await assertNoJump('scrollTop right after activation');

    // Sample several animation frames: a jump that happens and later settles back must still be
    // caught, not just the tail end of the gesture.
    const activationSamples = await sampleScrollTop(page, sheet);
    assertScrollTopHoldsAtBaseline(activationSamples, scrollTopBeforeDrag);

    // Slightly move the row without requiring ancestor autoscroll.
    await page.mouse.move(rowCenterX, rowCenterY + 20, { steps: 4 });
    await assertNoJump('scrollTop after a small in-place move');

    // Trigger a real sortable DOM displacement: move far enough to cross past a neighboring row.
    await page.mouse.move(rowCenterX, rowCenterY + chosen.box.height * 2, { steps: 8 });
    await assertNoJump('scrollTop after a real sortable displacement');

    const displaceSamples = await sampleScrollTop(page, sheet);
    assertScrollTopHoldsAtBaseline(displaceSamples, scrollTopBeforeDrag);

    // Release the pointer; release must not change the sheet position either.
    await page.mouse.up();
    await assertNoJump('scrollTop right after release');

    const releaseSamples = await sampleScrollTop(page, sheet);
    assertScrollTopHoldsAtBaseline(releaseSamples, scrollTopBeforeDrag);

    // Drag cleanup completes: no row is left in the dragged state.
    await expect(sheet.locator('.md-state_dragged')).toHaveCount(0);

    // Focus remains inside the modal bottom sheet, and the focus trap keeps cycling focus
    // within it instead of leaking out to the surrounding page.
    const isFocusInsideSheet = () =>
      page.evaluate(() => {
        const scrim = document.querySelector('.md-bottom-sheet__scrim');
        return !!scrim && scrim.contains(document.activeElement);
      });
    expect(await isFocusInsideSheet()).toBe(true);

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- each Tab must land before the next is sent
      await page.keyboard.press('Tab');
      // eslint-disable-next-line no-await-in-loop -- containment must be checked after each Tab
      expect(await isFocusInsideSheet(), `focus stayed trapped after Tab #${i + 1}`).toBe(true);
    }

    // The focus trap remains functional for its other documented behavior too: Escape still
    // closes the modal sheet.
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);

    // Ordinary intentional bottom-sheet scrolling still works after all of this.
    const reopenedSheet = await openViewsSheet(page);
    await waitForStableScrollTop(reopenedSheet);
    const scrollTopBeforeWheel = await reopenedSheet.evaluate((el) => el.scrollTop);
    await reopenedSheet.hover();
    await page.mouse.wheel(0, 200);
    await expect
      .poll(() => reopenedSheet.evaluate((el) => el.scrollTop))
      .not.toBe(scrollTopBeforeWheel);

    await closeBottomSheet(page, /database views sheet/i);
  });
});
