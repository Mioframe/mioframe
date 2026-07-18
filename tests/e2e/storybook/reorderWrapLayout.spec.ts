import { expect, test, type Page } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderwrapstoryharness--default';

/**
 * Asserts the wrap harness actually renders across more than one row before a test relies on
 * cross-row movement, and returns the shared locators/boxes the drag steps need.
 * @param page - The Playwright page already navigated to the story.
 * @returns The container locator and the `wrap-item-0`/`wrap-item-5` locators and boxes.
 */
const getWrapFixture = async (page: Page) => {
  const container = page.getByRole('list', { name: 'Wrapping reorder items' });
  const firstRowItem = page.getByRole('listitem', { name: 'wrap-item-0', exact: true });
  const secondRowItem = page.getByRole('listitem', { name: 'wrap-item-5', exact: true });

  const firstRowBox = await firstRowItem.boundingBox();
  const secondRowBox = await secondRowItem.boundingBox();
  if (!firstRowBox || !secondRowBox) {
    throw new Error('missing bounding box for wrap item');
  }
  expect(secondRowBox.y).toBeGreaterThan(firstRowBox.y);

  return { container, firstRowItem, secondRowItem, firstRowBox, secondRowBox };
};

test.describe('wrapping/grid reorder layout', () => {
  test('moves an item forward across rows and keeps the dragged item bounded by the direct parent container', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const { container, firstRowItem, firstRowBox, secondRowBox } = await getWrapFixture(page);
    const containerBox = await container.boundingBox();
    if (!containerBox) {
      throw new Error('missing bounding box for container');
    }

    await page.mouse.move(
      firstRowBox.x + firstRowBox.width / 2,
      firstRowBox.y + firstRowBox.height / 2,
    );
    await page.mouse.down();
    // Cross the mouse activation distance before probing bounds.
    await page.mouse.move(
      firstRowBox.x + firstRowBox.width / 2,
      firstRowBox.y + firstRowBox.height / 2 + 8,
      { steps: 4 },
    );
    await expect(firstRowItem).toHaveClass(/reorder-wrap-story-item_dragging/);

    // Hold well beyond the container's own edge: the dragged item's box must still be clamped to
    // the direct parent container, regardless of the wrapping layout direction.
    await page.mouse.move(containerBox.x + containerBox.width + 200, firstRowBox.y, { steps: 8 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    const clampedBox = await firstRowItem.boundingBox();
    const liveContainerBox = await container.boundingBox();
    if (!clampedBox || !liveContainerBox) {
      throw new Error('missing live bounding box for item or container');
    }
    expect(clampedBox.x + clampedBox.width).toBeLessThanOrEqual(
      liveContainerBox.x + liveContainerBox.width + 1,
    );

    await page.mouse.move(
      secondRowBox.x + secondRowBox.width / 2,
      secondRowBox.y + secondRowBox.height / 2,
      { steps: 12 },
    );
    await page.mouse.up();

    const rowsAfterDrag = await container.locator(':scope > *').allTextContents();
    expect(rowsAfterDrag.indexOf('wrap-item-0')).toBeGreaterThan(
      rowsAfterDrag.indexOf('wrap-item-5'),
    );
  });

  test('moves an item backward across rows, from a fresh initial layout', async ({ page }) => {
    await openStory(page, STORY_ID);

    const { container, secondRowItem, firstRowBox, secondRowBox } = await getWrapFixture(page);

    await page.mouse.move(
      secondRowBox.x + secondRowBox.width / 2,
      secondRowBox.y + secondRowBox.height / 2,
    );
    await page.mouse.down();
    // Cross the mouse activation distance before continuing the drag.
    await page.mouse.move(
      secondRowBox.x + secondRowBox.width / 2,
      secondRowBox.y + secondRowBox.height / 2 - 8,
      { steps: 4 },
    );
    await expect(secondRowItem).toHaveClass(/reorder-wrap-story-item_dragging/);

    await page.mouse.move(
      firstRowBox.x + firstRowBox.width / 2,
      firstRowBox.y + firstRowBox.height / 2,
      { steps: 12 },
    );
    await page.mouse.up();

    const rowsAfterDrag = await container.locator(':scope > *').allTextContents();
    expect(rowsAfterDrag.indexOf('wrap-item-5')).toBeLessThan(rowsAfterDrag.indexOf('wrap-item-0'));
  });
});
