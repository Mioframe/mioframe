import { expect, test, type Page } from '@playwright/test';
import { openStory } from './storybook.testUtils';

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
  /** `document.scrollingElement.scrollTop` sampled once per rendered frame, starting from the first detected move. */
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
 * `document.scrollingElement.scrollTop` trace.
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
    __releaseScrollObservation?: Promise<ReleaseScrollObservation>;
  }
}

/**
 * Arms a capture-phase `pointerup` observer and returns only once the listener is actually
 * installed in the browser. The observer's result promise is stashed on `window` rather than
 * returned directly, so this call's own round trip cannot race a `page.mouse.up()` dispatched
 * immediately afterward — the previous single-call shape returned a promise that resolved only
 * after `pointerup` fired, letting `mouse.up()` reach the browser before the listener was armed.
 * @param page - The Playwright page driving the drag.
 * @param frameCount - Number of rendered frames to sample after pointer release.
 * @returns Resolves once the capture-phase listener is installed.
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

      window.__releaseScrollObservation = new Promise<ReleaseScrollObservation>((resolve) => {
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
 * Reads the result of an already-armed {@link armReleaseScrollObserver} listener. Must be called
 * after the real `pointerup` has been dispatched (e.g. via `page.mouse.up()`).
 * @param page - The Playwright page driving the drag.
 * @returns Pointer-up baselines and aligned post-release samples for all three scroll levels.
 */
const readReleaseScrollObservation = (page: Page): Promise<ReleaseScrollObservation> =>
  page.evaluate(() => {
    const observation = window.__releaseScrollObservation;
    if (!observation) {
      throw new Error('release scroll observer was not armed before reading its result');
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

    // The Storybook preview canvas is an isolated iframe document: this app's global layout
    // override that pins `html` to exactly one viewport tall with its own `overflow: auto` does
    // not apply inside it, so `document.scrollingElement` is the real, standard scrolling element
    // for page-level content here — the true "document viewport" for this scenario.
    const readDocumentScrollingElementExtent = (): Promise<number> =>
      page.evaluate(() => {
        const el = document.scrollingElement;
        if (!el) {
          throw new Error('missing document.scrollingElement');
        }
        return el.scrollHeight - el.clientHeight;
      });
    const readDocumentScrollingElementScrollTop = (): Promise<number> =>
      page.evaluate(() => {
        const el = document.scrollingElement;
        if (!el) {
          throw new Error('missing document.scrollingElement');
        }
        return el.scrollTop;
      });

    // Preconditions: all three levels have real, independent scroll room, or this would not
    // actually exercise the document-viewport fallback scenario.
    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    const ancestorExtent = await ancestor.evaluate((el) => el.scrollHeight - el.clientHeight);
    const documentExtent = await readDocumentScrollingElementExtent();
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
    const documentScrollTopStart = await readDocumentScrollingElementScrollTop();

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

    // 7. Arm browser-side release observation and wait for the listener to actually be installed
    // before dispatching pointer-up, then read its already-armed result. This captures the exact
    // event-boundary baseline without a race between listener installation and the real
    // `pointerup`, and proves that no scroll level resumes forward autoscroll while any reverse
    // browser correction settles.
    await armReleaseScrollObserver(page);
    await page.mouse.up();
    const releaseObservation = await readReleaseScrollObservation(page);
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
