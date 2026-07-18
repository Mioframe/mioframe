import { expect, test, type Locator } from '@playwright/test';
import { z } from 'zod';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderselfscrollablestoryharness--default';
const CLIPPED_STORY_ID =
  'shared-lib-reorder-reorderselfscrollablestoryharness--clipped-by-ancestor';
const ACTIVATION_STORY_ID = 'shared-lib-reorder-reorderactivationstoryharness--default';

// Browser-reported scrollTop/scrollHeight/clientHeight are rounded layout values, so the inner
// container's native scroll limit can be off by up to one CSS pixel from independent measurements.
const SCROLL_LIMIT_TOLERANCE_PX = 1;

const lifecycleSamplesSchema = z.array(
  z.object({
    inner: z.number(),
    outer: z.number(),
    top: z.number(),
    bottom: z.number(),
  }),
);

// Samples a scrollable element's `scrollTop` across consecutive rendered animation frames, so a
// value that moves during the sampled window (not just at its tail) is caught rather than missed.
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

  test('a clipped surface is revealed before its inner content scrolls and never falls back at the inner limit', async ({
    page,
  }) => {
    test.slow();
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
      const pointerY = visibleBottom + 2;
      return {
        fullTop: full.top,
        fullBottom: full.bottom,
        visibleTop,
        visibleBottom,
        pointerY,
        oldForwardZoneStart: full.bottom - full.height * 0.2,
        ancestorVisibleBottom: Math.min(ancestorRect.bottom, window.innerHeight),
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
    const innerLimit = await container.evaluate((el, scrollLimitTolerancePx) => {
      const outer = el.parentElement;
      if (!outer) throw new Error('missing scroll ancestor');
      const nativeLimit = el.scrollHeight - el.clientHeight;
      const recorded: Array<{
        inner: number;
        outer: number;
        top: number;
        bottom: number;
      }> = [];
      let frame = 0;
      let framesAtLimit = 0;
      const sample = () => {
        const rect = el.getBoundingClientRect();
        recorded.push({
          inner: el.scrollTop,
          outer: outer.scrollTop,
          top: rect.top,
          bottom: rect.bottom,
        });
        framesAtLimit =
          Math.abs(el.scrollTop - nativeLimit) <= scrollLimitTolerancePx ? framesAtLimit + 1 : 0;
        frame += 1;
        if (frame < 300 && framesAtLimit < 12) {
          requestAnimationFrame(sample);
        } else {
          el.setAttribute('data-autoscroll-lifecycle-samples', JSON.stringify(recorded));
        }
      };
      requestAnimationFrame(sample);
      return nativeLimit;
    }, SCROLL_LIMIT_TOLERANCE_PX);
    await page.mouse.move(pointerX, itemBox.y + itemBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(pointerX, itemBox.y + itemBox.height / 2 + 8, { steps: 4 });
    await page.mouse.move(pointerX, geometry.pointerY);

    await assertSuppressedDuringDrag(container);
    await assertSuppressedDuringDrag(ancestor);
    await expect
      .poll(() => container.getAttribute('data-autoscroll-lifecycle-samples'), { timeout: 15000 })
      .not.toBeNull();
    const serializedSamples = await container.getAttribute('data-autoscroll-lifecycle-samples');
    const samples = lifecycleSamplesSchema.parse(JSON.parse(serializedSamples ?? '[]'));

    const revealIndex = samples.findIndex(
      (sample) => sample.bottom <= geometry.ancestorVisibleBottom + 1,
    );
    expect(revealIndex, JSON.stringify(samples)).toBeGreaterThan(0);
    const revealSamples = samples.slice(0, revealIndex + 1);
    expect(revealSamples.at(-1)?.outer).toBeGreaterThan(revealSamples[0]?.outer ?? 0);
    expect(Math.max(...revealSamples.map((sample) => sample.inner))).toBeLessThanOrEqual(1);

    const stableSamples = samples.slice(revealIndex);
    const outerAtReveal = stableSamples[0]?.outer ?? 0;
    const bottomAtReveal = stableSamples[0]?.bottom ?? 0;
    expect(stableSamples.some((sample) => sample.inner > 1)).toBe(true);
    const lastStableSample = stableSamples.at(-1);
    if (!lastStableSample) throw new Error('missing last stable sample');
    expect(Math.abs(lastStableSample.inner - innerLimit)).toBeLessThanOrEqual(
      SCROLL_LIMIT_TOLERANCE_PX,
    );
    for (const sample of stableSamples) {
      expect(sample.outer).toBe(outerAtReveal);
      expect(Math.abs(sample.bottom - bottomAtReveal)).toBeLessThanOrEqual(1);
    }

    const holdSamples = samples.slice(-10);
    expect(holdSamples).toHaveLength(10);
    for (const sample of holdSamples) {
      expect(Math.abs(sample.inner - innerLimit)).toBeLessThanOrEqual(SCROLL_LIMIT_TOLERANCE_PX);
      expect(sample.outer).toBe(outerAtReveal);
      expect(Math.abs(sample.bottom - bottomAtReveal)).toBeLessThanOrEqual(1);
      expect(Math.abs(sample.bottom - geometry.pointerY)).toBeLessThan(5);
    }
    const holdInnerValues = holdSamples.map((sample) => sample.inner);
    expect(Math.max(...holdInnerValues) - Math.min(...holdInnerValues)).toBeLessThanOrEqual(
      SCROLL_LIMIT_TOLERANCE_PX,
    );

    await page.mouse.up();
    const containerAtRelease = await container.evaluate((el) => el.scrollTop);
    const ancestorAtRelease = await ancestor.evaluate((el) => el.scrollTop);
    await expect
      .poll(() => container.evaluate((el) => el.style.getPropertyValue('scroll-snap-type')))
      .toBe(containerSnapshot.inlineValue);
    await expect
      .poll(() => ancestor.evaluate((el) => el.style.getPropertyValue('scroll-snap-type')))
      .toBe(ancestorSnapshot.inlineValue);
    assertScrollTopHoldsAtBaseline(await sampleScrollTop(container), containerAtRelease);
    assertScrollTopHoldsAtBaseline(await sampleScrollTop(ancestor), ancestorAtRelease);
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
    const holdSamples = await sampleScrollTop(ancestor);
    assertScrollTopHoldsAtBaseline(holdSamples, ancestorScrollTopStart);
    expect(
      await container.evaluate((el) =>
        Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)),
      ),
    ).toBeLessThanOrEqual(1);

    // Reverse direction: hold near the container's own upper visible edge.
    await page.mouse.move(centerX, containerBox.y + 2, { steps: 4 });

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeLessThan(containerScrollTopAtLowerLimit);
    expect(await ancestor.evaluate((el) => el.scrollTop)).toBe(ancestorScrollTopStart);

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 10000 })
      .toBeLessThanOrEqual(1);

    const upperHoldSamples = await sampleScrollTop(ancestor);
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

    const containerReleaseSamples = await sampleScrollTop(container);
    assertScrollTopHoldsAtBaseline(containerReleaseSamples, containerScrollTopBeforeRelease);

    const ancestorReleaseSamples = await sampleScrollTop(ancestor);
    assertScrollTopHoldsAtBaseline(ancestorReleaseSamples, ancestorScrollTopBeforeRelease);
  });
});
