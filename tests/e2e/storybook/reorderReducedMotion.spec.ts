import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderselfscrollablestoryharness--default';

// Samples across several rendered frames, matching the convention in the reorder autoscroll
// specs, so a transient animation is caught rather than missed by a single-instant check.
const hasDisplacementTransformAnimation = async (
  element: Locator,
  frameCount = 10,
): Promise<boolean> =>
  element.evaluate(async (el, count) => {
    const isCssTransition = (animation: Animation): animation is CSSTransition =>
      'transitionProperty' in animation;

    for (let frame = 0; frame < count; frame += 1) {
      const hasMatch = el
        .getAnimations()
        .some(
          (animation) =>
            isCssTransition(animation) &&
            ['transform', 'translate', 'scale'].includes(animation.transitionProperty),
        );
      if (hasMatch) {
        return true;
      }
      // eslint-disable-next-line no-await-in-loop -- each sample must follow exactly one rendered frame
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return false;
  }, frameCount);

test.describe('reorder displacement transition under prefers-reduced-motion: reduce', () => {
  test('a displaced item receives no transform animation, and the drag still completes', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, STORY_ID);

    const list = page.getByRole('list', { name: 'Self-scrollable reorder items' });
    const draggedItem = page.getByRole('listitem', { name: 'row-0', exact: true });
    const displacedItem = page.getByRole('listitem', { name: 'row-1', exact: true });

    const draggedBox = await draggedItem.boundingBox();
    const displacedBox = await displacedItem.boundingBox();
    if (!draggedBox || !displacedBox) {
      throw new Error('missing bounding box for dragged or displaced item');
    }

    const centerX = draggedBox.x + draggedBox.width / 2;

    await page.mouse.move(centerX, draggedBox.y + draggedBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance, then move past the second row so it must displace.
    await page.mouse.move(centerX, draggedBox.y + draggedBox.height / 2 + 8, { steps: 4 });
    await page.mouse.move(centerX, displacedBox.y + displacedBox.height + 4, { steps: 8 });

    // The displaced row must not receive a `transform`/`translate`/`scale` animation — the one
    // dnd-kit would otherwise cancel-and-replace per frame (see `Sortable.animate()`), which
    // `transition: null` skips outright — while direct pointer tracking keeps working.
    expect(await hasDisplacementTransformAnimation(displacedItem)).toBe(false);

    await page.mouse.up();

    // The reorder itself still completes correctly under reduced motion.
    await expect(list.getByRole('listitem').first()).toHaveText('row-1');
  });
});
