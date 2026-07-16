import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderselfscrollablestoryharness--default';
const CLIPPED_STORY_ID =
  'shared-lib-reorder-reorderselfscrollablestoryharness--clipped-by-ancestor';
const ACTIVATION_STORY_ID = 'shared-lib-reorder-reorderactivationstoryharness--default';

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

interface ScrollSnapSnapshot {
  readonly inlineValue: string;
  readonly inlinePriority: string;
  readonly computedScrollSnapType: string;
  readonly computedScrollBehavior: string;
}

const captureScrollSnapSnapshot = (scrollable: Locator): Promise<ScrollSnapSnapshot> =>
  scrollable.evaluate((el) => {
    const styles = getComputedStyle(el);
    return {
      inlineValue: el.style.getPropertyValue('scroll-snap-type'),
      inlinePriority: el.style.getPropertyPriority('scroll-snap-type'),
      computedScrollSnapType: styles.scrollSnapType,
      computedScrollBehavior: styles.scrollBehavior,
    };
  });

const assertSuppressedDuringDrag = async (scrollable: Locator): Promise<void> => {
  expect(await scrollable.evaluate((el) => el.style.getPropertyValue('scroll-snap-type'))).toBe(
    'none',
  );
  expect(await scrollable.evaluate((el) => el.style.getPropertyPriority('scroll-snap-type'))).toBe(
    '',
  );
};

