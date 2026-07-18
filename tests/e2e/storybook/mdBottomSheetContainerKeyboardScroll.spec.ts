import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-ui-sheets-mdbottomsheetcontainerkeyboardscrollstoryharness--default';

// The sheet's open-reveal scroll (see `MDBottomSheetContainer2.vue`'s `openModel`/`bodyHeight`
// watcher) animates with `behavior: 'smooth'`. Wait for it to settle before driving keyboard
// navigation, the same frame-sampling convention used by the reorder autoscroll specs.
const waitForScrollSettled = async (scrollable: Locator, stableFrames = 6): Promise<void> =>
  scrollable.evaluate(async (el, requiredStableFrames) => {
    let last = el.scrollTop;
    let stableCount = 0;
    while (stableCount < requiredStableFrames) {
      // eslint-disable-next-line no-await-in-loop -- each check must follow exactly one rendered frame
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (el.scrollTop === last) {
        stableCount += 1;
      } else {
        stableCount = 0;
        last = el.scrollTop;
      }
    }
  }, stableFrames);

test.describe('MDBottomSheetContainer2 keyboard focus wrap visibility', () => {
  test('Tab and Shift+Tab wrap-around keeps the newly focused control visible in the sheet', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, STORY_ID);

    const scrim = page.getByRole('dialog', { name: 'Keyboard scroll test sheet' });
    await waitForScrollSettled(scrim);

    const firstControl = page.getByRole('button', { name: 'Close sheet' });
    const lastControl = page.getByRole('button', { name: 'Row 29', exact: true });

    await lastControl.focus();
    await expect(lastControl).toBeFocused();
    await expect(lastControl).toBeInViewport();

    await page.keyboard.press('Tab');

    await expect(firstControl).toBeFocused();
    await expect(firstControl).toBeInViewport();

    await page.keyboard.press('Shift+Tab');

    await expect(lastControl).toBeFocused();
    await expect(lastControl).toBeInViewport();
  });

  test('focusing an already-visible control without pressing Tab does not scroll the sheet', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const scrim = page.getByRole('dialog', { name: 'Keyboard scroll test sheet' });
    await waitForScrollSettled(scrim);

    const scrollTopBeforeFocus = await scrim.evaluate((el) => el.scrollTop);

    const visibleControl = page.getByRole('button', { name: 'Row 0', exact: true });
    await expect(visibleControl).toBeInViewport();

    // A pointer-driven (or otherwise non-Tab) focus change must not trigger the keyboard-only
    // scroll correction — matching a reorder drag's own focus movement, which must keep going
    // through the existing `preventScroll: true` path untouched.
    await visibleControl.focus();
    await expect(visibleControl).toBeFocused();

    expect(await scrim.evaluate((el) => el.scrollTop)).toBe(scrollTopBeforeFocus);
  });
});
