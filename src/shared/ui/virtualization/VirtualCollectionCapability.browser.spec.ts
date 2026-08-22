import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

// TanStack measurement/scroll settling can take a couple of frames; assertions poll for the
// observable outcome instead of sleeping.
const GEOMETRY_TOLERANCE_PX = 4;
// Sub-pixel rounding accumulates across a physically distinct DOM structure (an extra nested
// flex wrapper) or thousands of measured items; coarser cross-structure comparisons use this
// wider tolerance instead of the single-frame GEOMETRY_TOLERANCE_PX.
const STRUCTURAL_TOLERANCE_PX = 20;
const SURFACE_OFFSET_PX = 240;
const BASE_ITEM_SIZE_PX = 40;
const VERTICAL_SCALE_ITEM_COUNT = 10000;

test.describe('VirtualCollectionCapability shared composable', () => {
  test('bounds mounted DOM items for 10,000+ logical items regardless of scale', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--vertical-scale');

    const mountedCount = page.getByTestId('vcc-mounted-count');
    await expect(mountedCount).toBeVisible();

    const count = Number(await mountedCount.textContent());
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(50);
  });

  test('exposes visible item index/key/value matching source truth', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--vertical-scale');

    const item = page.getByTestId('vcc-item-1');
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute('data-item-index', '1');
    await expect(item.locator('pre')).toContainText('Item 1 line 1');
  });

  test('applies the measurement directive with no wrapper DOM and no explicit engine binding in markup', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--vertical-scale');

    const item = page.getByTestId('vcc-item-1');
    await expect(item).toBeVisible();

    // The directive's own private index attribute lands on the exact same element as the
    // consumer's data-testid, proving no wrapper element was introduced between them.
    await expect(
      page.locator('[data-testid="vcc-item-1"][data-mioframe-virtual-index]'),
    ).toHaveCount(1);

    // Consumers never bind TanStack's own default measurement attribute.
    expect(await page.locator('[data-index]').count()).toBe(0);
  });

  test('measures dynamic vertical item growth and shrink through public geometry, not only physical DOM', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--vertical-scale');

    const item = page.getByTestId('vcc-item-1');
    const initialBox = await item.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialSize = Number(await item.getAttribute('data-item-size'));

    await page.getByTestId('vcc-index-input').fill('1');
    await page.getByTestId('vcc-grow-button').click();

    await expect
      .poll(async () => (await item.boundingBox())?.height ?? 0)
      .toBeGreaterThan((initialBox?.height ?? 0) + GEOMETRY_TOLERANCE_PX);
    await expect
      .poll(async () => Number(await item.getAttribute('data-item-size')))
      .toBeGreaterThan(initialSize + GEOMETRY_TOLERANCE_PX);

    const grownBox = await item.boundingBox();
    const grownSize = Number(await item.getAttribute('data-item-size'));

    await page.getByTestId('vcc-shrink-button').click();

    await expect
      .poll(async () => (await item.boundingBox())?.height ?? 0)
      .toBeLessThan((grownBox?.height ?? 0) - GEOMETRY_TOLERANCE_PX);
    await expect
      .poll(async () => Number(await item.getAttribute('data-item-size')))
      .toBeLessThan(grownSize - GEOMETRY_TOLERANCE_PX);
  });

  test('measures dynamic horizontal item growth through public geometry, not only boundingBox width', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--horizontal-scale');

    const item = page.getByTestId('vcc-item-1');
    const initialBox = await item.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialSize = Number(await item.getAttribute('data-item-size'));

    await page.getByTestId('vcc-index-input').fill('1');
    await page.getByTestId('vcc-grow-button').click();

    await expect
      .poll(async () => (await item.boundingBox())?.width ?? 0)
      .toBeGreaterThan((initialBox?.width ?? 0) + GEOMETRY_TOLERANCE_PX);
    await expect
      .poll(async () => Number(await item.getAttribute('data-item-size')))
      .toBeGreaterThan(initialSize + GEOMETRY_TOLERANCE_PX);
  });

  test('keeps stable-key measurement association after index remapping and a further resize', async ({
    page,
  }) => {
    await openStory(
      page,
      'shared-virtualization-virtualcollectioncapability--remap-and-deep-scroll',
    );

    await page.getByTestId('vcc-index-input').fill('5');
    await page.getByTestId('vcc-grow-button').click();

    const itemBeforeReorder = page.getByTestId('vcc-item-5');
    await expect
      .poll(async () => Number(await itemBeforeReorder.getAttribute('data-item-size')))
      .toBeGreaterThan(BASE_ITEM_SIZE_PX);
    const sizeAfterFirstGrow = Number(await itemBeforeReorder.getAttribute('data-item-size'));

    await page.getByTestId('vcc-toggle-reverse').click();

    // Item id 5 is now at index (itemCount - 1 - 5) = 194; bring it back into view through the
    // fixture's own consumer-owned approximate scroll control (the composable exposes no
    // scrollToIndex).
    await page.getByTestId('vcc-scrollto-index-input').fill('194');
    await page.getByTestId('vcc-scrollto-index-button').click();

    const itemAfterReorder = page.getByTestId('vcc-item-5');
    await expect(itemAfterReorder).toBeVisible();
    // Returned { key, index, value } reflects the new index: id 5's key never changes, but its
    // current index and rendered value both follow the reorder.
    await expect(itemAfterReorder).toHaveAttribute('data-item-index', '194');
    await expect(itemAfterReorder.locator('pre')).toContainText('Item 5');
    await expect
      .poll(async () => Number(await itemAfterReorder.getAttribute('data-item-size')))
      .toBeGreaterThanOrEqual(sizeAfterFirstGrow - GEOMETRY_TOLERANCE_PX);

    // Resize the remapped item again: measurement must follow its current index (194), not the
    // stale index (5) it was first measured at.
    await page.getByTestId('vcc-index-input').fill('194');
    await page.getByTestId('vcc-grow-button').click();

    await expect
      .poll(async () => Number(await itemAfterReorder.getAttribute('data-item-size')))
      .toBeGreaterThan(sizeAfterFirstGrow + GEOMETRY_TOLERANCE_PX);
    // Physical DOM must track the same public geometry change, not diverge from it.
    await expect
      .poll(async () => (await itemAfterReorder.boundingBox())?.height ?? 0)
      .toBeGreaterThan(sizeAfterFirstGrow + GEOMETRY_TOLERANCE_PX - 1);
  });

  test('produces materially large leadingSize and correct trailing/total geometry with correct visible logical identity on deep scroll', async ({
    page,
  }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--vertical-scale');

    await page.getByTestId('vcc-scrollto-end-button').click();

    await expect
      .poll(async () => Number(await page.getByTestId('vcc-leading-size').textContent()))
      .toBeGreaterThan(100000);

    const mountedCount = Number(await page.getByTestId('vcc-mounted-count').textContent());
    expect(mountedCount).toBeGreaterThan(0);
    expect(mountedCount).toBeLessThan(50);

    const visibleIndices = await page
      .locator('[data-testid^="vcc-item-"]')
      .evaluateAll((items) => items.map((item) => Number(item.getAttribute('data-item-index'))));
    expect(Math.min(...visibleIndices)).toBeGreaterThan(9900);

    // totalSize reflects real measured heights for previously-mounted items, so it is close to
    // (but not necessarily bit-exact with) the pure itemCount * estimate; the trailing-extent
    // formula below is the actual contract, not a fixed theoretical constant.
    const totalSize = Number(await page.getByTestId('vcc-total-size').textContent());
    expect(totalSize).toBeGreaterThan(VERTICAL_SCALE_ITEM_COUNT * BASE_ITEM_SIZE_PX * 0.95);

    const trailingSize = Number(await page.getByTestId('vcc-trailing-size').textContent());
    const lastItemGeometry = await page
      .locator('[data-testid^="vcc-item-"]')
      .last()
      .evaluate((el) => ({
        offset: Number(el.getAttribute('data-item-offset')),
        size: Number(el.getAttribute('data-item-size')),
      }));

    expect(
      Math.abs(trailingSize - (totalSize - (lastItemGeometry.offset + lastItemGeometry.size))),
    ).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
  });

  test('keeps item offset, leadingSize, trailingSize, and totalSize collection-surface-relative under a non-zero surfaceOffset', async ({
    page,
  }) => {
    // Baseline: the same logical collection with no surfaceOffset, read before any scroll so real
    // measurement drift from the pre-measurement estimate is minimal and comparable between runs.
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--vertical-scale');
    const baselineTotalSize = Number(await page.getByTestId('vcc-total-size').textContent());

    await openStory(page, 'shared-virtualization-virtualcollectioncapability--surface-offset');

    const preSurface = page.getByTestId('vcc-pre-surface');
    await expect(preSurface).toBeVisible();
    const preSurfaceBox = await preSurface.boundingBox();
    expect(Math.abs((preSurfaceBox?.height ?? 0) - SURFACE_OFFSET_PX)).toBeLessThanOrEqual(
      GEOMETRY_TOLERANCE_PX,
    );

    const firstItem = page.getByTestId('vcc-item-0');
    await expect(firstItem).toBeVisible();
    // Public offset is relative to the collection surface: the first item starts at 0 even
    // though it physically begins SURFACE_OFFSET_PX into the scroll root.
    await expect(firstItem).toHaveAttribute('data-item-offset', '0');
    expect(Number(await page.getByTestId('vcc-leading-size').textContent())).toBe(0);

    const viewportBox = await page.getByTestId('vcc-viewport').boundingBox();
    const itemBox = await firstItem.boundingBox();
    const physicalTopWithinViewport = (itemBox?.y ?? 0) - (viewportBox?.y ?? 0);
    // The consumer never manually subtracts the engine scroll margin a second time: physical
    // position is exactly surfaceOffset + item.offset (0) - scrollTop (0).
    expect(Math.abs(physicalTopWithinViewport - SURFACE_OFFSET_PX)).toBeLessThanOrEqual(
      GEOMETRY_TOLERANCE_PX,
    );

    const totalSize = Number(await page.getByTestId('vcc-total-size').textContent());
    // totalSize is the collection's own extent only; it does not include the physical surface
    // offset that precedes it inside the scroll root. Compared against the offset-free baseline
    // with a relative tolerance (not the frame-settling GEOMETRY_TOLERANCE_PX), since the two
    // stories mount a different surrounding DOM structure and real per-item measurement can drift
    // by sub-pixel amounts across thousands of items independently of surfaceOffset.
    expect(Math.abs(totalSize - baselineTotalSize) / baselineTotalSize).toBeLessThan(0.01);

    await page.getByTestId('vcc-scrollto-end-button').click();

    await expect
      .poll(async () => Number(await page.getByTestId('vcc-leading-size').textContent()))
      .toBeGreaterThan(100000);

    const totalSizeAfterScroll = Number(await page.getByTestId('vcc-total-size').textContent());
    const trailingSize = Number(await page.getByTestId('vcc-trailing-size').textContent());
    const lastItemGeometry = await page
      .locator('[data-testid^="vcc-item-"]')
      .last()
      .evaluate((el) => ({
        offset: Number(el.getAttribute('data-item-offset')),
        size: Number(el.getAttribute('data-item-size')),
      }));
    expect(
      Math.abs(
        trailingSize - (totalSizeAfterScroll - (lastItemGeometry.offset + lastItemGeometry.size)),
      ),
    ).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);

    const scrollHeight = await page.getByTestId('vcc-viewport').evaluate((el) => el.scrollHeight);
    expect(Math.abs(scrollHeight - (SURFACE_OFFSET_PX + totalSizeAfterScroll))).toBeLessThanOrEqual(
      STRUCTURAL_TOLERANCE_PX,
    );
  });

  test('accepts a valid undefined source value at an in-bounds index without throwing', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await openStory(
      page,
      'shared-virtualization-virtualcollectioncapability--undefined-source-value',
    );

    const undefinedItem = page.getByTestId('vcc-item-5');
    await expect(undefinedItem).toBeVisible();
    await expect(undefinedItem.locator('pre')).toContainText('Item undefined');

    // Neighboring keys/values keep their own correct identity; the undefined entry does not
    // shift or corrupt surrounding key/value mapping.
    await expect(page.getByTestId('vcc-item-4').locator('pre')).toContainText('Item 4');
    await expect(page.getByTestId('vcc-item-6').locator('pre')).toContainText('Item 6');

    expect(pageErrors).toEqual([]);
  });

  test('cleans up on unmount and behaves correctly after remount', async ({ page }) => {
    // Uncaught exceptions are the relevant signal for stale-observer/cleanup defects; unrelated
    // console.error noise (network resource 404s, etc.) is not part of this contract.
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await openStory(page, 'shared-virtualization-virtualcollectioncapability--mount-cycle');

    await expect(page.getByTestId('vcc-mounted-count')).toBeVisible();

    const toggle = page.getByTestId('mount-cycle-toggle');
    await toggle.click();
    await expect(page.getByTestId('vcc-mounted-count')).toHaveCount(0);

    await toggle.click();
    await expect(page.getByTestId('vcc-mounted-count')).toBeVisible();
    await expect(page.getByTestId('vcc-item-0')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
