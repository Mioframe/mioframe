import { expect, test, type Page } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderdocumentviewportstoryharness--default';

const CONTAINER_SELECTOR = '[aria-label="Document viewport reorder items"]';
const ANCESTOR_SELECTOR = '[aria-label="Reorder scroll ancestor"]';

const assertScrollTopHoldsAtBaseline = (samples: number[], baseline: number): void => {
  for (const sample of samples) {
    expect(
      Math.abs(sample - baseline),
      `scrollTop samples: ${samples.join(', ')}, baseline: ${baseline}`,
    ).toBeLessThanOrEqual(1);
  }
};

const assertViewportSettlesWithoutResuming = (samples: number[]): void => {
  const first = samples.at(0);
  const last = samples.at(-1);
  expect(first).not.toBeUndefined();
  expect(last).not.toBeUndefined();
  expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(3);
  expect(last ?? 0).toBeLessThanOrEqual(first ?? 0);
};

interface DragProgressionResult {
  /** Real rendered frames spent waiting for the container's `scrollTop` to first move. */
  containerMoveFrames: number;
  /** Real rendered frames spent waiting for the container to reach its own native scroll limit. */
  containerMaxFrames: number;
  /** Real rendered frames spent waiting for the ancestor's `scrollTop` to first move. */
  ancestorMoveFrames: number;
  /** Real rendered frames spent waiting for the ancestor to reach its own native scroll limit. */
  ancestorMaxFrames: number;
  /** Real rendered frames spent waiting for `document.body.scrollTop` to first move. */
  documentMoveFrames: number;
  /** `document.body`'s remaining native scroll room the instant its movement was first detected. */
  remainingRoom: number;
  /** `document.body.scrollTop` sampled once per rendered frame, starting from the first detected move. */
  samples: number[];
}

/**
 * Drives and observes the whole drag progression — container scrolls and maxes out, ancestor
 * scrolls and maxes out, the document scrolls, then samples it for a few more frames — as one
 * continuous native loop inside the page, driven only by the page's own `requestAnimationFrame`.
 *
 * The autoscroll loop itself runs as fast as the page can render; a real per-frame progression
 * can advance, and even fully converge, faster than a single Node-to-browser round trip (e.g. an
 * `expect.poll` check, or a fresh `page.evaluate` call per step) takes to complete. Splitting this
 * across several round trips leaves gaps in which the loop keeps running unobserved, so by the
 * time a later step starts watching, an earlier one may already be long finished. Running the
 * whole sequence in one round trip removes every such gap.
 * @param page - The Playwright page driving the drag.
 * @param args - Baseline scroll positions, viewport height, and per-phase frame budgets.
 * @returns Per-phase frame counts, the document's remaining room, and the sampled
 * `document.body.scrollTop` trace.
 */
const observeDragProgression = (
  page: Page,
  args: {
    containerScrollTopStart: number;
    ancestorScrollTopStart: number;
    documentScrollTopStart: number;
    viewportHeight: number;
    extraFrames: number;
    maxFramesPerPhase: number;
  },
): Promise<DragProgressionResult> =>
  page.evaluate(
    (p) => {
      const containerEl = document.querySelector(p.containerSelector);
      const ancestorEl = document.querySelector(p.ancestorSelector);
      if (!containerEl || !ancestorEl) {
        throw new Error('missing reorder container or ancestor element');
      }
      const docEl = document.body;

      const nextFrame = () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            resolve();
          });
        });

      const waitForCondition = async (isDone: () => boolean): Promise<number> => {
        let frames = 0;
        while (!isDone() && frames < p.maxFramesPerPhase) {
          frames += 1;
          // eslint-disable-next-line no-await-in-loop -- each frame must render before the next
          await nextFrame();
        }
        return frames;
      };

      const isAtNativeLimit = (el: Element): boolean =>
        Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)) <= 1;

      return (async () => {
        // 1. The inner reorder container scrolls first...
        const containerMoveFrames = await waitForCondition(
          () => containerEl.scrollTop > p.containerScrollTopStart,
        );
        // 2. ...and reaches its own native limit.
        const containerMaxFrames = await waitForCondition(() => isAtNativeLimit(containerEl));

        // 3. The scrollable ancestor then scrolls...
        const ancestorMoveFrames = await waitForCondition(
          () => ancestorEl.scrollTop > p.ancestorScrollTopStart,
        );
        // 4. ...and reaches its own native limit.
        const ancestorMaxFrames = await waitForCondition(() => isAtNativeLimit(ancestorEl));

        // 5. The document viewport also participates when the physical surface reaches its edge.
        const documentMoveFrames = await waitForCondition(
          () => docEl.scrollTop > p.documentScrollTopStart,
        );

        const remainingRoom = docEl.scrollHeight - docEl.clientHeight - docEl.scrollTop;

        // 6. Sample subsequent frames to prove the viewport stops once it has revealed the
        // physical container edge, even though it retains native scroll room.
        const samples: number[] = [docEl.scrollTop];
        for (let frame = 1; frame < p.extraFrames; frame += 1) {
          // eslint-disable-next-line no-await-in-loop -- sampling must happen in order, one per frame
          await nextFrame();
          samples.push(docEl.scrollTop);
        }

        return {
          containerMoveFrames,
          containerMaxFrames,
          ancestorMoveFrames,
          ancestorMaxFrames,
          documentMoveFrames,
          remainingRoom,
          samples,
        };
      })();
    },
    { containerSelector: CONTAINER_SELECTOR, ancestorSelector: ANCESTOR_SELECTOR, ...args },
  );

