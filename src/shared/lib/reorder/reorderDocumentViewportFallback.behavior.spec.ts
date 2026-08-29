import { expect, test, type Page } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

const STORY_ID = 'shared-lib-reorder-reorderdocumentviewportstoryharness--default';

const CONTAINER_SELECTOR = '[aria-label="Document viewport reorder items"]';
const ANCESTOR_SELECTOR = '[aria-label="Reorder scroll ancestor"]';

const assertNoForwardScrollAfterRelease = (samples: number[], baseline: number): void => {
  expect(samples).not.toHaveLength(0);
  const message = `scrollTop samples: ${samples.join(', ')}, pointer-up baseline: ${baseline}`;

  expect(Math.max(...samples) - baseline, message).toBeLessThanOrEqual(1);

  for (let index = 1; index < samples.length; index += 1) {
    expect(samples[index] - samples[index - 1], message).toBeLessThanOrEqual(1);
  }

  const settledTail = samples.slice(-4);
  expect(Math.max(...settledTail) - Math.min(...settledTail), message).toBeLessThanOrEqual(1);
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
  /** Real rendered frames spent waiting for `document.scrollingElement`'s `scrollTop` to first move. */
  documentMoveFrames: number;
  /** `document.scrollingElement`'s remaining native scroll room the instant its movement was first detected. */
  remainingRoom: number;
  /** `document.scrollingElement`'s `scrollTop` sampled once per rendered frame, starting from the first detected move. */
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
 * `document.scrollingElement`'s `scrollTop` trace.
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
      const docEl = document.scrollingElement;
      if (!containerEl || !ancestorEl || !docEl) {
        throw new Error('missing reorder container, ancestor, or document scrolling element');
      }

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

interface ReleaseScrollPositions {
  container: number;
  ancestor: number;
  document: number;
}

interface ReleaseScrollSamples {
  container: number[];
  ancestor: number[];
  document: number[];
}

interface ReleaseScrollObservation {
  baseline: ReleaseScrollPositions;
  samples: ReleaseScrollSamples;
}

declare global {
  interface Window {
    /** Pending release observation stashed by {@link armReleaseScrollObserver} for {@link awaitReleaseScrollObserver}. */
    reorderReleaseScrollObservation?: Promise<ReleaseScrollObservation>;
  }
}

/**
 * Installs a capture-phase `pointerup` observer and waits for the browser to confirm it is
 * registered before returning. The pending observation promise is stashed on `window` rather than
 * returned directly, so this call resolves as soon as the listener is armed instead of waiting for
 * `pointerup` itself — removing the window in which a real `page.mouse.up()` could fire before the
 * browser-side listener exists.
 * @param page - The Playwright page driving the drag.
 * @param frameCount - Number of rendered frames to sample after pointer release.
 * @returns Resolves once the browser-side `pointerup` observer is armed.
 */
const armReleaseScrollObserver = (page: Page, frameCount = 10): Promise<void> =>
  page.evaluate(
    (args) => {
      const containerEl = document.querySelector(args.containerSelector);
      const ancestorEl = document.querySelector(args.ancestorSelector);
      const docEl = document.scrollingElement;
      if (!containerEl || !ancestorEl || !docEl) {
        throw new Error('missing reorder container, ancestor, or document scrolling element');
      }

      const readPositions = (): ReleaseScrollPositions => ({
        container: containerEl.scrollTop,
        ancestor: ancestorEl.scrollTop,
        document: docEl.scrollTop,
      });

      window.reorderReleaseScrollObservation = new Promise<ReleaseScrollObservation>((resolve) => {
        window.addEventListener(
          'pointerup',
          () => {
            const baseline = readPositions();
            const samples: ReleaseScrollSamples = {
              container: [],
              ancestor: [],
              document: [],
            };
            let capturedFrames = 0;

            const captureNextFrame = () => {
              requestAnimationFrame(() => {
                const positions = readPositions();
                samples.container.push(positions.container);
                samples.ancestor.push(positions.ancestor);
                samples.document.push(positions.document);
                capturedFrames += 1;

                if (capturedFrames >= args.frameCount) {
                  resolve({ baseline, samples });
                  return;
                }

                captureNextFrame();
              });
            };

            captureNextFrame();
          },
          { capture: true, once: true },
        );
      });
    },
    { containerSelector: CONTAINER_SELECTOR, ancestorSelector: ANCESTOR_SELECTOR, frameCount },
  );

/**
 * Awaits the release observation armed by {@link armReleaseScrollObserver}, returning its
 * pointer-up baselines and aligned post-release samples for all three scroll levels.
 * @param page - The Playwright page driving the drag.
 * @returns Pointer-up baselines and aligned post-release samples for all three scroll levels.
 */
const awaitReleaseScrollObserver = (page: Page): Promise<ReleaseScrollObservation> =>
  page.evaluate(() => {
    const observation = window.reorderReleaseScrollObservation;
    if (!observation) {
      throw new Error('release scroll observer was not armed before release');
    }
    return observation;
  });

test.describe('document viewport autoscroll fallback', () => {
  test('a drag uses the container, its ancestor, and the real document viewport, and release stops all three', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, STORY_ID);

    const container = page.getByRole('list', { name: 'Document viewport reorder items' });
    const ancestor = page.getByRole('region', { name: 'Reorder scroll ancestor' });
    const firstItem = page.getByRole('listitem', { name: 'row-0', exact: true });

    // The reorder library's autoscroll fallback targets `document.scrollingElement` generically
    // (see ReorderAutoScroller.ts's `candidate.ownerDocument.scrollingElement` check), so this
    // reads the same real element rather than assuming a specific tag: Storybook's isolated
    // Canvas does not pin `html`/`body` to the application's own forced-viewport-height layout.
    const getDocumentExtent = (): Promise<number> =>
      page.evaluate(() => {
        const el = document.scrollingElement;
        return el ? el.scrollHeight - el.clientHeight : 0;
      });
    const getDocumentScrollTop = (): Promise<number> =>
      page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);

    // Preconditions: all three levels have real, independent scroll room, or this would not
    // actually exercise the document-viewport fallback scenario.
    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    const ancestorExtent = await ancestor.evaluate((el) => el.scrollHeight - el.clientHeight);
    const documentExtent = await getDocumentExtent();
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
    const documentScrollTopStart = await getDocumentScrollTop();

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

    // 7. Arm browser-side release observation and wait for the browser to confirm the listener is
    // registered before dispatching the real pointer-up — otherwise pointerup could fire before
    // the listener exists. The armed observer still captures the exact event-boundary baseline
    // without a further Node round trip, then proves that no scroll level resumes forward
    // autoscroll while any reverse browser correction settles.
    await armReleaseScrollObserver(page);
    await page.mouse.up();
    const releaseObservation = await awaitReleaseScrollObserver(page);
    await expect(firstItem).not.toHaveClass(/_dragging/);

    assertNoForwardScrollAfterRelease(
      releaseObservation.samples.container,
      releaseObservation.baseline.container,
    );
    assertNoForwardScrollAfterRelease(
      releaseObservation.samples.ancestor,
      releaseObservation.baseline.ancestor,
    );
    assertNoForwardScrollAfterRelease(
      releaseObservation.samples.document,
      releaseObservation.baseline.document,
    );
  });
});
