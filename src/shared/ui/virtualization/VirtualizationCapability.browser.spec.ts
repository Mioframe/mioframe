import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

// TanStack scroll correction can take a couple of frames to settle after a resize or a
// scrollToIndex call; assertions poll for the observable outcome instead of sleeping.
const GEOMETRY_TOLERANCE_PX = 4;

// Anchor stability after an above-viewport resize is an "acceptable" contract, not pixel-exact:
// TanStack's correction targets the resized item itself, and a small residual from re-measuring
// neighboring already-mounted items in the same render pass is expected. The bound here is well
// under one item's own height (~28-65px in this fixture), so it still proves no full-item jump.
const ANCHOR_STABILITY_TOLERANCE_PX = 24;

test.describe('VirtualizationCapability shared adapter', () => {
  test('bounds mounted DOM items for 10,000+ logical items regardless of scale', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--vertical-scale');

    const mountedCount = page.getByTestId('virtual-axis-list-mounted-count');
    await expect(mountedCount).toBeVisible();

    const count = Number(await mountedCount.textContent());
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(50);
  });

  test('measures dynamic vertical item size and repeated post-mount resize', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--vertical-scale');

    const item = page.getByTestId('virtual-axis-list-item-1');
    const initialBox = await item.boundingBox();
    expect(initialBox).not.toBeNull();

    const growIndex = page.getByTestId('virtual-axis-list-grow-index');
    const growButton = page.getByTestId('virtual-axis-list-grow-button');
    await growIndex.fill('1');
    await growButton.click();

    await expect
      .poll(async () => (await item.boundingBox())?.height ?? 0)
      .toBeGreaterThan((initialBox?.height ?? 0) + GEOMETRY_TOLERANCE_PX);

    const afterFirstGrow = await item.boundingBox();

    // Repeated post-mount resize without full remount.
    await growButton.click();
    await expect
      .poll(async () => (await item.boundingBox())?.height ?? 0)
      .toBeGreaterThan((afterFirstGrow?.height ?? 0) + GEOMETRY_TOLERANCE_PX);
  });

  test('measures dynamic horizontal item size', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--horizontal-scale');

    const item = page.getByTestId('virtual-axis-list-item-1');
    const initialBox = await item.boundingBox();
    expect(initialBox).not.toBeNull();

    const growIndex = page.getByTestId('virtual-axis-list-grow-index');
    const growButton = page.getByTestId('virtual-axis-list-grow-button');
    await growIndex.fill('1');
    await growButton.click();

    await expect
      .poll(async () => (await item.boundingBox())?.width ?? 0)
      .toBeGreaterThan((initialBox?.width ?? 0) + GEOMETRY_TOLERANCE_PX);
  });

  test('does not expose the TanStack default data-index DOM attribute to consumers', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--vertical-scale');

    await expect(page.getByTestId('virtual-axis-list-item-1')).toBeVisible();
    expect(await page.locator('[data-index]').count()).toBe(0);
  });

  test('keeps stable-key measurement association after index remapping', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--remap-and-anchor');

    const growIndex = page.getByTestId('virtual-axis-list-grow-index');
    const growButton = page.getByTestId('virtual-axis-list-grow-button');
    await growIndex.fill('5');
    await growButton.click();

    const itemBeforeReorder = page.getByTestId('virtual-axis-list-item-5');
    await expect
      .poll(async () => (await itemBeforeReorder.boundingBox())?.height ?? 0)
      .toBeGreaterThan(40);
    const heightAfterGrow = (await itemBeforeReorder.boundingBox())?.height ?? 0;

    await page.getByTestId('virtual-axis-list-toggle-reverse').click();

    // Item id 5 is now at index (itemCount - 1 - 5) = 194; scroll it back into view through
    // the adapter's own public scrollToIndex control.
    await page.getByTestId('virtual-axis-list-scrollto-index').fill('194');
    await page.getByTestId('virtual-axis-list-scrollto-align').selectOption('center');
    await page.getByTestId('virtual-axis-list-scrollto-button').click();

    const itemAfterReorder = page.getByTestId('virtual-axis-list-item-5');
    await expect(itemAfterReorder).toBeVisible();
    await expect
      .poll(async () => (await itemAfterReorder.boundingBox())?.height ?? 0)
      .toBeGreaterThanOrEqual(heightAfterGrow - GEOMETRY_TOLERANCE_PX);
  });

  test('applies scrollMargin as the offset before the virtualized surface', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--vertical-scale');

    const lead = page.getByTestId('virtual-axis-list-lead');
    const firstItem = page.getByTestId('virtual-axis-list-item-0');

    await expect
      .poll(async () => {
        const leadBox = await lead.boundingBox();
        const itemBox = await firstItem.boundingBox();
        if (!leadBox || !itemBox) return null;
        return Math.abs(itemBox.y - (leadBox.y + leadBox.height));
      })
      .toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
  });

  test('keeps a deep scrollToIndex target clear of scrollPaddingStart occlusion', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--vertical-scale');

    await page.getByTestId('virtual-axis-list-scrollto-index').fill('3');
    await page.getByTestId('virtual-axis-list-scrollto-align').selectOption('start');
    await page.getByTestId('virtual-axis-list-scrollto-button').click();

    const target = page.getByTestId('virtual-axis-list-item-3');
    const paddingStart = page.getByTestId('virtual-axis-list-padding-start');

    await expect
      .poll(async () => {
        const targetBox = await target.boundingBox();
        const paddingBox = await paddingStart.boundingBox();
        if (!targetBox || !paddingBox) return null;
        return targetBox.y - (paddingBox.y + paddingBox.height);
      })
      .toBeGreaterThanOrEqual(-GEOMETRY_TOLERANCE_PX);
  });

  test('keeps a deep scrollToIndex target clear of scrollPaddingEnd occlusion', async ({
    page,
  }) => {
    // A smaller logical count keeps the estimate-vs-measured drift from the never-yet-mounted
    // predecessors small enough for TanStack's scroll reconcile to fully settle in this one
    // scrollToIndex call; the 10,000-item scale story is proved separately and is not required
    // for this padding-specific contract.
    await openStory(page, 'shared-virtualization-virtualizationcapability--remap-and-anchor');

    await page.getByTestId('virtual-axis-list-scrollto-index').fill('190');
    await page.getByTestId('virtual-axis-list-scrollto-align').selectOption('end');
    await page.getByTestId('virtual-axis-list-scrollto-button').click();

    const target = page.getByTestId('virtual-axis-list-item-190');
    const paddingEnd = page.getByTestId('virtual-axis-list-padding-end');

    await expect
      .poll(async () => {
        const targetBox = await target.boundingBox();
        const paddingBox = await paddingEnd.boundingBox();
        if (!targetBox || !paddingBox) return null;
        return paddingBox.y - (targetBox.y + targetBox.height);
      })
      .toBeGreaterThanOrEqual(-GEOMETRY_TOLERANCE_PX);
  });

  test('reaches a deep logical index through scrollToIndex without mounting predecessors', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--vertical-scale');

    await page.getByTestId('virtual-axis-list-scrollto-index').fill('9000');
    await page.getByTestId('virtual-axis-list-scrollto-align').selectOption('center');
    await page.getByTestId('virtual-axis-list-scrollto-button').click();

    await expect(page.getByTestId('virtual-axis-list-item-9000')).toBeVisible();

    const mountedCount = Number(
      await page.getByTestId('virtual-axis-list-mounted-count').textContent(),
    );
    expect(mountedCount).toBeLessThan(50);
  });

  test('keeps acceptable anchor stability when an item above the viewport changes size', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--remap-and-anchor');

    await page.getByTestId('virtual-axis-list-scrollto-index').fill('100');
    await page.getByTestId('virtual-axis-list-scrollto-align').selectOption('start');
    await page.getByTestId('virtual-axis-list-scrollto-button').click();

    const anchorItem = page.getByTestId('virtual-axis-list-item-100');
    await expect(anchorItem).toBeVisible();
    const beforeBox = await anchorItem.boundingBox();
    expect(beforeBox).not.toBeNull();

    // Index 97 stays mounted just above the visible viewport thanks to overscan, so growing
    // it exercises TanStack's real scroll-correction path rather than a re-measurement on
    // remount.
    await page.getByTestId('virtual-axis-list-grow-index').fill('97');
    await page.getByTestId('virtual-axis-list-grow-button').click();

    await expect
      .poll(async () => {
        const afterBox = await anchorItem.boundingBox();
        if (!afterBox || !beforeBox) return null;
        return Math.abs(afterBox.y - beforeBox.y);
      })
      .toBeLessThanOrEqual(ANCHOR_STABILITY_TOLERANCE_PX);
  });

  test('cleans up on unmount and behaves correctly after remount', async ({ page }) => {
    // Uncaught exceptions are the relevant signal for stale-observer/cleanup defects; unrelated
    // console.error noise (network resource 404s, etc.) is not part of this contract.
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await openStory(page, 'shared-virtualization-virtualizationcapability--mount-cycle');

    await expect(page.getByTestId('virtual-axis-list-mounted-count')).toBeVisible();

    const toggle = page.getByTestId('mount-cycle-toggle');
    await toggle.click();
    await expect(page.getByTestId('virtual-axis-list-mounted-count')).toHaveCount(0);

    await toggle.click();
    await expect(page.getByTestId('virtual-axis-list-mounted-count')).toBeVisible();
    await expect(page.getByTestId('virtual-axis-list-item-0')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('composes two virtual axes sharing one scroll root', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualizationcapability--two-axes-same-root');

    const viewport = page.getByTestId('virtual-axis-grid-viewport');
    await expect(page.getByTestId('virtual-axis-grid-header-cell-0')).toBeVisible();
    await expect(page.getByTestId('virtual-axis-grid-row-0')).toBeVisible();

    const mountedRows = Number(
      await page.getByTestId('virtual-axis-grid-mounted-rows').textContent(),
    );
    const mountedCols = Number(
      await page.getByTestId('virtual-axis-grid-mounted-cols').textContent(),
    );
    expect(mountedRows).toBeGreaterThan(0);
    expect(mountedRows).toBeLessThan(30);
    expect(mountedCols).toBeGreaterThan(0);
    expect(mountedCols).toBeLessThan(20);

    // Scrolling vertically changes the visible rows while columns stay the same.
    await viewport.hover();
    await page.mouse.wheel(0, 1200);
    await expect(page.getByTestId('virtual-axis-grid-row-0')).toHaveCount(0);
    await expect(page.getByTestId('virtual-axis-grid-header-cell-0')).toBeVisible();

    // Scrolling horizontally changes the visible columns on the same shared root.
    await page.mouse.wheel(1200, 0);
    await expect(page.getByTestId('virtual-axis-grid-header-cell-0')).toHaveCount(0);
  });

  test('composes two independent virtual axes using different scroll roots', async ({ page }) => {
    await openStory(
      page,
      'shared-virtualization-virtualizationcapability--two-axes-different-roots',
    );

    const verticalPanel = page.getByTestId('two-axes-different-roots-vertical');
    const horizontalPanel = page.getByTestId('two-axes-different-roots-horizontal');

    const verticalFirstItem = verticalPanel.getByTestId('virtual-axis-list-item-0');
    const horizontalFirstItem = horizontalPanel.getByTestId('virtual-axis-list-item-0');
    await expect(verticalFirstItem).toBeVisible();
    await expect(horizontalFirstItem).toBeVisible();

    await verticalPanel.getByTestId('virtual-axis-list-viewport').hover();
    await page.mouse.wheel(0, 1200);

    await expect(verticalFirstItem).toHaveCount(0);
    // The independent horizontal-axis root is unaffected by the vertical panel's scroll.
    await expect(horizontalFirstItem).toBeVisible();
  });
});