interface ReleaseScrollSamples {
  container: number[];
  ancestor: number[];
  document: number[];
}

// Samples the container's, ancestor's, and `document.body`'s `scrollTop` together, once per
// rendered frame, for `frameCount` frames — all inside one `page.evaluate` call so the first
// reading is captured as close to call time as a Node<->browser round trip allows, and every
// later reading lines up with a real animation frame rather than a separately-timed Node-side
// poll.
const sampleReleaseScrollTops = (page: Page, frameCount = 10): Promise<ReleaseScrollSamples> =>
  page.evaluate(
    (args) => {
      const containerEl = document.querySelector(args.containerSelector);
      const ancestorEl = document.querySelector(args.ancestorSelector);
      if (!containerEl || !ancestorEl) {
        throw new Error('missing reorder container or ancestor element');
      }
      const docEl = document.body;

      const nextFrame = () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            resolve();
          });
        });

      return (async () => {
        const container: number[] = [];
        const ancestor: number[] = [];
        const documentSamples: number[] = [];
        for (let frame = 0; frame < args.frameCount; frame += 1) {
          container.push(containerEl.scrollTop);
          ancestor.push(ancestorEl.scrollTop);
          documentSamples.push(docEl.scrollTop);
          // eslint-disable-next-line no-await-in-loop -- each frame must render before the next
          await nextFrame();
        }
        return { container, ancestor, document: documentSamples };
      })();
    },
    { containerSelector: CONTAINER_SELECTOR, ancestorSelector: ANCESTOR_SELECTOR, frameCount },
  );

test.describe('document viewport autoscroll fallback', () => {
  test('a drag uses the container, its ancestor, and the real document viewport, and release stops all three', async ({
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
    const containerScrollTopStart = await container.evaluate((el) => el.scrollTop);
    const ancestorScrollTopStart = await ancestor.evaluate((el) => el.scrollTop);
    const documentScrollTopStart = await documentViewport.evaluate((el) => el.scrollTop);

    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2);
    await page.mouse.down();
    // Cross the mouse activation distance before probing autoscroll.
    await page.mouse.move(centerX, itemBox.y + itemBox.height / 2 + 8, { steps: 4 });

    // Hold near the real viewport's own bottom edge: the fixture is sized so this is also near
    // the container's and the ancestor's own lower visible edge.
    await page.mouse.move(centerX, viewportSize.height - 2, { steps: 4 });

    // Matches the previous per-step Node-side timeouts (5s/10s at a nominal 60fps), translated to
    // rendered-frame budgets so the whole 1-6 progression can be driven and observed without a
    // Node<->browser round trip between any of its steps.
    const progression = await observeDragProgression(page, {
      containerScrollTopStart,
      ancestorScrollTopStart,
      documentScrollTopStart,
      viewportHeight: viewportSize.height,
      extraFrames: 10,
      maxFramesPerPhase: 600,
    });

    expect(progression.containerMoveFrames, 'container scrollTop never moved').toBeLessThan(600);
    expect(
      progression.containerMaxFrames,
      'container scrollTop never reached its native limit',
    ).toBeLessThan(600);
    expect(progression.ancestorMoveFrames, 'ancestor scrollTop never moved').toBeLessThan(600);
    expect(
      progression.ancestorMaxFrames,
      'ancestor scrollTop never reached its native limit',
    ).toBeLessThan(600);
    expect(
      progression.documentMoveFrames,
      'document scrollTop never exceeded its starting value',
    ).toBeLessThan(600);

    // The viewport fallback remains valid because it moves, but visibility-first ownership stops
    // it after revealing the physical surface even though meaningful native room remains.
    expect(progression.remainingRoom).toBeGreaterThan(4);
    assertViewportSettlesWithoutResuming(progression.samples);

    // 7. Releasing the pointer keeps all three levels stopped and runs drag cleanup.
    await page.mouse.up();

    const releaseSamples = await sampleReleaseScrollTops(page);

    const containerBaseline = releaseSamples.container.at(0);
    const ancestorBaseline = releaseSamples.ancestor.at(0);
    const documentBaseline = releaseSamples.document.at(0);
    if (
      containerBaseline === undefined ||
      ancestorBaseline === undefined ||
      documentBaseline === undefined
    ) {
      throw new Error('missing post-release scrollTop baseline');
    }

    assertScrollTopHoldsAtBaseline(releaseSamples.container, containerBaseline);
    assertScrollTopHoldsAtBaseline(releaseSamples.ancestor, ancestorBaseline);
    assertScrollTopHoldsAtBaseline(releaseSamples.document, documentBaseline);
  });
});
