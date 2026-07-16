import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderdocumentviewportstoryharness--default';

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
    expect(
      Math.abs(sample - baseline),
      `scrollTop samples: ${samples.join(', ')}, baseline: ${baseline}`,
    ).toBeLessThanOrEqual(1);
  }
};

// Waits for a scrollable element's `scrollTop` to hold steady across several consecutive polls,
// not just one, before treating it as settled.
const waitForStableScrollTop = async (
  scrollable: Locator,
  requiredStableReads = 3,
): Promise<number> => {
  let previous = await scrollable.evaluate((el) => el.scrollTop);
  let stableCount = 1;
  await expect
    .poll(
      async () => {
        const current = await scrollable.evaluate((el) => el.scrollTop);
        stableCount = current === previous ? stableCount + 1 : 1;
        previous = current;
        return stableCount >= requiredStableReads;
      },
      { timeout: 10000, intervals: [200] },
    )
    .toBe(true);
  return previous;
};

test.describe('document viewport autoscroll fallback', () => {
  test('a drag drains the container, then its ancestor, then the real document viewport, and release stops all three', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, STORY_ID);

    const container = page.getByRole('list', { name: 'Document viewport reorder items' });
    const ancestor = page.getByRole('region', { name: 'Reorder scroll ancestor' });
    // This app's global layout pins `html` to exactly one viewport tall with its own
    // `overflow: auto`, so `body` (not `document.scrollingElement`) is the element that actually
    // scrolls for page-level content — it is the real, observable "document viewport" here.
    const documentViewport = page.locator('body');
    const firstItem = page.getByRole('listitem', { name: 'row-0', exact: true });

    // Preconditions: all three levels have real, independent scroll room, or this would not
    // actually exercise the document-viewport fallback scenario.
    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    const ancestorExtent = await ancestor.evaluate((el) => el.scrollHeight - el.clientHeight);
    const documentExtent = await documentViewport.evaluate(
      (el) => el.scrollHeight - el.clientHeight,
    );
    expect(containerExtent).toBeGreaterThan(0);
    expect(ancestorExtent).toBeGreaterThan(0);
    expect(documentExtent).toBeGreaterThan(0);

    const itemBox = await firstItem.boundingBox();
    const viewportSize = page.viewportSize();
    if (!itemBox || !viewportSize) {
      throw new Error('missing bounding box for item or viewport size');
    }

    const centerX = itemBox.x + itemBox.width / 2;
    const documentScrollTopStart = await documentViewport.evaluate((el) => el.scrollTop);
    const ancestorScrollTopStart = await ancestor.evaluate((el) => el.scrollTop);

    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance before probing autoscroll.
    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2 + 8, { steps: 4 });

    // Hold near the real viewport's own bottom edge: the fixture is sized so this is also near
    // the container's and the ancestor's own lower visible edge.
    await page.mouse.move(centerX, viewportSize.height - 2, { steps: 4 });

    // 1. The inner reorder container scrolls first...
    const containerScrollTopBeforeDown = await container.evaluate((el) => el.scrollTop);
    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(containerScrollTopBeforeDown);

    // 2. ...and reaches its own native limit. The container is the nearest candidate and is
    // always resolved before any farther candidate within the same animation frame, so this
    // never leaves it short of its own true native limit.
    await expect
      .poll(
        () =>
          container.evaluate((el) => Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight))),
        { timeout: 10000 },
      )
      .toBeLessThanOrEqual(1);

    // 3. The scrollable ancestor then scrolls...
    await expect
      .poll(() => ancestor.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(ancestorScrollTopStart);

    // 4. ...and reaches its own native limit.
    await expect
      .poll(
        () =>
          ancestor.evaluate((el) => Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight))),
        { timeout: 10000 },
      )
      .toBeLessThanOrEqual(1);

    // 5. The document viewport then scrolls.
    await expect
      .poll(() => documentViewport.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(documentScrollTopStart);

    const documentScrollTopSettled = await waitForStableScrollTop(documentViewport);
    const containerScrollTopBeforeRelease = await container.evaluate((el) => el.scrollTop);
    const ancestorScrollTopBeforeRelease = await ancestor.evaluate((el) => el.scrollTop);

    // 6. Releasing the pointer stops all later scrolling, at every level.
    await page.mouse.up();

    const containerReleaseSamples = await sampleScrollTop(page, container);
    assertScrollTopHoldsAtBaseline(containerReleaseSamples, containerScrollTopBeforeRelease);

    const ancestorReleaseSamples = await sampleScrollTop(page, ancestor);
    assertScrollTopHoldsAtBaseline(ancestorReleaseSamples, ancestorScrollTopBeforeRelease);

    const documentReleaseSamples = await sampleScrollTop(page, documentViewport);
    assertScrollTopHoldsAtBaseline(documentReleaseSamples, documentScrollTopSettled);
  });
});
