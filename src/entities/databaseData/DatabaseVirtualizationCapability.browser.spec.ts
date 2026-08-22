import { expect, test } from '@playwright/test';
import { openStory } from '../../../tests/e2e/storybook/storybook.testUtils';

// TanStack scroll/measurement correction can take a couple of frames to settle; assertions
// poll for the observable outcome instead of sleeping.
const GEOMETRY_TOLERANCE_PX = 4;
const ROW_BASE_HEIGHT_PX = 28;
const COL_COUNT = 300;
const ROW_COUNT = 5000;
// The tolerated above-viewport resize anchor movement must remain below one representative row
// height, not require pixel-exact anchoring.
const ANCHOR_TOLERANCE_PX = ROW_BASE_HEIGHT_PX;

test.describe('DatabaseVirtualizationCapability native-table model', () => {
  test('renders through actual MDTable with logical row/column accessibility counts', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const table = page.getByTestId('db-virt-table');
    await expect(table).toHaveClass(/md-table/);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(table.locator('thead')).toHaveCount(1);
    await expect(table.locator('tbody')).toHaveCount(1);
    await expect(table).toHaveAttribute('aria-rowcount', '5001');
    await expect(table).toHaveAttribute('aria-colcount', '300');

    await expect(page.getByRole('row').first()).toBeVisible();
    await expect(page.getByRole('columnheader').first()).toBeVisible();
    await expect(page.getByRole('cell').first()).toBeVisible();
  });

  test('excludes spacer/fill DOM from logical accessibility semantics', async ({ page }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    // Presentation-only spacer rows/columns are hidden from the accessibility tree.
    await expect(page.getByTestId('db-virt-row-spacer-top')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByTestId('db-virt-row-spacer-bottom')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(page.getByTestId('db-virt-header-spacer-left')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(page.getByTestId('db-virt-header-spacer-right')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    // Spacer rows/cells never resolve through the accessible row/columnheader role queries.
    await expect(page.getByRole('row').and(page.getByTestId('db-virt-row-spacer-top'))).toHaveCount(
      0,
    );
    await expect(
      page.getByRole('columnheader').and(page.getByTestId('db-virt-header-spacer-left')),
    ).toHaveCount(0);

    // A real logical data row/cell carries no aria-hidden and IS exposed through those roles.
    const dataRow = page.getByTestId('db-virt-row-0');
    const dataHeaderCell = page.getByTestId('db-virt-header-cell-0');
    await expect(dataRow).not.toHaveAttribute('aria-hidden');
    await expect(dataHeaderCell).not.toHaveAttribute('aria-hidden');
    await expect(page.getByRole('row').and(dataRow)).toHaveCount(1);
    await expect(page.getByRole('columnheader').and(dataHeaderCell)).toHaveCount(1);
  });

  test('exposes correct logical aria-rowindex/aria-colindex for visible cells', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    await expect(page.getByTestId('db-virt-row-0')).toHaveAttribute('aria-rowindex', '2');
    await expect(page.getByTestId('db-virt-header-cell-0')).toHaveAttribute('aria-colindex', '1');
    await expect(page.getByTestId('db-virt-header-cell-3')).toHaveAttribute('aria-colindex', '4');
  });

  test('measures dynamic <tr> height from mounted row content, growing and shrinking, through public row size', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const row = page.getByTestId('db-virt-row-1');
    const initialBox = await row.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialSize = Number(await row.getAttribute('data-row-size'));

    await page.getByTestId('db-virt-grow-row-index').fill('1');
    await page.getByTestId('db-virt-grow-row-button').click();

    await expect
      .poll(async () => (await row.boundingBox())?.height ?? 0)
      .toBeGreaterThan((initialBox?.height ?? 0) + GEOMETRY_TOLERANCE_PX);
    await expect
      .poll(async () => Number(await row.getAttribute('data-row-size')))
      .toBeGreaterThan(initialSize + GEOMETRY_TOLERANCE_PX);

    const grownBox = await row.boundingBox();
    const grownSize = Number(await row.getAttribute('data-row-size'));

    await page.getByTestId('db-virt-shrink-row-button').click();

    await expect
      .poll(async () => (await row.boundingBox())?.height ?? 0)
      .toBeLessThan((grownBox?.height ?? 0) - GEOMETRY_TOLERANCE_PX);
    await expect
      .poll(async () => Number(await row.getAttribute('data-row-size')))
      .toBeLessThan(grownSize - GEOMETRY_TOLERANCE_PX);
  });

  test('measures dynamic <th> width driven by mounted body-cell content in that column, through public column size', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const header = page.getByTestId('db-virt-header-cell-2');
    const initialBox = await header.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialSize = Number(await header.getAttribute('data-col-size'));

    // Only body-cell content changes; the header's own text stays "Col 2". Native table
    // auto-layout aggregates header + mounted body cells, so the <th> width must still grow.
    await page.getByTestId('db-virt-grow-col-index').fill('2');
    await page.getByTestId('db-virt-grow-col-button').click();

    await expect
      .poll(async () => (await header.boundingBox())?.width ?? 0)
      .toBeGreaterThan((initialBox?.width ?? 0) + GEOMETRY_TOLERANCE_PX);
    await expect
      .poll(async () => Number(await header.getAttribute('data-col-size')))
      .toBeGreaterThan(initialSize + GEOMETRY_TOLERANCE_PX);
  });

  test('keeps deep vertical offsets correct while bounding mounted DOM', async ({ page }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    // A very large scrollTop clamps deterministically to the real max scroll offset in every
    // engine; mouse-wheel pixel-delta scaling is not consistent enough across browsers for a
    // precise deep-scroll target.
    const viewport = page.getByTestId('db-virt-viewport');
    await viewport.evaluate((el) => {
      el.scrollTop = Number.MAX_SAFE_INTEGER;
    });

    await expect
      .poll(async () => Number(await page.getByTestId('db-virt-mounted-rows').textContent()))
      .toBeGreaterThan(0);

    const mountedRows = Number(await page.getByTestId('db-virt-mounted-rows').textContent());
    expect(mountedRows).toBeLessThan(30);

    await expect
      .poll(async () =>
        page
          .getByTestId('db-virt-row-spacer-top')
          .evaluate((el) => el.getBoundingClientRect().height),
      )
      .toBeGreaterThan(100000);

    const visibleRowIndices = await page
      .locator(
        '[data-testid^="db-virt-row-"]:not([data-testid$="-top"]):not([data-testid$="-bottom"])',
      )
      .evaluateAll((rows) => rows.map((row) => Number(row.getAttribute('aria-rowindex'))));
    expect(Math.min(...visibleRowIndices)).toBeGreaterThan(4900);
  });

  test('keeps deep horizontal offsets correct, reaching a property near the end in header and body', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const viewport = page.getByTestId('db-virt-viewport');
    await viewport.evaluate((el) => {
      el.scrollLeft = Number.MAX_SAFE_INTEGER;
    });

    await expect
      .poll(async () => Number(await page.getByTestId('db-virt-mounted-cols').textContent()))
      .toBeGreaterThan(0);

    const mountedCols = Number(await page.getByTestId('db-virt-mounted-cols').textContent());
    expect(mountedCols).toBeLessThan(30);

    await expect
      .poll(async () =>
        page
          .getByTestId('db-virt-header-spacer-left')
          .evaluate((el) => el.getBoundingClientRect().width),
      )
      .toBeGreaterThan(10000);

    const visibleHeaderColIndices = await page
      .locator('[data-testid^="db-virt-header-cell-"]')
      .evaluateAll((cells) => cells.map((cell) => Number(cell.getAttribute('aria-colindex'))));
    expect(Math.max(...visibleHeaderColIndices)).toBeGreaterThanOrEqual(291);

    const visibleBodyColIndices = await page
      .locator('[data-testid^="db-virt-cell-0-"]')
      .evaluateAll((cells) => cells.map((cell) => Number(cell.getAttribute('aria-colindex'))));

    // Header and body use the exact same property collection range.
    expect([...visibleHeaderColIndices].sort((a, b) => a - b)).toEqual(
      [...visibleBodyColIndices].sort((a, b) => a - b),
    );

    // Early properties are no longer mounted anywhere.
    await expect(page.getByTestId('db-virt-header-cell-0')).toHaveCount(0);
    await expect(page.getByTestId('db-virt-cell-0-0')).toHaveCount(0);
  });

  test('remounts a column at its previously discovered public size as min-width after the widening body content is removed', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const header = page.getByTestId('db-virt-header-cell-3');
    await page.getByTestId('db-virt-grow-col-index').fill('3');
    await page.getByTestId('db-virt-grow-col-button').click();
    await page.getByTestId('db-virt-grow-col-button').click();

    await expect
      .poll(async () => Number(await header.getAttribute('data-col-size')))
      .toBeGreaterThan(50);
    // Record the discovered public size while the widening body content is still present.
    const discoveredSize = Number(await header.getAttribute('data-col-size'));

    const viewport = page.getByTestId('db-virt-viewport');
    await viewport.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(page.getByTestId('db-virt-header-cell-3')).toHaveCount(0);

    // While the column is unmounted, remove the condition that widened it in the first place.
    // If the remount width still stayed at/above the discovered size, that could only be the
    // shared API's public `size` acting as remount min-width, not native body content alone.
    await page.getByTestId('db-virt-grow-col-index').fill('3');
    await page.getByTestId('db-virt-reset-col-button').click();

    await viewport.evaluate((el) => {
      el.scrollLeft = 0;
    });
    const headerAgain = page.getByTestId('db-virt-header-cell-3');
    await expect(headerAgain).toBeVisible();

    await expect
      .poll(async () => (await headerAgain.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(discoveredSize - GEOMETRY_TOLERANCE_PX);
    await expect
      .poll(async () => Number(await headerAgain.getAttribute('data-col-size')))
      .toBeGreaterThanOrEqual(discoveredSize - GEOMETRY_TOLERANCE_PX);

    // Confirm native content alone, without the min-width binding, would have been narrow: an
    // unrelated never-widened column stays near its base estimate.
    const neverWidenedHeader = page.getByTestId('db-virt-header-cell-4');
    const neverWidenedWidth = (await neverWidenedHeader.boundingBox())?.width ?? 0;
    expect(neverWidenedWidth).toBeLessThan(discoveredSize - GEOMETRY_TOLERANCE_PX);
  });

  test('bounds mounted logical data cells far below the full row x column cross product at initial and deep 2D ranges', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    await expect(page.getByTestId('db-virt-mounted-cells')).toBeVisible();

    // A generous upper bound derived from viewport/overscan (well under 30 rows x 30 cols from
    // the existing bounded-rows/bounded-cols contracts), far below the 5,000 x 300 logical cross
    // product of 1,500,000 cells.
    const GENEROUS_CELL_BOUND = 900;

    // The three <output>s can each re-render on their own Vue update tick, so read them in one
    // synchronous browser-side callback to avoid observing a torn snapshot across ticks.
    const readCounts = () =>
      page.evaluate(() => {
        const read = (testId: string) =>
          Number(document.querySelector(`[data-testid="${testId}"]`)?.textContent);
        return {
          rows: read('db-virt-mounted-rows'),
          cols: read('db-virt-mounted-cols'),
          cells: read('db-virt-mounted-cells'),
        };
      });

    const initial = await readCounts();

    expect(initial.rows).toBeGreaterThan(0);
    expect(initial.rows).toBeLessThan(30);
    expect(initial.cols).toBeGreaterThan(0);
    expect(initial.cols).toBeLessThan(30);
    expect(initial.cells).toBe(initial.rows * initial.cols);
    expect(initial.cells).toBeLessThan(GENEROUS_CELL_BOUND);
    expect(initial.cells).toBeLessThan((ROW_COUNT * COL_COUNT) / 1000);

    const viewport = page.getByTestId('db-virt-viewport');
    await viewport.evaluate((el) => {
      el.scrollTop = Number.MAX_SAFE_INTEGER;
      el.scrollLeft = Number.MAX_SAFE_INTEGER;
    });

    await expect.poll(async () => (await readCounts()).rows).toBeGreaterThan(0);
    await expect.poll(async () => (await readCounts()).cols).toBeGreaterThan(0);

    // Consistency (cells === rows * cols) can only be asserted once both axes have settled;
    // poll for a torn-free, self-consistent snapshot instead of racing three separate reads.
    let deep: { rows: number; cols: number; cells: number } | undefined;
    await expect
      .poll(async () => {
        const counts = await readCounts();
        const consistent = counts.cells === counts.rows * counts.cols;
        if (consistent) deep = counts;
        return consistent;
      })
      .toBe(true);
    if (!deep) throw new Error('unreachable: poll only resolves once deep is set');

    expect(deep.rows).toBeLessThan(30);
    expect(deep.cols).toBeLessThan(30);
    expect(deep.cells).toBe(deep.rows * deep.cols);
    expect(deep.cells).toBeLessThan(GENEROUS_CELL_BOUND);
    expect(deep.cells).toBeLessThan((ROW_COUNT * COL_COUNT) / 1000);
  });

  test('keeps a visible anchor row within one row height while an above-viewport row is resized', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const viewport = page.getByTestId('db-virt-viewport');
    // Scroll deep enough that some previously-mounted rows fall fully above the viewport while
    // remaining within the overscan-mounted buffer.
    await viewport.evaluate((el, scrollTarget) => {
      el.scrollTop = scrollTarget;
    }, 50 * ROW_BASE_HEIGHT_PX);

    await expect
      .poll(async () => Number(await page.getByTestId('db-virt-mounted-rows').textContent()))
      .toBeGreaterThan(0);

    const rowSelector =
      '[data-testid^="db-virt-row-"]:not([data-testid$="-top"]):not([data-testid$="-bottom"])';
    await expect.poll(async () => page.locator(rowSelector).count()).toBeGreaterThan(0);

    const { aboveViewportIndex, anchorIndex, anchorYBefore } = await page
      .locator(rowSelector)
      .evaluateAll((rowEls, viewportTestId) => {
        const viewportEl = document.querySelector(`[data-testid="${viewportTestId}"]`);
        const viewportTop = viewportEl?.getBoundingClientRect().top ?? 0;
        const viewportBottom = viewportEl?.getBoundingClientRect().bottom ?? 0;
        // Sub-pixel layout rounding can make a strict full-containment boundary check flaky;
        // classify by overlap with a small epsilon instead of exact edge comparisons.
        const EPSILON_PX = 0.5;

        const rows = rowEls.map((el) => ({
          index: Number(el.getAttribute('aria-rowindex')) - 2,
          rect: el.getBoundingClientRect(),
        }));

        const above = rows.filter((row) => row.rect.bottom <= viewportTop + EPSILON_PX);
        // Any row overlapping the viewport box at all counts as an anchor candidate; the middle
        // one avoids picking a row that is only partially clipped at an edge.
        const overlapping = rows.filter(
          (row) =>
            row.rect.bottom > viewportTop + EPSILON_PX &&
            row.rect.top < viewportBottom - EPSILON_PX,
        );
        const anchor = overlapping.at(Math.floor(overlapping.length / 2));

        return {
          aboveViewportIndex: above[0]?.index ?? -1,
          anchorIndex: anchor?.index ?? -1,
          anchorYBefore: anchor?.rect.top ?? 0,
        };
      }, 'db-virt-viewport');

    expect(aboveViewportIndex).toBeGreaterThanOrEqual(0);
    expect(anchorIndex).toBeGreaterThanOrEqual(0);

    const aboveRow = page.getByTestId(`db-virt-row-${aboveViewportIndex}`);
    const initialAboveSize = Number(await aboveRow.getAttribute('data-row-size'));

    await page.getByTestId('db-virt-grow-row-index').fill(String(aboveViewportIndex));
    await page.getByTestId('db-virt-grow-row-button').click();

    await expect
      .poll(async () => Number(await aboveRow.getAttribute('data-row-size')))
      .toBeGreaterThan(initialAboveSize + GEOMETRY_TOLERANCE_PX);

    const anchorRow = page.getByTestId(`db-virt-row-${anchorIndex}`);
    await expect
      .poll(async () => {
        const box = await anchorRow.boundingBox();
        return Math.abs((box?.y ?? anchorYBefore) - anchorYBefore);
      })
      .toBeLessThan(ANCHOR_TOLERANCE_PX);
  });
});
