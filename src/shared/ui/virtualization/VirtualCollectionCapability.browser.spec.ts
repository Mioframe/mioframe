import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

// TanStack measurement/scroll settling can take a couple of frames; assertions poll for the
// observable outcome instead of sleeping.
const GEOMETRY_TOLERANCE_PX = 4;

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

  test('measures dynamic vertical item growth and shrink', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--vertical-scale');

    const item = page.getByTestId('vcc-item-1');
    const initialBox = await item.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.getByTestId('vcc-index-input').fill('1');
    await page.getByTestId('vcc-grow-button').click();

    await expect
      .poll(async () => (await item.boundingBox())?.height ?? 0)
      .toBeGreaterThan((initialBox?.height ?? 0) + GEOMETRY_TOLERANCE_PX);

    const grownBox = await item.boundingBox();

    await page.getByTestId('vcc-shrink-button').click();

    await expect
      .poll(async () => (await item.boundingBox())?.height ?? 0)
      .toBeLessThan((grownBox?.height ?? 0) - GEOMETRY_TOLERANCE_PX);
  });

  test('measures dynamic horizontal item growth', async ({ page }) => {
    await openStory(page, 'shared-virtualization-virtualcollectioncapability--horizontal-scale');

    const item = page.getByTestId('vcc-item-1');
    const initialBox = await item.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.getByTestId('vcc-index-input').fill('1');
    await page.getByTestId('vcc-grow-button').click();

    await expect
      .poll(async () => (await item.boundingBox())?.width ?? 0)
      .toBeGreaterThan((initialBox?.width ?? 0) + GEOMETRY_TOLERANCE_PX);
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
      .poll(async () => (await itemBeforeReorder.boundingBox())?.height ?? 0)
      .toBeGreaterThan(40);
    const heightAfterFirstGrow = (await itemBeforeReorder.boundingBox())?.height ?? 0;

    await page.getByTestId('vcc-toggle-reverse').click();

    // Item id 5 is now at index (itemCount - 1 - 5) = 194; bring it back into view through the
    // fixture's own consumer-owned approximate scroll control (the composable exposes no
    // scrollToIndex).
    await page.getByTestId('vcc-scrollto-index-input').fill('194');
    await page.getByTestId('vcc-scrollto-index-button').click();

    const itemAfterReorder = page.getByTestId('vcc-item-5');
    await expect(itemAfterReorder).toBeVisible();
    await expect(itemAfterReorder).toHaveAttribute('data-item-index', '194');
    await expect
      .poll(async () => (await itemAfterReorder.boundingBox())?.height ?? 0)
      .toBeGreaterThanOrEqual(heightAfterFirstGrow - GEOMETRY_TOLERANCE_PX);

    // Resize the remapped item again: measurement must follow its current index (194), not the
    // stale index (5) it was first measured at.
    await page.getByTestId('vcc-index-input').fill('194');
    await page.getByTestId('vcc-grow-button').click();

    await expect
      .poll(async () => (await itemAfterReorder.boundingBox())?.height ?? 0)
      .toBeGreaterThan(heightAfterFirstGrow + GEOMETRY_TOLERANCE_PX);
  });

  test('produces materially large leadingSize and correct visible logical identity on deep scroll', async ({
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
