import { expect, test } from '@playwright/test';
import { openStory } from './storybook';

test('MDFabContainer FAB stays anchored to pane bottom after async content loads', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdfabcontainer--pane-anchoring-loading-transition');

  const pane = page.locator('#fab-test-pane');
  const fabSurface = page.locator('.md-fab-container__surface');

  // Wait for Floating UI to position the FAB surface
  await fabSurface.waitFor({ state: 'attached' });

  const paneBoxBefore = await pane.boundingBox();
  const fabBoxBefore = await fabSurface.boundingBox();

  expect(paneBoxBefore).not.toBeNull();
  expect(fabBoxBefore).not.toBeNull();

  if (!paneBoxBefore || !fabBoxBefore) {
    throw new Error('Missing bounding boxes for FAB pane anchoring test (loading state).');
  }

  // FAB surface bottom should align with the pane container bottom (within 1px rounding)
  expect(fabBoxBefore.y + fabBoxBefore.height).toBeCloseTo(
    paneBoxBefore.y + paneBoxBefore.height,
    0,
  );

  // Record FAB position relative to pane bottom in loading state
  const fabRelativeBottomBefore = paneBoxBefore.y + paneBoxBefore.height - fabBoxBefore.y;

  // Trigger content load: placeholder jumps from 80px loading height to 6 * 48px content height
  await page.click('#fab-load-content');

  // Wait for Floating UI autoUpdate to settle after the layout shift
  await page.waitForTimeout(200);

  const paneBoxAfter = await pane.boundingBox();
  const fabBoxAfter = await fabSurface.boundingBox();

  expect(paneBoxAfter).not.toBeNull();
  expect(fabBoxAfter).not.toBeNull();

  if (!paneBoxAfter || !fabBoxAfter) {
    throw new Error('Missing bounding boxes for FAB pane anchoring test (loaded state).');
  }

  // FAB surface must remain anchored to pane bottom after the layout shift
  expect(fabBoxAfter.y + fabBoxAfter.height).toBeCloseTo(paneBoxAfter.y + paneBoxAfter.height, 0);

  // The FAB's position relative to pane bottom must not change after content loads
  const fabRelativeBottomAfter = paneBoxAfter.y + paneBoxAfter.height - fabBoxAfter.y;
  expect(Math.abs(fabRelativeBottomAfter - fabRelativeBottomBefore)).toBeLessThanOrEqual(1);

  // FAB button must be visible and within the pane bounds
  const fab = page.getByRole('button', { name: 'Add', exact: true });
  const fabButtonBox = await fab.boundingBox();

  expect(fabButtonBox).not.toBeNull();

  if (!fabButtonBox) {
    throw new Error('FAB button not visible after content load.');
  }

  expect(fabButtonBox.y).toBeGreaterThan(paneBoxAfter.y);
  expect(fabButtonBox.y + fabButtonBox.height).toBeLessThanOrEqual(
    paneBoxAfter.y + paneBoxAfter.height + 1,
  );
});
