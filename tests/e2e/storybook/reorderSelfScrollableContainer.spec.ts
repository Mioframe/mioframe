import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderselfscrollablestoryharness--default';

// Samples a scrollable element's `scrollTop` across consecutive rendered animation frames, so a
// value that moves during the sampled window (not just at its tail) is caught rather than missed.
const sampleScrollTop = async (
  page: Page,
  scrollable: Locator,
  frameCount = 10,
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
    expect(sample, `scrollTop samples: ${samples.join(', ')}, baseline: ${baseline}`).toBe(
      baseline,
    );
  }
};

test.describe('self-scrollable reorder container', () => {
  test('a drag drains the container own scroll extent in both directions without ever moving the outer ancestor', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, STORY_ID);

    const container = page.getByRole('list', { name: 'Self-scrollable reorder items' });
    const ancestor = page.getByRole('region', { name: 'Reorder scroll ancestor' });
    const firstItem = page.getByRole('listitem', { name: 'row-0', exact: true });

    // Preconditions: the container and its outer ancestor must each have real, independent scroll
    // room, or this would not actually exercise the self-scrollable-container scenario.
    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    const ancestorExtent = await ancestor.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(containerExtent).toBeGreaterThan(0);
    expect(ancestorExtent).toBeGreaterThan(0);

    const containerBox = await container.boundingBox();
    const itemBox = await firstItem.boundingBox();
    if (!containerBox || !itemBox) {
      throw new Error('missing bounding box for container or item');
    }

    const centerX = itemBox.x + itemBox.width / 2;
    const ancestorScrollTopStart = await ancestor.evaluate((el) => el.scrollTop);

    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance before probing autoscroll.
    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2 + 8, { steps: 4 });

    // Hold near the container's own lower visible edge.
    await page.mouse.move(centerX, containerBox.y + containerBox.height - 2, { steps: 4 });

    const containerScrollTopBeforeDown = await container.evaluate((el) => el.scrollTop);
    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(containerScrollTopBeforeDown);

    await expect(firstItem).toHaveClass(/reorder-self-scrollable-story-item_dragging/);
    expect(await ancestor.evaluate((el) => el.scrollTop)).toBe(ancestorScrollTopStart);

    // The container reaches its own native lower scroll limit while the pointer stays put.
    await expect
      .poll(
        () =>
          container.evaluate((el) => Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight))),
        { timeout: 10000 },
      )
      .toBeLessThanOrEqual(1);
    const containerScrollTopAtLowerLimit = await container.evaluate((el) => el.scrollTop);

    // Continued holding at the same edge moves neither the container past its limit nor the
    // ancestor at all: sample several frames and assert both stay put.
    const holdSamples = await sampleScrollTop(page, ancestor);
    assertScrollTopHoldsAtBaseline(holdSamples, ancestorScrollTopStart);
    expect(await container.evaluate((el) => el.scrollTop)).toBe(containerScrollTopAtLowerLimit);

    // Reverse direction: hold near the container's own upper visible edge.
    await page.mouse.move(centerX, containerBox.y + 2, { steps: 4 });

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeLessThan(containerScrollTopAtLowerLimit);
    expect(await ancestor.evaluate((el) => el.scrollTop)).toBe(ancestorScrollTopStart);

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 10000 })
      .toBeLessThanOrEqual(1);

    const upperHoldSamples = await sampleScrollTop(page, ancestor);
    assertScrollTopHoldsAtBaseline(upperHoldSamples, ancestorScrollTopStart);

    await page.mouse.up();
  });
});