test.describe('self-scrollable reorder container', () => {
  test('a duplicate controlled list cancels pointer activation and recovers without remounting', async ({
    page,
  }) => {
    await openStory(page, ACTIVATION_STORY_ID);

    const list = page.getByRole('list', { name: 'Activation test reorder items' });
    const reorderCount = page.getByLabel('Reorder count');

    await page.getByRole('button', { name: 'Use duplicate IDs' }).click();
    const duplicateFirstItem = page.getByRole('listitem', { name: 'alpha', exact: true }).first();
    const duplicateFirstBox = await duplicateFirstItem.boundingBox();
    if (!duplicateFirstBox) {
      throw new Error('missing duplicate item bounding box');
    }

    await page.mouse.move(
      duplicateFirstBox.x + duplicateFirstBox.width / 2,
      duplicateFirstBox.y + duplicateFirstBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      duplicateFirstBox.x + duplicateFirstBox.width / 2,
      duplicateFirstBox.y + duplicateFirstBox.height * 2.5,
      { steps: 6 },
    );

    await expect(duplicateFirstItem).not.toHaveClass(/_dragging/);
    await expect(duplicateFirstItem).not.toHaveCSS('transform', /matrix|translate/);
    await expect(reorderCount).toHaveText('0');
    await page.mouse.up();
    await expect(reorderCount).toHaveText('0');

    await page.getByRole('button', { name: 'Restore unique IDs' }).click();
    const firstItem = page.getByRole('listitem', { name: 'alpha', exact: true });
    const lastItem = page.getByRole('listitem', { name: 'charlie', exact: true });
    const firstBox = await firstItem.boundingBox();
    const lastBox = await lastItem.boundingBox();
    if (!firstBox || !lastBox) {
      throw new Error('missing restored item bounding box');
    }

    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2 + 8, {
      steps: 4,
    });
    await expect(firstItem).toHaveClass(/_dragging/);
    const listBox = await list.boundingBox();
    if (!listBox) {
      throw new Error('missing activation list bounding box');
    }
    await page.mouse.move(lastBox.x + lastBox.width / 2, listBox.y + listBox.height - 2, {
      steps: 8,
    });
    await page.mouse.up();

    await expect(reorderCount).toHaveText('1');
    await expect(list.getByRole('listitem')).toHaveText(['bravo', 'charlie', 'alpha']);
  });

  test('a pointer at the clipped visible edge autoscrolls the inner container only and cleanup stops it', async ({
    page,
  }) => {
    await openStory(page, CLIPPED_STORY_ID);

    const container = page.getByRole('list', { name: 'Self-scrollable reorder items' });
    const ancestor = page.getByRole('region', { name: 'Reorder scroll ancestor' });
    const firstItem = page.getByRole('listitem', { name: 'row-0', exact: true });
    const containerSnapshot = await captureScrollSnapSnapshot(container);
    const ancestorSnapshot = await captureScrollSnapSnapshot(ancestor);
    const geometry = await container.evaluate((el) => {
      const full = el.getBoundingClientRect();
      const ancestorRect = el.parentElement?.getBoundingClientRect();
      if (!ancestorRect) throw new Error('missing scroll ancestor');
      const visibleBottom = Math.min(full.bottom, ancestorRect.bottom, window.innerHeight);
      const visibleTop = Math.max(full.top, ancestorRect.top, 0);
      const pointerY = visibleBottom - 2;
      return {
        fullTop: full.top,
        fullBottom: full.bottom,
        visibleTop,
        visibleBottom,
        pointerY,
        oldForwardZoneStart: full.bottom - full.height * 0.2,
      };
    });

    expect(geometry.visibleBottom - geometry.visibleTop).toBeGreaterThan(0);
    expect(geometry.visibleBottom - geometry.visibleTop).toBeLessThan(
      (geometry.fullBottom - geometry.fullTop) * 0.5,
    );
    expect(geometry.pointerY).toBeLessThan(geometry.oldForwardZoneStart);

    const itemBox = await firstItem.boundingBox();
    if (!itemBox) throw new Error('missing first item bounding box');
    const pointerX = itemBox.x + itemBox.width / 2;
    await page.mouse.move(pointerX, itemBox.y + itemBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(pointerX, itemBox.y + itemBox.height / 2 + 8, { steps: 4 });
    await page.mouse.move(pointerX, geometry.pointerY, { steps: 4 });

    await assertSuppressedDuringDrag(container);
    await assertSuppressedDuringDrag(ancestor);
    const ancestorStart = await ancestor.evaluate((el) => el.scrollTop);

    // Observe the first rendered autoscroll frame while the inner candidate still has ample
    // remaining extent. Waiting for it to drain would legitimately hand the axis to the ancestor.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(await container.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await container.evaluate((el) => el.scrollTop)).toBeLessThan(
      await container.evaluate((el) => el.scrollHeight - el.clientHeight),
    );
    expect(await ancestor.evaluate((el) => el.scrollTop)).toBe(ancestorStart);

    await page.mouse.up();
    const containerAtRelease = await container.evaluate((el) => el.scrollTop);
    await expect
      .poll(() => container.evaluate((el) => el.style.getPropertyValue('scroll-snap-type')))
      .toBe(containerSnapshot.inlineValue);
    await expect
      .poll(() => ancestor.evaluate((el) => el.style.getPropertyValue('scroll-snap-type')))
      .toBe(ancestorSnapshot.inlineValue);
    assertScrollTopHoldsAtBaseline(await sampleScrollTop(page, container), containerAtRelease);
    expect(await ancestor.evaluate((el) => el.scrollTop)).toBe(ancestorStart);
  });

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

    // Preconditions: both elements carry the smooth-scroll and real scroll-snap styles this
    // scenario exercises, neither has an inline scroll-snap override applied yet, and the inner
    // items create real snap positions inside the container.
    const containerSnapshotBeforeDrag = await captureScrollSnapSnapshot(container);
    const ancestorSnapshotBeforeDrag = await captureScrollSnapSnapshot(ancestor);
    expect(containerSnapshotBeforeDrag.computedScrollBehavior).toBe('smooth');
    expect(containerSnapshotBeforeDrag.computedScrollSnapType).not.toBe('none');
    expect(containerSnapshotBeforeDrag.inlineValue).toBe('');
    expect(containerSnapshotBeforeDrag.inlinePriority).toBe('');
    expect(ancestorSnapshotBeforeDrag.computedScrollBehavior).toBe('smooth');
    expect(ancestorSnapshotBeforeDrag.computedScrollSnapType).not.toBe('none');
    expect(ancestorSnapshotBeforeDrag.inlineValue).toBe('');
    expect(ancestorSnapshotBeforeDrag.inlinePriority).toBe('');
    expect(await firstItem.evaluate((el) => getComputedStyle(el).scrollSnapAlign)).toBe('start');

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

    // During the drag, both candidates' inline scroll-snap-type is temporarily suppressed (with no
    // priority, i.e. no `!important`) so scroll snap cannot redirect the deterministic autoscroll
    // deltas on either the container or its outer scrollable ancestor.
    await assertSuppressedDuringDrag(container);
    await assertSuppressedDuringDrag(ancestor);

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

    // Suppression is still in effect for both candidates right up to release.
    await assertSuppressedDuringDrag(container);
    await assertSuppressedDuringDrag(ancestor);

    const containerScrollTopBeforeRelease = await container.evaluate((el) => el.scrollTop);
    const ancestorScrollTopBeforeRelease = await ancestor.evaluate((el) => el.scrollTop);

    await page.mouse.up();

    // After release, the temporary inline snap override is gone on both candidates, the original
    // computed styles are restored, and neither candidate is allowed to move away from the exact
    // position captured immediately before release. Cleanup runs once the drag-end status change
    // flushes, so poll only for style restoration, never for a new settled scroll position.
    await expect
      .poll(() => container.evaluate((el) => el.style.getPropertyValue('scroll-snap-type')))
      .toBe('');
    await expect
      .poll(() => ancestor.evaluate((el) => el.style.getPropertyValue('scroll-snap-type')))
      .toBe('');

    expect(await container.evaluate((el) => el.scrollTop)).toBe(containerScrollTopBeforeRelease);
    expect(await ancestor.evaluate((el) => el.scrollTop)).toBe(ancestorScrollTopBeforeRelease);

    const containerSnapshotAfterDrag = await captureScrollSnapSnapshot(container);
    expect(containerSnapshotAfterDrag.inlineValue).toBe(containerSnapshotBeforeDrag.inlineValue);
    expect(containerSnapshotAfterDrag.inlinePriority).toBe(
      containerSnapshotBeforeDrag.inlinePriority,
    );
    expect(containerSnapshotAfterDrag.computedScrollSnapType).toBe(
      containerSnapshotBeforeDrag.computedScrollSnapType,
    );
    expect(containerSnapshotAfterDrag.computedScrollBehavior).toBe('smooth');

    const ancestorSnapshotAfterDrag = await captureScrollSnapSnapshot(ancestor);
    expect(ancestorSnapshotAfterDrag.inlineValue).toBe(ancestorSnapshotBeforeDrag.inlineValue);
    expect(ancestorSnapshotAfterDrag.inlinePriority).toBe(
      ancestorSnapshotBeforeDrag.inlinePriority,
    );
    expect(ancestorSnapshotAfterDrag.computedScrollSnapType).toBe(
      ancestorSnapshotBeforeDrag.computedScrollSnapType,
    );
    expect(ancestorSnapshotAfterDrag.computedScrollBehavior).toBe('smooth');

    const containerReleaseSamples = await sampleScrollTop(page, container);
    assertScrollTopHoldsAtBaseline(containerReleaseSamples, containerScrollTopBeforeRelease);

    const ancestorReleaseSamples = await sampleScrollTop(page, ancestor);
    assertScrollTopHoldsAtBaseline(ancestorReleaseSamples, ancestorScrollTopBeforeRelease);
  });
});
