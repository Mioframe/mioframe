import { expect, test } from '@playwright/test';
import { openStory } from '../../../tests/e2e/storybook/storybook.testUtils';

// TanStack scroll/measurement correction can take a couple of frames to settle; assertions
// poll for the observable outcome instead of sleeping.
const GEOMETRY_TOLERANCE_PX = 4;

test.describe('DatabaseVirtualizationCapability native-table model', () => {
  test('renders semantic native table structure with logical row/column accessibility counts', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const table = page.getByTestId('db-virt-table');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(table.locator('thead')).toHaveCount(1);
    await expect(table.locator('tbody')).toHaveCount(1);
    await expect(table).toHaveAttribute('aria-rowcount', '5001');
    await expect(table).toHaveAttribute('aria-colcount', '40');

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

  test('measures dynamic <tr> height from mounted row content', async ({ page }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const row = page.getByTestId('db-virt-row-1');
    const initialBox = await row.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.getByTestId('db-virt-grow-row-index').fill('1');
    await page.getByTestId('db-virt-grow-row-button').click();

    await expect
      .poll(async () => (await row.boundingBox())?.height ?? 0)
      .toBeGreaterThan((initialBox?.height ?? 0) + GEOMETRY_TOLERANCE_PX);
  });

  test('measures dynamic <th> width driven by mounted body-cell content in that column', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const header = page.getByTestId('db-virt-header-cell-2');
    const initialBox = await header.boundingBox();
    expect(initialBox).not.toBeNull();

    // Only body-cell content changes; the header's own text stays "Col 2". Native table
    // auto-layout aggregates header + mounted body cells, so the <th> width must still grow.
    await page.getByTestId('db-virt-grow-col-index').fill('2');
    await page.getByTestId('db-virt-grow-col-button').click();

    await expect
      .poll(async () => (await header.boundingBox())?.width ?? 0)
      .toBeGreaterThan((initialBox?.width ?? 0) + GEOMETRY_TOLERANCE_PX);
  });

  test('keeps deep vertical and horizontal offsets correct while bounding mounted DOM', async ({
    page,
  }) => {
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

  test('does not shrink a previously measured column below its last known width during ordinary scroll', async ({
    page,
  }) => {
    await openStory(page, 'entities-databasedata-databasevirtualizationcapability--default');

    const header = page.getByTestId('db-virt-header-cell-3');
    await page.getByTestId('db-virt-grow-col-index').fill('3');
    await page.getByTestId('db-virt-grow-col-button').click();
    await page.getByTestId('db-virt-grow-col-button').click();

    await expect.poll(async () => (await header.boundingBox())?.width ?? 0).toBeGreaterThan(50);
    const grownWidth = (await header.boundingBox())?.width ?? 0;

    const viewport = page.getByTestId('db-virt-viewport');
    await viewport.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(page.getByTestId('db-virt-header-cell-3')).toHaveCount(0);

    await viewport.evaluate((el) => {
      el.scrollLeft = 0;
    });
    const headerAgain = page.getByTestId('db-virt-header-cell-3');
    await expect(headerAgain).toBeVisible();

    await expect
      .poll(async () => (await headerAgain.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(grownWidth - GEOMETRY_TOLERANCE_PX);
  });
});
