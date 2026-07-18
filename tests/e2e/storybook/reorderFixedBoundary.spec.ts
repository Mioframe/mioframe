import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderfixedboundarystoryharness--default';

// Samples an element's `scrollTop` across consecutive rendered animation frames, matching the
// convention in `reorderSelfScrollableContainer.spec.ts`.
const sampleScrollTop = async (scrollable: Locator, frameCount = 10): Promise<number[]> =>
  scrollable.evaluate(async (el, count) => {
    const samples: number[] = [];
    for (let frame = 0; frame < count; frame += 1) {
      // eslint-disable-next-line no-await-in-loop -- each sample must follow exactly one rendered frame
      await new Promise((resolve) => requestAnimationFrame(resolve));
      samples.push(el.scrollTop);
    }
    return samples;
  }, frameCount);

test.describe('fixed-position reorder surface under a transformed ancestor', () => {
  test('dragging near the visible edge scrolls the transformed ancestor, not just the fixed surface', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, STORY_ID);

    const ancestor = page.getByRole('region', { name: 'Reorder scroll ancestor' });
    const firstItem = page.getByRole('listitem', { name: 'row-0', exact: true });
    const lastItem = page.getByRole('listitem', { name: 'row-9', exact: true });

    // Precondition: the ancestor has real, independent scroll room, and the fixed surface's
    // containing block really is the transformed ancestor (an `offsetParent` other than `null`),
    // not the viewport — or this would not exercise the transformed-containing-block scenario at
    // all.
    const ancestorExtent = await ancestor.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(ancestorExtent).toBeGreaterThan(0);
    const fixedSurfaceOffsetParent = await page
      .locator('.reorder-fixed-boundary-story-harness__fixed-surface')
      .evaluate(
        (el) =>
          el instanceof HTMLElement &&
          el.offsetParent === el.closest('.reorder-fixed-boundary-story-harness__ancestor'),
      );
    expect(fixedSurfaceOffsetParent).toBe(true);

    // Precondition: the last row starts scrolled out of the ancestor's own viewport entirely.
    await expect(lastItem).not.toBeInViewport();

    const itemBox = await firstItem.boundingBox();
    const ancestorBox = await ancestor.boundingBox();
    if (!itemBox || !ancestorBox) {
      throw new Error('missing bounding box for item or ancestor');
    }

    const centerX = itemBox.x + itemBox.width / 2;
    const ancestorScrollTopStart = await ancestor.evaluate((el) => el.scrollTop);

    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance before probing autoscroll.
    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2 + 8, { steps: 4 });

    // Hold near the ancestor's own visible bottom edge.
    await page.mouse.move(centerX, ancestorBox.y + ancestorBox.height - 2, { steps: 4 });

    await expect
      .poll(() => ancestor.evaluate((el) => el.scrollTop), { timeout: 10000 })
      .toBeGreaterThan(ancestorScrollTopStart + 50);

    // Scrolling the transformed ancestor reveals content that was previously entirely out of
    // view, proving the ancestor genuinely participates rather than the pointer merely resting
    // over it.
    await expect(lastItem).toBeInViewport();

    await page.mouse.up();

    // Releasing the pointer stops the ancestor from drifting further.
    const scrollTopAtRelease = await ancestor.evaluate((el) => el.scrollTop);
    const releaseSamples = await sampleScrollTop(ancestor);
    for (const sample of releaseSamples) {
      expect(Math.abs(sample - scrollTopAtRelease)).toBeLessThanOrEqual(1);
    }
  });
});
